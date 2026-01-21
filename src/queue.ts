import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  connectTimeout: 10000,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

export const emailQueue = new Queue('email-queue', {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
  },
});
