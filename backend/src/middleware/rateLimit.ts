import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { AuthRequest } from './auth';

/**
 * Rate-limit key for authenticated endpoints: the player, not the address.
 *
 * A university's students routinely share one public IP, so keying by address
 * makes a whole campus one bucket — one busy lab exhausts everyone's allowance.
 * Keying by user id fixes that; the address is only a fallback for the rare
 * unauthenticated caller. This mirrors the event system's `perPlayer`.
 *
 * It relies on `app.set('trust proxy', …)` in index.ts: without it every id is
 * still distinct, but the address fallback would be the proxy's IP.
 */
export const perPlayerKey = (req: AuthRequest) =>
  req.user?.userId || ipKeyGenerator(req.ip || '');

/**
 * Leaderboards, activity feeds and profiles each load every user in a
 * university and recompute their scores on the spot. Without a ceiling a
 * single client can force that work in a tight loop — a cheap request buying an
 * expensive response. This is a per-player safety net, generous enough that a
 * live dashboard refetching on every socket update, even across a few open
 * tabs, stays well under it; it only catches scripted hammering.
 */
export const heavyReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: perPlayerKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

/**
 * A per-address ceiling for flag submission, sitting above the per-player limit
 * the same way the event system layers `eventAddressLimiter` under
 * `eventFlagLimiter`. The per-player limit is the real guard; this only stops
 * one address cycling through many accounts to multiply its attempts. Set high
 * enough that a large shared campus never trips it in normal play.
 */
export const flagAddressLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many flag submissions from this network. Try again later.' }
});
