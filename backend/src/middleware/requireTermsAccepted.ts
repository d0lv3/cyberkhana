import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest, readToken } from './auth';
import { IJWTPayload } from '../types';
import { hasAcceptedCurrentTerms } from '../config/terms';

/**
 * Blocks the API for a signed-in user who has not accepted the current Terms.
 *
 * The dialog in the client is the prompt; this is the enforcement. On a
 * platform whose users are being taught to read network traffic and replay
 * requests, a modal that only exists in React is a suggestion — the token from
 * a gated session is otherwise perfectly valid, and calling the endpoints
 * directly would sail straight past it.
 *
 * Mounted app-wide rather than per-route, so it reads and verifies the token
 * itself instead of relying on `authenticate` having run first: every route in
 * this codebase applies `authenticate` individually, which would leave
 * `req.user` unset at the point a mount-level gate runs.
 *
 * It deliberately does NOT reject requests that carry no token — whether a
 * given route allows anonymous access is that route's decision. It only has an
 * opinion about people who are signed in.
 *
 * Responds 403 with `code: 'TERMS_NOT_ACCEPTED'` so the client can tell this
 * apart from an ordinary permission failure and re-open the dialog rather than
 * logging the user out.
 */
export const requireTermsAccepted = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let payload: IJWTPayload;

  try {
    const token = readToken(req);

    // No token: not signed in, not this middleware's problem.
    if (!token) return next();

    payload = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;
  } catch {
    // A bad or expired token is an authentication failure, and `authenticate`
    // gives a much better error for it than we would. Let it through to there.
    return next();
  }

  try {
    if (!payload?.userId) return next();

    // Super admins operate the platform and live on a different model.
    if (payload.role === 'super-admin') return next();

    const user = await User.findById(payload.userId)
      .select('termsAcceptedAt termsVersion')
      .lean();

    // A token for a user who no longer exists is not an acceptance problem;
    // let the route handle the missing record however it already does.
    if (!user) return next();

    if (!hasAcceptedCurrentTerms(user)) {
      return res.status(403).json({
        error: 'You must accept the Terms of Service to use the platform.',
        code: 'TERMS_NOT_ACCEPTED'
      });
    }

    next();
  } catch (error) {
    // Fail closed. A gate that opens whenever the database hiccups is not a
    // gate, and the cost of a false block is one retry.
    console.error('Terms gate error:', error);
    res.status(503).json({
      error: 'Could not verify your Terms acceptance. Please try again.',
      code: 'TERMS_CHECK_FAILED'
    });
  }
};
