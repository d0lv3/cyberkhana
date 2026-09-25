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
import { perPlayerKey, flagAddressLimiter, heavyReadLimiter } from '../middleware/rateLimit';
import { dispatchEvent, getEventInvitations } from '../controllers/eventCompetitionController';
import { getPublicResults, publicPageLimiter, verifyCertificate } from '../controllers/eventPublicController';

const router = express.Router();

// Workshop flag submission: 50 per 10 minutes, keyed per player (with the
// per-IP flagAddressLimiter as a backstop) so a shared campus address is not
// one bucket — the same shape as the regular and event submission limits.
const competitionFlagLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  keyGenerator: perPlayerKey,
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

// Public pages: no sign-in, so they are declared before `/:id` puts every route behind authenticate.
router.get('/certificates/:code', publicPageLimiter, verifyCertificate);
router.get('/:id/results', publicPageLimiter, getPublicResults);

router.get('/', authenticate, getCompetitions);
router.get('/invitations', authenticate, requireAdmin, getEventInvitations);
router.post('/validate-code', authenticate, securityCodeLimiter, validateSecurityCode);
router.post('/', authenticate, requireAdmin, createCompetition);
router.use('/:id', authenticate, dispatchEvent);
router.get('/:id', authenticate, getCompetition);
router.get('/:id/details', authenticate, getCompetitionDetails);
router.get('/:id/solved-challenges', authenticate, getSolvedChallenges);
router.get('/:id/leaderboard', authenticate, heavyReadLimiter, getCompetitionLeaderboard);
router.get('/:id/activity', authenticate, heavyReadLimiter, getCompetitionActivity);
router.get('/:id/challenges/:challengeId/solvers', authenticate, getCompetitionChallengeSolvers);
router.patch('/:id/status', authenticate, requireAdmin, updateCompetitionStatus);
router.patch('/:id/start', authenticate, requireAdmin, updateCompetitionStartTime);
router.post('/:id/challenges', authenticate, requireAdmin, addChallengeToCompetition);
router.delete('/:id/challenges/:challengeId', authenticate, requireAdmin, removeChallengeFromCompetition);
router.delete('/:id', authenticate, requireAdmin, deleteCompetition);
router.post('/:id/submit', authenticate, flagAddressLimiter, competitionFlagLimiter, submitCompetitionFlag);
router.post('/:id/challenges/:challengeId/publish-hint', authenticate, requireAdmin, publishCompetitionHint);
router.post('/:id/challenges/:challengeId/buy-hint', authenticate, buyCompetitionHint);

export default router;
