import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { redisConnection } from '../queue';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// Helper to create a delay (mimic provider throttling)
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

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

    // 1. RATE LIMITING LOGIC
    // Create a unique key for this sender for the current hour
    const currentHour = new Date().toISOString().split(':')[0]; // e.g., "2024-05-20T14"
    const rateLimitKey = `ratelimit:${senderEmail}:${currentHour}`;

    // Increment the counter in Redis
    const currentCount = await redisConnection.incr(rateLimitKey);
    
    // Set expiration for the key (1 hour) so Redis cleans up automatically
    if (currentCount === 1) {
      await redisConnection.expire(rateLimitKey, 3600);
    }

    // Check if limit exceeded
    if (currentCount > Number(hourlyLimit)) {
      console.log(`⚠️ Rate limit hit for ${senderEmail}. Rescheduling job ${jobId}...`);
      
      // Calculate milliseconds until the start of the next hour
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      const delayUntilNextHour = nextHour.getTime() - Date.now();

      // Move job back to delayed state
      await job.moveToDelayed(Date.now() + delayUntilNextHour, job.token);
      throw new Error('Rate limit exceeded, job rescheduled');
    }

    // 2. MINIMUM DELAY (Mimic provider throttling)
    // We wait 2 seconds between every email send
    await delay(2000); 

    try {
      await transporter.sendMail({
        from: `"ReachInbox Scheduler" <${senderEmail}>`,
        to: recipient,
        subject: subject,
        html: body,
      });

      await prisma.emailJob.update({
        where: { id: jobId },
        data: { status: 'SENT', sentAt: new Date() },
      });

      console.log(`✅ [${currentCount}/${hourlyLimit}] Sent to ${recipient}`);
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
    concurrency: 5 // Process 5 emails in parallel
  }
);