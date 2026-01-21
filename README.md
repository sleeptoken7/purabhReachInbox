# purabhReachInbox - Full-stack Email Job Scheduler

# https://purabh-reachinbox.vercel.app/

# ReachInbox Full-Stack Email Scheduler (Production Grade)

## 🏗 System Architecture & Backend Explanation

The core of this system is a **Distributed Task Queue** architecture designed for high-throughput email outreach.

### 1. The "No-Cron" Scheduling Logic
Unlike traditional systems that poll a database every minute (Cron), this system uses **BullMQ's Delayed Job** mechanism. 
- **How it works:** When a user schedules 100 emails with a 5-second delay, the backend calculates the exact timestamp for each email.
- **The Benefit:** This is O(1) performance. Redis handles the timing internally using a sorted set, which is significantly more scalable than running a database query every minute.

### 2. Resilience & Persistence
- **State Management:** All jobs are persisted in **Upstash Redis**. If the Node.js process crashes or the Render server restarts, the jobs remain in Redis.
- **Idempotency:** Upon restart, the BullMQ workers automatically re-attach to the queue and resume processing from the exact millisecond they stopped.

### 3. Smart Rate Limiting (Atomic Counters)
To protect sender reputation, I implemented an hourly rate limit:
- **Implementation:** Uses Redis `INCR` (atomic increment) on a key formatted as `ratelimit:sender:hour_timestamp`.
- **Overflow Handling:** If the limit is reached, the worker uses `job.moveToDelayed()` to push the job into the next available hour window, preserving the order of the campaign.

### 4. Concurrency Control
The system is configured with a **Concurrency of 5**. This allows the worker to handle multiple SMTP connections in parallel without blocking the event loop, maximizing throughput while respecting Ethereal SMTP limits.

## 🛠 Tech Stack
- **Frontend:** Next.js 14, Tailwind CSS, NextAuth (Google OAuth)
- **Backend:** Node.js, Express, TypeScript
- **Infrastructure:** BullMQ, Redis (Upstash), PostgreSQL (Neon), Prisma ORM  Step 4: The "New" Demo Video
Record a new video. Do not just show the app. You must talk like an engineer.
1. Show the Code: Open src/queue.ts and say: "I chose BullMQ over Cron because it provides a persistent, distributed state that survives server restarts." 
2. Show the Rate Limiter: Open src/workers/emailWorker.ts and say: "I'm using Redis atomic counters to ensure that even with multiple workers, we never exceed the hourly limit per sender." 
3. Show the UI: Show the new sidebar layout and say: "I've updated the UI to match the ReachInbox design system for a professional SaaS experience." 
