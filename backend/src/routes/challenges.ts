import express from 'express';
import rateLimit from 'express-rate-limit'; // Import rateLimit
import {
  getChallenges,
  getAllChallenges,
  getChallenge,
  getChallengeSolvers,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  submitFlag,
  copyChallengeToUniversity,
  integrateCompetitionChallenge,
  updateWriteup,
  uploadWriteupPdfController,
  uploadChallengeFilesController,
  publishHint,
  publishChallenge,
  unpublishChallenge,
  applyRetroactiveDecayToAll,
  applyRetroactiveDecayToChallenge
} from '../controllers/challengeController';
import { authenticate, requireAdmin, authenticateSuperAdmin } from '../middleware/auth';
import { perPlayerKey, flagAddressLimiter } from '../middleware/rateLimit';

const router = express.Router();

// Flag submission: 50 per 10 minutes, keyed per player rather than per IP so a
// shared campus address is not one bucket (flagAddressLimiter is the per-IP
// backstop above it). Matches the event system's per-player submission limit.
const flagSubmissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50,
  keyGenerator: perPlayerKey,
  message: { error: 'Too many flag submissions, please try again later after 10 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', authenticate, getChallenges);
router.get('/all', authenticate, requireAdmin, getAllChallenges);
router.get('/:id', authenticate, getChallenge);
router.get('/:id/solvers', authenticate, getChallengeSolvers);
router.post('/', authenticate, requireAdmin, createChallenge);
router.put('/:id', authenticate, requireAdmin, updateChallenge);
router.delete('/:id', authenticate, requireAdmin, deleteChallenge);
router.post('/:id/submit', authenticate, flagAddressLimiter, flagSubmissionLimiter, submitFlag);
router.post('/:id/copy', authenticate, authenticateSuperAdmin, copyChallengeToUniversity);
router.post('/integrate/:competitionId/:challengeId', authenticate, requireAdmin, integrateCompetitionChallenge);
router.put('/:id/writeup', authenticate, requireAdmin, updateWriteup);
router.post('/upload-writeup-pdf', authenticate, requireAdmin, uploadWriteupPdfController);
router.post('/upload-files', authenticate, requireAdmin, uploadChallengeFilesController);
router.post('/:id/publish-hint', authenticate, requireAdmin, publishHint);
router.post('/:id/publish', authenticate, requireAdmin, publishChallenge);
router.post('/:id/unpublish', authenticate, requireAdmin, unpublishChallenge);
router.post('/apply-retroactive-decay', authenticate, requireAdmin, applyRetroactiveDecayToAll);
router.post('/:id/apply-retroactive-decay', authenticate, requireAdmin, applyRetroactiveDecayToChallenge);

export default router;
