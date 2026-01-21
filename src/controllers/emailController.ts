import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { redisConnection } from '../queue';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailWorker = new Worker(
  'email-queue',
  async (job: Job) => {
    const { jobId, recipient, subject, body, hourlyLimit } = job.data;
    const senderEmail = process.env.SMTP_USER;

    // Rate Limiting Logic using Redis Atomic Counters
    const currentHour = new Date().toISOString().split(':')[0];
    const rateLimitKey = `ratelimit:${senderEmail}:${currentHour}`;
    const currentCount = await redisConnection.incr(rateLimitKey);
    
    if (currentCount === 1) await redisConnection.expire(rateLimitKey, 3600);

    if (currentCount > Number(hourlyLimit)) {
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      await job.moveToDelayed(nextHour.getTime(), job.token);
      throw new Error('Rate limit exceeded');
    }

    try {
      await transporter.sendMail({
        from: `"purabhReachInbox" <${senderEmail}>`,
        to: recipient,
        subject,
        html: body,
      });

      await prisma.emailJob.update({
        where: { id: jobId },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (error) {
      await prisma.emailJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', error: (error as Error).message },
      });
      throw error;
    }
  },
  { 
    connection: redisConnection as any,
    concurrency: 5 
  }
);
