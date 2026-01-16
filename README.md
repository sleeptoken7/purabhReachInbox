# purabhReachInbox - Full-stack Email Job Scheduler

# https://purabh-reachinbox.vercel.app/

A production-grade email scheduling service built for the ReachInbox hiring assignment. This application allows users to schedule bulk email campaigns with smart rate-limiting, concurrency control, and persistence across server restarts.

## 🚀 Demo & Documentation

- **Demo Video:**  https://drive.google.com/file/d/1KwSUloVCTV0Jy5QU9MG6HDf1AhaotAo-/view?usp=sharing

- **Architecture:** Modular Monolith (Express.js + Next.js)

## 🧪 Tech Requirements Implemented

- **Backend:** TypeScript, Express.js
- **Queue:** BullMQ (backed by Redis) - **No Cron Jobs used.**
- **Database:** PostgreSQL (Prisma ORM)
- **SMTP:** Ethereal Email (Fake SMTP)
- **Frontend:** Next.js 14, Tailwind CSS, TypeScript
- **Auth:** Real Google OAuth integration

## 🛠 Key Features & Logic

### 1. Reliable Scheduling (No-Cron)

Instead of polling the database, we use **BullMQ's delayed jobs**. When an email is scheduled, we calculate the exact delay and push it to Redis. This is more performant and scalable than traditional cron jobs.

### 2. Persistence on Restart

All jobs are stored in **Redis** and mirrored in **PostgreSQL**. If the server crashes or restarts, BullMQ automatically resumes pending jobs from Redis without losing data or duplicating emails.

### 3. Smart Rate Limiting

Implemented an hourly limit per sender using **Redis atomic counters**.

- **Logic:** Before sending, the worker increments a key `ratelimit:sender:hour`.
- **Handling Limits:** If the limit is exceeded, the job is not failed; it is moved back to the "delayed" state and rescheduled for the start of the next hour window.

### 4. Worker Concurrency

Configured with a concurrency of **5**, allowing the system to process multiple emails in parallel safely.

## ⚙️ How to Run Locally

### 1. Prerequisites

- Node.js v18+
- Redis (`brew services start redis`)
- PostgreSQL (Postgres.app running)

### 2. Backend Setup

```bash
cd apps/backend
npm install
# Configure .env with your Postgres, Redis, and Ethereal credentials
npx prisma migrate dev
npm run dev
```


### 3. Frontend Setup

cd apps/frontend ;
npm install

npm run dev
