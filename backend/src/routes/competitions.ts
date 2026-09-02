import express from 'express';
import {
  createCompetition,
  getCompetitions,
  getCompetition,
  getCompetitionDetails,
  getSolvedChallenges,
  getCompetitionLeaderboard,
  getCompetitionActivity,
  getCompetitionChallengeSolvers,
  updateCompetitionStatus,
  updateCompetitionStartTime,
  submitCompetitionFlag,
  addChallengeToCompetition,
  publishCompetitionHint,
  buyCompetitionHint,
  deleteCompetition,
  removeChallengeFromCompetition,
  validateSecurityCode
} from '../controllers/competitionController';
import { authenticate, requireAdmin } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Regular challenges have had a submission limiter since forever; the
// competition route — the one that matters during a live event — had none, so
// flag guessing was unbounded there.
const competitionFlagLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: { error: 'Too many flag submissions, please try again later after 10 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// validate-code is an oracle: it says whether any six-character guess is a real
// competition code, across the whole university. Unthrottled, that is brute
// force at network speed.
const securityCodeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: 'Too many security code attempts, please try again later after 10 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', authenticate, getCompetitions);
router.post('/validate-code', authenticate, securityCodeLimiter, validateSecurityCode);
router.post('/', authenticate, requireAdmin, createCompetition);
router.get('/:id', authenticate, getCompetition);
router.get('/:id/details', authenticate, getCompetitionDetails);
router.get('/:id/solved-challenges', authenticate, getSolvedChallenges);
router.get('/:id/leaderboard', authenticate, getCompetitionLeaderboard);
router.get('/:id/activity', authenticate, getCompetitionActivity);
router.get('/:id/challenges/:challengeId/solvers', authenticate, getCompetitionChallengeSolvers);
router.patch('/:id/status', authenticate, requireAdmin, updateCompetitionStatus);
router.patch('/:id/start', authenticate, requireAdmin, updateCompetitionStartTime);
router.post('/:id/challenges', authenticate, requireAdmin, addChallengeToCompetition);
router.delete('/:id/challenges/:challengeId', authenticate, requireAdmin, removeChallengeFromCompetition);
router.delete('/:id', authenticate, requireAdmin, deleteCompetition);
router.post('/:id/submit', authenticate, competitionFlagLimiter, submitCompetitionFlag);
router.post('/:id/challenges/:challengeId/publish-hint', authenticate, requireAdmin, publishCompetitionHint);
router.post('/:id/challenges/:challengeId/buy-hint', authenticate, buyCompetitionHint);

export default router;
