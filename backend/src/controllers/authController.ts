import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import SuperAdmin from '../models/SuperAdmin';
import University from '../models/University';
import { generateToken, hashPassword, comparePassword } from '../utils/auth';
import { IJWTPayload } from '../types';
import { AuthRequest } from '../middleware/auth';
import {
  CURRENT_TERMS_VERSION,
  hasAcceptedCurrentTerms,
  CURRENT_AMBASSADOR_AGREEMENT_VERSION,
  hasAcceptedCurrentAmbassadorAgreement
} from '../config/terms';

// The auth cookie used to expire in 24 hours while the JWT inside it was signed
// for 7 days, so the two disagreed for six days out of every seven.
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Clears the auth cookie. Logging out only ever cleared localStorage, leaving a
 * valid cookie behind on the machine — which matters on the shared lab machines
 * this platform runs on.
 */
export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ message: 'Logged out' });
};

// Helper to calculate general stats consistently
// Note: This logic duplicates userController.ts to ensure consistency on login
// ideally this should be a shared utility, but for now we duplicate to avoid major refactors
const calculateGeneralStats = (user: any, regularChallengeMap: Map<string, any>) => {
  // Filter solved challenges to exclude competition challenges
  const nonCompetitionSolvedDetails = (user.solvedChallengesDetails || []).filter((solve: any) => {
    return regularChallengeMap.has(solve.challengeId);
  });

  // Calculate points from non-competition challenges only
  const solvePoints = nonCompetitionSolvedDetails.reduce((total: number, solve: any) => {
    return total + (solve.points || 0);
  }, 0);

  // Deduct penalties for general leaderboard
  const generalPenalties = (user.penalties || [])
    .filter((penalty: any) => penalty.type === 'general')
    .reduce((total: number, penalty: any) => total + (penalty.amount || 0), 0);

  // Deduct costs of unlocked hints for regular challenges
  const hintCosts = (user.unlockedHints || []).reduce((total: number, hintId: string) => {
    // Regular hints are stored as "challengeId-hintIndex"
    const parts = hintId.split('-');
    if (parts.length === 2) {
      const [cId, hIndexStr] = parts;
      const challenge = regularChallengeMap.get(cId);

      if (challenge && challenge.hints) {
        const hIndex = parseInt(hIndexStr, 10);
        if (challenge.hints[hIndex]) {
          return total + (challenge.hints[hIndex].cost || 0);
        }
      }
    }
    return total;
  }, 0);

  // Add bonus points and deduct penalties/hints
  const finalPoints = Math.max(0, solvePoints + (user.bonusPoints || 0) - generalPenalties - hintCosts);

  return {
    points: finalPoints,
    solvePoints,
    solvedCount: nonCompetitionSolvedDetails.length,
    penalties: generalPenalties,
    bonusPoints: user.bonusPoints || 0,
    hintCosts
  };
};

// Validation rules
export const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('universityCode').trim().isLength({ min: 2, max: 10 }).withMessage('University code must be 2-10 characters')
    .matches(/^[A-Z0-9@_-]+$/).withMessage('University code must be alphanumeric uppercase or special characters (@, _, -)'),
  // Checked here as well as in the form, so an account cannot be created by
  // posting straight at the endpoint without the acceptance being recorded.
  // Written as a custom check rather than .equals('true') because the client
  // sends a JSON boolean, and only the string form would survive that.
  body('acceptedTerms')
    .custom((value) => value === true || value === 'true')
    .withMessage('You must accept the Terms of Service to register')
];

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const register = async (req: Request, res: Response) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, fullName, password, universityCode } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const university = await University.findOne({ code: universityCode.toUpperCase() });
    if (!university) {
      return res.status(400).json({ error: 'Invalid university code' });
    }

    const hashedPassword = await hashPassword(password);

    const user = new User({
      username,
      fullName,
      password: hashedPassword,
      universityCode: universityCode.toUpperCase(),
      role: 'user',
      // Stamped from the server clock, not from anything the client sent.
      termsAcceptedAt: new Date(),
      termsVersion: CURRENT_TERMS_VERSION
    });

    await user.save();

    const payload: IJWTPayload = {
      userId: (user._id as any).toString(),
      username: user.username,
      role: user.role,
      universityCode: user.universityCode,
      unlockedHints: user.unlockedHints || []
    };

    const token = generateToken(payload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_TTL_MS // matches the 7-day JWT it carries
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName || user.username,
        role: user.role,
        universityCode: user.universityCode,
        universityName: university.name,
        points: user.bonusPoints || 0, // New users start with 0 (or bonus if set somehow)
        competitionPoints: 0,
        unlockedHints: [],
        termsAccepted: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password } = req.body;

    const superAdmin = await SuperAdmin.findOne({ username });
    if (superAdmin) {
      const isMatch = await comparePassword(password, superAdmin.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const payload: IJWTPayload = {
        userId: (superAdmin._id as any).toString(),
        username: superAdmin.username,
        role: 'super-admin',
        universityCode: 'SUPER'
      };

      const token = generateToken(payload);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: TOKEN_TTL_MS // matches the 7-day JWT it carries
      });

      return res.json({
        token,
        user: {
          id: superAdmin._id,
          username: superAdmin.username,
          role: 'super-admin',
          // Super admins operate the platform rather than participate in it,
          // and live on a different model with no acceptance field. Never gated.
          termsAccepted: true
        }
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Checked after the password so a wrong password and a banned account are
    // indistinguishable to someone guessing.
    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been banned. Contact an administrator.' });
    }

    const payload: IJWTPayload = {
      userId: (user._id as any).toString(),
      username: user.username,
      role: user.role,
      universityCode: user.universityCode,
      unlockedHints: user.unlockedHints || []
    };

    const token = generateToken(payload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_TTL_MS // matches the 7-day JWT it carries
    });

    // Get university name
    const university = await University.findOne({ code: user.universityCode });

    // Calculate dynamic points (Standardized)
    const Challenge = require('../models/Challenge').default;
    const regularChallenges = await Challenge.find({
      universityCode: user.universityCode,
      fromCompetition: { $ne: true }
    });

    // Create map for helper
    const regularChallengeMap = new Map();
    regularChallenges.forEach((c: any) => regularChallengeMap.set(c._id.toString(), c));

    // Calculate stats
    const stats = calculateGeneralStats(user, regularChallengeMap);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName || user.username,
        role: user.role,
        universityCode: user.universityCode,
        universityName: university?.name || user.universityCode,
        points: stats.points,
        competitionPoints: user.competitionPoints || 0,
        unlockedHints: user.unlockedHints || [],
        // Drives the acceptance dialog the client shows before letting anyone
        // in. The server gates the API on this too — see requireTermsAccepted.
        termsAccepted: hasAcceptedCurrentTerms(user),
        // Ambassadors can sign in through this endpoint as well as
        // /login-admin, so the Management gate needs the flag from both.
        ambassadorAgreementAccepted: hasAcceptedCurrentAmbassadorAgreement(user)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password, universityCode } = req.body;

    const user = await User.findOne({ username, role: 'admin' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    if (user.universityCode !== String(universityCode || '').toUpperCase()) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been banned. Contact an administrator.' });
    }

    const payload: IJWTPayload = {
      userId: (user._id as any).toString(),
      username: user.username,
      role: user.role,
      universityCode: user.universityCode,
      unlockedHints: user.unlockedHints || []
    };

    const token = generateToken(payload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_TTL_MS // matches the 7-day JWT it carries
    });

    // Get university name
    const university = await University.findOne({ code: user.universityCode });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName || user.username,
        role: user.role,
        universityCode: user.universityCode,
        universityName: university?.name || user.universityCode,
        points: user.points,
        termsAccepted: hasAcceptedCurrentTerms(user),
        ambassadorAgreementAccepted: hasAcceptedCurrentAmbassadorAgreement(user)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during admin login' });
  }
};

export const loginSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const superAdmin = await SuperAdmin.findOne({ username });
    if (!superAdmin) {
      return res.status(401).json({ error: 'Invalid super admin credentials' });
    }

    const isMatch = await comparePassword(password, superAdmin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid super admin credentials' });
    }

    const payload: IJWTPayload = {
      userId: (superAdmin._id as any).toString(),
      username: superAdmin.username,
      role: 'super-admin',
      universityCode: 'SUPER'
    };

    const token = generateToken(payload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_TTL_MS // matches the 7-day JWT it carries
    });

    res.json({
      token,
      user: {
        id: superAdmin._id,
        username: superAdmin.username,
        role: 'super-admin',
        termsAccepted: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during super admin login' });
  }
};

export const changeSuperAdminPasswordValidation = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 10, max: 200 })
    .withMessage('New password must be at least 10 characters'),
];

/**
 * Lets a signed-in super admin rotate their own password.
 * Security: super-admin role only; the target account is resolved from the
 * JWT (userId), the current password is verified, and the new one is bcrypt-hashed.
 */
export const changeSuperAdminPassword = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    const { currentPassword, newPassword } = req.body;

    const superAdmin = await SuperAdmin.findById(req.user.userId);
    if (!superAdmin) {
      return res.status(404).json({ error: 'Super admin not found' });
    }

    const isMatch = await comparePassword(currentPassword, superAdmin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from the current password' });
    }

    superAdmin.password = await hashPassword(newPassword);
    await superAdmin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error while changing password' });
  }
};

/**
 * Records that the signed-in user accepts the Terms of Service as they
 * currently stand.
 *
 * The client shows a dialog it will not let anyone dismiss, but that dialog is
 * only the prompt — this is what actually unlocks the account, and
 * `requireTermsAccepted` gates the rest of the API on the record it writes.
 * Nothing about the acceptance comes from the request body: the user is taken
 * from the JWT, the version from server config, the time from the server clock.
 */
export const acceptTerms = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Super admins are never gated and do not live on the User model.
    if (req.user.role === 'super-admin') {
      return res.json({ termsAccepted: true, termsVersion: CURRENT_TERMS_VERSION });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Re-accepting an already-accepted version is a no-op rather than an error:
    // two tabs open on the dialog should not produce a failure in one of them.
    if (!hasAcceptedCurrentTerms(user)) {
      user.termsAcceptedAt = new Date();
      user.termsVersion = CURRENT_TERMS_VERSION;
      await user.save();
    }

    res.json({
      termsAccepted: true,
      termsVersion: user.termsVersion,
      termsAcceptedAt: user.termsAcceptedAt
    });
  } catch (error) {
    console.error('Accept terms error:', error);
    res.status(500).json({ error: 'Server error while recording acceptance' });
  }
};

/**
 * Records that the signed-in ambassador accepts the Ambassador Agreement.
 *
 * Separate from acceptTerms because the two documents are versioned and gated
 * separately: the Terms unlock the platform, this unlocks the Management area.
 * Restricted to role 'admin' — nobody else has ambassador powers to unlock, and
 * letting an ordinary account write the field would put a meaningless
 * acceptance on record.
 */
export const acceptAmbassadorAgreement = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only student ambassadors accept this agreement.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!hasAcceptedCurrentAmbassadorAgreement(user)) {
      user.ambassadorAgreementAcceptedAt = new Date();
      user.ambassadorAgreementVersion = CURRENT_AMBASSADOR_AGREEMENT_VERSION;
      await user.save();
    }

    res.json({
      ambassadorAgreementAccepted: true,
      ambassadorAgreementVersion: user.ambassadorAgreementVersion,
      ambassadorAgreementAcceptedAt: user.ambassadorAgreementAcceptedAt
    });
  } catch (error) {
    console.error('Accept ambassador agreement error:', error);
    res.status(500).json({ error: 'Server error while recording acceptance' });
  }
};
