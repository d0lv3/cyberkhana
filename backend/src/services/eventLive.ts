import Competition from '../models/Competition';
import User from '../models/User';
import { getIO } from './socketService';
import { shortCache } from '../utils/shortCache';

/**
 * What keeps a live event affordable when hundreds of players are watching it.
 *
 * Every correct flag used to broadcast `eventChanged`, and every open dashboard
 * answered with four requests, each loading the whole event document (every
 * registration, team and solve) and scoring it from scratch. The work for one
 * solve grew with the number of players watching, so a busy opening minute
 * multiplied into thousands of full loads a second on a single Node process.
 *
 * Three things bound it here:
 * - broadcasts for one event are spaced at least BROADCAST_INTERVAL_MS apart, so
 *   a burst of solves becomes one refresh wave rather than one wave per solve;
 * - reads within a wave share one loaded copy of the event for READ_TTL_MS;
 * - standings computed from that shared copy are computed once, not per player.
 */

/** Longest a scoreboard can trail a solve. Also keeps a player's refreshes far below the read limit. */
export const BROADCAST_INTERVAL_MS = 3000;
/** How stale a read may be when a write happens somewhere that cannot refresh this cache. */
const READ_TTL_MS = 2000;

const eventReads = shortCache<any>(READ_TTL_MS);
const actors = shortCache<any>(READ_TTL_MS);

/**
 * The competition document for a read request. Writes made through `mutateEvent`
 * replace the cached copy as they commit, so a player who acts and then reads
 * sees their own change.
 *
 * The returned object is shared between requests and must never be mutated.
 */
export const readEvent = (id: string) => eventReads.get(id, () => Competition.findById(id).lean());
export const rememberEvent = (competition: any) => eventReads.set(String(competition._id), competition);
export const forgetEvent = (id: string) => eventReads.delete(id);

/** The requesting user's ban, role and university, as checked on every event request. */
export const readActor = (userId: string) =>
  actors.get(userId, () => User.findById(userId).select('isBanned role universityCode').lean());

const derived = new WeakMap<object, Map<string, unknown>>();
/**
 * Computes a value from a shared, read-only event document once per document.
 * The cached copy is replaced on every write, which is what invalidates this.
 * Only pass documents from `readEvent`: a document that is mutated afterwards
 * would keep returning the answer from before the change.
 */
export function deriveOnce<T>(competition: object, key: string, compute: () => T): T {
  let values = derived.get(competition);
  if (!values) derived.set(competition, values = new Map());
  if (!values.has(key)) values.set(key, compute());
  return values.get(key) as T;
}

const broadcasts = new Map<string, { last: number; timer: NodeJS.Timeout | null }>();
/**
 * Tells everyone in an event's room that it changed. The first change in a quiet
 * period goes out at once; changes after that are held until the interval has
 * passed and then sent as one, so the last change is never lost.
 */
export function signalEventChanged(id: string) {
  const emit = () => {
    try { getIO().to(`competition:${id}`).emit('eventChanged', { competitionId: id }); } catch { /* realtime is best effort */ }
  };
  const now = Date.now(), state = broadcasts.get(id);
  if (!state || (!state.timer && now - state.last >= BROADCAST_INTERVAL_MS)) {
    broadcasts.set(id, { last: now, timer: null });
    emit();
    return;
  }
  if (state.timer) return;
  state.timer = setTimeout(() => { state.timer = null; state.last = Date.now(); emit(); }, state.last + BROADCAST_INTERVAL_MS - now);
  state.timer.unref?.();
}
