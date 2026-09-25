import express from 'express';
import { getRecentActivity } from '../controllers/activityController';
import { authenticate } from '../middleware/auth';
import { heavyReadLimiter } from '../middleware/rateLimit';

const router = express.Router();

// Recomputes recent solves across every user in the university on each call.
router.get('/recent', authenticate, heavyReadLimiter, getRecentActivity);

export default router;
