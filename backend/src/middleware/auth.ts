import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IJWTPayload } from '../types';
import User from '../models/User';
import { hasAcceptedCurrentAmbassadorAgreement } from '../config/terms';

export interface AuthRequest extends Request {
  user?: IJWTPayload;
}

/**
 * The bearer token the request is actually presenting.
 *
 * The Authorization header comes first. The cookie used to, which meant a stale
 * cookie from an earlier session silently overrode the token the app had in
 * hand — the client sends the header on every call, so the header is the
 * explicit statement of who is calling.
 */
export const readToken = (req: AuthRequest): string | undefined =>
  req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = readToken(req);

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

export const authenticateSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = readToken(req);

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;

    if (decoded.role !== 'super-admin') {
      return res.status(403).json({ error: 'Access denied. Super admin privileges required.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

/**
 * Gates every admin action on role AND on the Ambassador Agreement.
 *
 * The agreement check lives here rather than on each route because this is the
 * one place all 39 admin endpoints already pass through — and the powers the
 * Agreement governs (publishing challenges with arbitrary targets, seeing
 * student data, awarding and deducting points) are exactly the ones behind it.
 *
 * Async now, which is safe: Express awaits a returned promise from a middleware
 * only in v5, but this never resolves before calling next(), so v4 ordering is
 * unchanged.
 */
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Super admins operate the platform and are not ambassadors.
  if (req.user.role === 'super-admin') {
    return next();
  }

  try {
    const user = await User.findById(req.user.userId)
      .select('ambassadorAgreementAcceptedAt ambassadorAgreementVersion')
      .lean();

    if (user && !hasAcceptedCurrentAmbassadorAgreement(user)) {
      return res.status(403).json({
        error: 'You must accept the Ambassador Agreement before using ambassador powers.',
        code: 'AMBASSADOR_AGREEMENT_NOT_ACCEPTED'
      });
    }

    next();
  } catch (error) {
    // Fail closed, same reasoning as the Terms gate.
    console.error('Ambassador agreement gate error:', error);
    res.status(503).json({
      error: 'Could not verify your Ambassador Agreement acceptance. Please try again.',
      code: 'AMBASSADOR_CHECK_FAILED'
    });
  }
};

// Verify token for Socket.IO authentication
export const verifyToken = (token: string): IJWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
};
