import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined in environment variables");
}

// This configuration is required for Upstash + BullMQ
export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  // Force TLS if using rediss://
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  connectTimeout: 10000, // 10 seconds timeout
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redisConnection.on('error', (err) => console.error('Redis Connection Error:', err));

export const emailQueue = new Queue('email-queue', {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
  },
});
