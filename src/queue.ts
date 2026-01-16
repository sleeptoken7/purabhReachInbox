import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Connect to Redis
export const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Required by BullMQ
});

// Create the main email queue
export const emailQueue = new Queue('email-queue', {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3, // Retry 3 times if it fails
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: false, // Keep in Redis so we can see "Sent" status
    removeOnFail: false,
  },
});