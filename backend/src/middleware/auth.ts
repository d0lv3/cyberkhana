import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IJWTPayload } from '../types';

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
const readToken = (req: AuthRequest): string | undefined =>
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

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Verify token for Socket.IO authentication
export const verifyToken = (token: string): IJWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
};
