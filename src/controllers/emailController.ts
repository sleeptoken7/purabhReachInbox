import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { emailQueue } from '../queue';

const prisma = new PrismaClient();

export const scheduleEmails = async (req: Request, res: Response) => {
  try {
    const { recipients, subject, body, startTime, delayBetweenEmails, hourlyLimit } = req.body;
    
    // --- ADD THIS BLOCK TO FIX THE ERROR ---
    const userId = "temp-user-id";
    await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        id: userId,
        email: 'test@example.com',
        name: 'Test User'
      }
    });
    // ---------------------------------------

    const startTimestamp = new Date(startTime).getTime();
    // ... rest of your code ...

    const scheduledJobs = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      // Calculate delay for this specific email
      // Formula: (Start Time - Now) + (Index * Delay Between Each)
      const individualDelay = (startTimestamp - Date.now()) + (i * delayBetweenEmails * 1000);
      
      // 1. Save to Database first (Persistence)
      const dbJob = await prisma.emailJob.create({
        data: {
          userId,
          recipient,
          subject,
          body,
          status: 'SCHEDULED',
          scheduledAt: new Date(startTimestamp + (i * delayBetweenEmails * 1000)),
          senderEmail: process.env.SMTP_USER || "",
        },
      });

      // 2. Add to BullMQ
      await emailQueue.add(
        'send-email',
        {
          jobId: dbJob.id,
          recipient,
          subject,
          body,
          hourlyLimit // Pass this to worker for rate limiting
        },
        { 
          delay: Math.max(0, individualDelay), // Ensure delay isn't negative
          jobId: dbJob.id // Use DB ID as BullMQ ID for idempotency
        }
      );

      scheduledJobs.push(dbJob);
    }

    res.status(201).json({ message: `${recipients.length} emails scheduled successfully`, jobs: scheduledJobs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to schedule emails' });
  }
};

export const getJobs = async (req: Request, res: Response) => {
    const jobs = await prisma.emailJob.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
};