import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import emailRoutes from './routes/emailRoutes';
import './workers/emailWorker'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/emails', emailRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👷 Worker is active and listening for jobs...`);
});
