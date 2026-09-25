import express from 'express';
import {
  getUsers,
  getUserProfile,
  getPublicProfile,
  getLeaderboard,
  createAdmin,
  promoteToAdmin,
  demoteFromAdmin,
  updateProfile,
  updateProfileIcon,
  banUser,
  unbanUser,
  changeUserPassword,
  deleteUser,
  purchaseHint,
  deductPoints,
  getUserPenalties,
  addPoints
} from '../controllers/userController';
import { authenticate, authenticateSuperAdmin, requireAdmin } from '../middleware/auth';
import { heavyReadLimiter } from '../middleware/rateLimit';

const router = express.Router();

// The leaderboard, a public profile and the user list each load and re-score
// every user in a university, so they carry a per-player read limit.
router.get('/me', authenticate, getUserProfile);
router.get('/leaderboard', authenticate, heavyReadLimiter, getLeaderboard);
router.get('/profile/:userId', authenticate, heavyReadLimiter, getPublicProfile);
router.get('/', authenticate, requireAdmin, heavyReadLimiter, getUsers);
router.get('/:userId/penalties', authenticate, requireAdmin, getUserPenalties);
router.patch('/profile', authenticate, updateProfile);
router.patch('/profile-icon', authenticate, updateProfileIcon);
router.post('/create-admin', authenticate, requireAdmin, createAdmin);
router.post('/promote/:userId', authenticate, authenticateSuperAdmin, promoteToAdmin);
router.post('/demote/:userId', authenticate, authenticateSuperAdmin, demoteFromAdmin);
router.post('/change-password/:userId', authenticate, authenticateSuperAdmin, changeUserPassword);
router.post('/:userId/deduct-points', authenticate, requireAdmin, deductPoints);
router.post('/:userId/add-points', authenticate, authenticateSuperAdmin, addPoints);
router.delete('/:userId', authenticate, authenticateSuperAdmin, deleteUser);
router.post('/ban/:userId', authenticate, requireAdmin, banUser);
router.post('/unban/:userId', authenticate, requireAdmin, unbanUser);
router.post('/purchase-hint', authenticate, purchaseHint);

export default router;
