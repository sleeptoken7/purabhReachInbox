import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { emailQueue } from '../queue';

const prisma = new PrismaClient();

export const scheduleEmails = async (req: Request, res: Response) => {
  try {
    const { recipients, subject, body, startTime, delayBetweenEmails, hourlyLimit } = req.body;
    
    // 1. ENSURE USER EXISTS (Fixes the 500 Error)
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

    const startTimestamp = new Date(startTime).getTime();
    const scheduledJobs = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const individualDelay = (startTimestamp - Date.now()) + (i * delayBetweenEmails * 1000);
      
      // 2. Create Job in DB
      const dbJob = await prisma.emailJob.create({
        data: {
          userId,
          recipient,
          subject,
          body,
          status: 'SCHEDULED',
          scheduledAt: new Date(startTimestamp + (i * delayBetweenEmails * 1000)),
          senderEmail: process.env.SMTP_USER || "test@example.com",
        },
      });

      // 3. Add to BullMQ
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
          delay: Math.max(0, individualDelay),
          jobId: dbJob.id 
        }
      );
      scheduledJobs.push(dbJob);
    }

    return res.status(201).json({ message: "Success", jobs: scheduledJobs });
  } catch (error: any) {
    console.error("DETAILED BACKEND ERROR:", error);
    return res.status(500).json({ 
      error: 'Failed to schedule emails', 
      details: error.message 
    });
  }
};

export const getJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.emailJob.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};
