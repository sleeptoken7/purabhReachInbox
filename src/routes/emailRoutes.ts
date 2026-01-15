import { Router } from 'express';
import { scheduleEmails, getJobs } from '../controllers/emailController';

const router = Router();

router.post('/schedule', scheduleEmails);
router.get('/jobs', getJobs);

export default router;