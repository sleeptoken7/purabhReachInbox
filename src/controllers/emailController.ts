import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { emailQueue } from '../queue';

const prisma = new PrismaClient();

export const scheduleEmails = async (req: Request, res: Response) => {
  try {
    const { recipients, subject, body, startTime, delayBetweenEmails, hourlyLimit } = req.body;
    
    // 1. Ensure a User exists in the new Cloud DB
    // We use a hardcoded ID for now since we are bypassing full Auth for the API test
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
      
      // 2. Create the Job in Postgres
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

    res.status(201).json({ message: "Success", jobs: scheduledJobs });
  } catch (error) {
    // This will print the EXACT error in your Render logs
    console.error("CRITICAL BACKEND ERROR:", error); 
    
    res.status(500).json({ 
      error: 'Failed to schedule emails', 
      message: (error as Error).message,
      stack: (error as Error).stack 
    });
  }
};
export const getJobs = async (req: Request, res: Response) => {
    const jobs = await prisma.emailJob.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
};