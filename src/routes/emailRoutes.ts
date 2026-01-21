import { Router } from 'express';
import { scheduleEmails, getJobs } from '../controllers/emailController';

const router = Router();

// Ensure these match the exported names in the controller
router.post('/schedule', scheduleEmails);
router.get('/jobs', getJobs);

export default router;
