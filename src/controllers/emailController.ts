import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { emailQueue } from '../queue';

const prisma = new PrismaClient();

export const scheduleEmails = async (req: Request, res: Response) => {
  try {
    const { recipients, subject, body, startTime, delayBetweenEmails, hourlyLimit } = req.body;
    
    // 1. Ensure User exists (Required for Foreign Key)
    const userId = "temp-user-id";
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: "admin@purabhreachinbox.com",
        name: "Admin User"
      }
    });

    // 2. Parse the absolute start time from the frontend
    const startTimestamp = new Date(startTime).getTime();
    const now = Date.now();
    const scheduledJobs = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      // Calculate the exact delay from "Right Now"
      const baseDelay = startTimestamp - now;
      const staggeredDelay = i * delayBetweenEmails * 1000;
      const totalDelay = Math.max(0, baseDelay + staggeredDelay);
      
      // 3. Save to Database
      const dbJob = await prisma.emailJob.create({
        data: {
          userId,
          recipient,
          subject,
          body,
          status: 'SCHEDULED',
          scheduledAt: new Date(startTimestamp + staggeredDelay),
          senderEmail: process.env.SMTP_USER || "test@example.com",
        },
      });

      // 4. Add to BullMQ with calculated relative delay
      await emailQueue.add(
        'send-email',
        {
          jobId: dbJob.id,
          recipient,
          subject,
          body,
          hourlyLimit
        },
        { 
          delay: totalDelay,
          jobId: dbJob.id // Idempotency: prevents duplicate jobs
        }
      );
      scheduledJobs.push(dbJob);
    }

    return res.status(201).json({ message: "Success", jobs: scheduledJobs });
  } catch (error: any) {
    console.error("CRITICAL BACKEND ERROR:", error);
    return res.status(500).json({ 
      error: 'Failed to schedule emails', 
      message: error.message 
    });
  }
};

export const getJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.emailJob.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(jobs);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch jobs" });
  }
};
