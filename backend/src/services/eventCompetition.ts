import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import Competition from '../models/Competition';
import { calculateDynamicScore } from '../models/Challenge';
import { IJWTPayload } from '../types';

export interface Registration { userId: string; username: string; universityCode: string; registeredAt: string }
export interface EventTeam {
  id: string; name: string; inviteCode: string; members: string[]; captainId: string;
  lockedMembers?: string[];
  hints: Array<{ challengeId: string; index: number; cost: number; userId: string; purchasedAt?: string }>;
  adjustments: Array<{ amount: number; reason: string; adminId: string; createdAt: string }>;
  disqualified?: { reason: string; adminId: string; at: string };
}
export interface EventSolve { teamId: string; challengeId: string; userId: string; username: string; solvedAt: string; firstBlood: boolean }
export interface EventState {
  invitations: Array<{ universityCode: string; status: 'pending' | 'accepted' | 'declined' }>;
  registrations: Registration[];
  teams: EventTeam[];
  solves: EventSolve[];
}
/** `code` marks outcomes callers act on, such as the submission log telling a wrong flag from a refusal. */
export class EventError extends Error { constructor(public status: number, message: string, public code?: string) { super(message); } }
export function assertEvent(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) throw new EventError(status, message);
}
export const eventOwner = (c: any, u?: IJWTPayload) => !!u && (u.role === 'super-admin' || (u.role === 'admin' && u.universityCode === c.universityCode));
export const eventVisible = (c: any, u?: IJWTPayload) => eventOwner(c, u) || !!c.eventState?.invitations.some((i: any) => i.universityCode === u?.universityCode && i.status === 'accepted');
export const eventRegistered = (c: any, userId?: string) => !!c.eventState?.registrations.some((r: Registration) => r.userId === userId);
export const eventAccess = (c: any, u?: IJWTPayload) => eventOwner(c, u) || (eventVisible(c, u) && eventRegistered(c, u?.userId));
export const eventTeamFor = (c: any, userId?: string): EventTeam | undefined => c.eventState?.teams.find((t: EventTeam) => t.members.includes(userId || ''));
export const teamLocked = (c: any, t: EventTeam) => t.hints.length > 0 || c.eventState.solves.some((s: EventSolve) => s.teamId === t.id) || t.adjustments.length > 0;
export const eventOpen = (c: any, now = Date.now()) => c.status === 'active' && new Date(c.startTime).getTime() <= now && (!c.hasTimeLimit || !c.endTime || new Date(c.endTime).getTime() > now);
export const registrationOpen = (c: any, now = Date.now()) => c.status !== 'ended' && new Date(c.registrationDeadline).getTime() > now && (!c.endTime || new Date(c.endTime).getTime() > now);
export const unregisterUntil = (c: any, userId?: string) => {
  const registration = c.eventState.registrations.find((r: Registration) => r.userId === userId);
  return registration ? new Date(Date.parse(registration.registeredAt) + 3600000).toISOString() : null;
};
export const canUnregister = (c: any, userId?: string, now = Date.now()) => {
  const until = unregisterUntil(c, userId);
  return c.status !== 'ended' && !!until && now < Date.parse(until);
};
/** A challenge in a later wave stays hidden from players until its release time. */
export const isReleased = (challenge: any, now = Date.now()) => !challenge.releaseAt || new Date(challenge.releaseAt).getTime() <= now;
/** The moment players' standings stopped moving, while a freeze is in effect and not yet revealed. */
export const freezeCutoff = (c: any, now = Date.now()): string | null =>
  c.scoreboardFreezeAt && !c.scoreboardRevealedAt && new Date(c.scoreboardFreezeAt).getTime() <= now
    ? new Date(c.scoreboardFreezeAt).toISOString() : null;
/** The event as it stood at the freeze: later solves, hint purchases and adjustments are left out.
 * Disqualifications stay current, since they are moderation rather than scoring. Timestamps are
 * ISO strings, so they compare as text. Hints bought before purchase times were recorded count. */
export const frozenView = (c: any, cutoff: string) => ({
  ...c,
  eventState: {
    ...c.eventState,
    solves: c.eventState.solves.filter((s: EventSolve) => s.solvedAt <= cutoff),
    teams: c.eventState.teams.map((t: EventTeam) => ({ ...t,
      hints: t.hints.filter(h => !h.purchasedAt || h.purchasedAt <= cutoff),
      adjustments: t.adjustments.filter(a => a.createdAt <= cutoff) })),
  },
});
/** What a viewer's scoreboard is built from: hosts always see it live, everyone else frozen. */
export const scoreboardView = (c: any, u?: IJWTPayload) => {
  const cutoff = eventOwner(c, u) ? null : freezeCutoff(c);
  return { view: cutoff ? frozenView(c, cutoff) : c, frozenAt: cutoff };
};
const normalizeFlag = (s: string) => s.replace(/[\u200B\u200C\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim().normalize('NFKC');
const digest = (s: string) => createHash('sha256').update(normalizeFlag(s)).digest();
/** Compares fixed-length digests in constant time, so response timing says nothing about how close a guess was. */
export const flagMatches = (challenge: any, submitted: string) => {
  const guess = digest(submitted);
  return [challenge.flag, ...(challenge.flags || [])].filter(Boolean).some((flag: string) => timingSafeEqual(digest(flag), guess));
};
export const eventId = () => randomBytes(12).toString('hex');
export const inviteCode = () => randomBytes(9).toString('hex').toUpperCase();
export const disqualifiedTeams = (c: any) =>
  new Set<string>((c.eventState?.teams || []).filter((t: EventTeam) => t.disqualified).map((t: EventTeam) => t.id));
/** One counted solve per team and challenge, oldest first. A disqualified team neither ranks
 * nor drives decay, so its solves drop out and first blood passes to the earliest remaining
 * solve. Pass `includeDisqualified` only to show a team its own history. */
export const uniqueSolves = (c: any, includeDisqualified = false): EventSolve[] => {
  const seen = new Set<string>(), blooded = new Set<string>();
  const excluded = includeDisqualified ? new Set<string>() : disqualifiedTeams(c);
  return [...c.eventState.solves].sort((a, b) => a.solvedAt.localeCompare(b.solvedAt)).filter(s => {
    const key = `${s.teamId}:${s.challengeId}`;
    if (seen.has(key) || excluded.has(s.teamId)) return false;
    seen.add(key); return true;
  }).map(s => {
    const firstBlood = !blooded.has(s.challengeId);
    blooded.add(s.challengeId);
    return firstBlood === s.firstBlood ? s : { ...s, firstBlood };
  });
};
const valueFor = (challenge: any, solveCount: number) => challenge.scoringMode === 'static'
  ? challenge.points
  : calculateDynamicScore(challenge.initialPoints ?? 1000, challenge.minimumPoints ?? 100, challenge.decay ?? 38, solveCount);
export const eventPoints = (c: any, challenge: any, solves = uniqueSolves(c)) =>
  valueFor(challenge, solves.filter(s => s.challengeId === String(challenge._id)).length);
/** Every challenge's current value, computed once. Scoring each solve against the full solve
 * list made a scoreboard quadratic in the number of solves. */
export const scoringContext = (c: any, solves = uniqueSolves(c)) => {
  const counts = new Map<string, number>();
  for (const s of solves) counts.set(s.challengeId, (counts.get(s.challengeId) || 0) + 1);
  const challenges = new Map<string, any>(c.challenges.map((ch: any) => [String(ch._id), ch]));
  const values = new Map<string, number>([...challenges].map(([id, ch]) => [id, valueFor(ch, counts.get(id) || 0)]));
  const solveValue = (s: EventSolve) => {
    const challenge = challenges.get(s.challengeId);
    return challenge ? values.get(s.challengeId)! + (s.firstBlood ? (challenge.firstBloodBonus ?? 20) : 0) : 0;
  };
  return { solves, counts, values, solveValue };
};
export const solvePoints = (c: any, s: EventSolve, solves = uniqueSolves(c)) => scoringContext(c, solves).solveValue(s);
export const teamScore = (c: any, t: EventTeam, ctx = scoringContext(c)) =>
  ctx.solves.filter(s => s.teamId === t.id).reduce((n, s) => n + ctx.solveValue(s), 0)
    - t.hints.reduce((n, h) => n + h.cost, 0) + t.adjustments.reduce((n, a) => n + a.amount, 0);
export const eventMetadata = (c: any, u?: IJWTPayload) => ({
  _id: String(c._id), type: 'event', name: c.name, description: c.description || '', universityCode: c.universityCode,
  universityCodes: c.eventState.invitations.filter((i: any) => i.status === 'accepted').map((i: any) => i.universityCode),
  startTime: c.startTime, endTime: c.endTime, status: c.status, hasTimeLimit: c.hasTimeLimit, duration: c.duration, autoStart: !!c.autoStart,
  requiresSecurityCode: false, registrationDeadline: c.registrationDeadline, capacity: c.capacity,
  registrationCount: c.eventState.registrations.length, challengeCount: c.challenges.length,
  teamCount: c.eventState.teams.filter((t: EventTeam) => t.members.length && !t.disqualified).length,
  registered: eventRegistered(c, u?.userId),
  unregisterUntil: unregisterUntil(c, u?.userId), canUnregister: canUnregister(c, u?.userId),
  canRegister: u?.role === 'user', registrationOpen: registrationOpen(c), canManage: eventOwner(c, u), challenges: [],
  scoreboardFreezeAt: c.scoreboardFreezeAt || null, scoreboardRevealedAt: c.scoreboardRevealedAt || null, scoreboardFrozen: !!freezeCutoff(c),
  resultsPublished: !!c.resultsPublishedAt, certificatesIssued: !!c.certificatesIssuedAt,
  ...(eventOwner(c, u) ? { pendingInvitations: c.eventState.invitations.filter((i: any) => i.status === 'pending').length } : {}),
});

/** The next wave players are waiting for: when, and how many challenges. Titles stay hidden. */
const nextRelease = (c: any, now = Date.now()) => {
  const upcoming = c.challenges.filter((ch: any) => !isReleased(ch, now)).map((ch: any) => new Date(ch.releaseAt).getTime());
  if (!upcoming.length) return null;
  const at = Math.min(...upcoming), minute = (t: number) => Math.floor(t / 60000);
  return { at: new Date(at).toISOString(), count: upcoming.filter((t: number) => minute(t) === minute(at)).length, remaining: upcoming.length };
};

export const eventDetails = (c: any, u: IJWTPayload) => {
  assertEvent(eventAccess(c, u), 'Register for this event before entering', 403);
  const owner = eventOwner(c, u), team = eventTeamFor(c, u.userId), live = scoringContext(c);
  // During a freeze, values, solve counts and solvers come from the frozen view; a team's own
  // score and solved markers stay live so it can keep playing and buying hints.
  const { view, frozenAt } = scoreboardView(c, u);
  const ctx = frozenAt ? scoringContext(view) : live, solves = ctx.solves;
  // A disqualified team still sees which challenges it solved; nobody else counts them.
  const ownSolves = team?.disqualified ? uniqueSolves(c, true).filter(s => s.teamId === team.id) : live.solves.filter(s => s.teamId === team?.id);
  const reveal = owner || eventOpen(c);
  return {
    ...eventMetadata(c, u),
    frozenAt,
    nextRelease: c.status === 'ended' ? null : nextRelease(c),
    team: team ? { ...team, score: teamScore(c, team, live), locked: teamLocked(c, team), members: team.members.map(id => c.eventState.registrations.find((r: Registration) => r.userId === id)) } : null,
    challenges: reveal ? c.challenges.filter((ch: any) => owner || isReleased(ch)).map((ch: any) => {
      const { flag, flags, ...safe } = ch.toObject ? ch.toObject() : ch;
      const id = String(ch._id), solved = ownSolves.find(s => s.challengeId === id), solvers = solves.filter(s => s.challengeId === id);
      return { ...safe, ...(owner ? { flag, flags } : {}), points: ctx.values.get(id), currentPoints: ctx.values.get(id),
        solves: solvers.length,
        solvers: solvers.map(s => ({ username: s.username, teamId: s.teamId, solvedAt: s.solvedAt, isFirstBlood: s.firstBlood })),
        solvedBy: solved?.username, solvedByTeammate: !!solved && solved.userId !== u.userId,
        hints: (ch.hints || []).map((h: any, index: number) => ({ cost: h.cost, isPublished: !!h.isPublished,
          text: owner || h.isPublished || team?.hints.some(p => p.challengeId === id && p.index === index) ? h.text : 'LOCKED' })),
      };
    }) : [],
    ...(owner ? { registrations: c.eventState.registrations, invitations: c.eventState.invitations,
      teams: c.eventState.teams.map((t: EventTeam) => ({ ...t, score: teamScore(c, t, live), locked: teamLocked(c, t),
        solveCount: new Set(c.eventState.solves.filter((s: EventSolve) => s.teamId === t.id).map((s: EventSolve) => s.challengeId)).size })) } : {}),
  };
};

/** Cumulative score steps for the eight leading teams, as on a CTF scoreboard graph (eight is
 * the chart's colour-safe series limit). Dynamic challenges are plotted at their current
 * value, so every line ends at the team's score. */
const scoreTimeline = (c: any, rows: any[], ctx: ReturnType<typeof scoringContext>) => {
  const start = c.startTime ? new Date(c.startTime).toISOString() : new Date(0).toISOString();
  return rows.slice(0, 8).map(row => {
    const team: EventTeam = c.eventState.teams.find((t: EventTeam) => t.id === row._id);
    const steps = [
      ...ctx.solves.filter(s => s.teamId === team.id).map(s => ({ at: s.solvedAt, delta: ctx.solveValue(s) })),
      ...team.hints.map(h => ({ at: h.purchasedAt || start, delta: -h.cost })),
      ...team.adjustments.map(a => ({ at: a.createdAt, delta: a.amount })),
    ].sort((a, b) => a.at.localeCompare(b.at));
    let score = 0;
    return { _id: team.id, name: team.name, points: steps.map(step => ({ at: step.at, score: score += step.delta })) };
  });
};

/** Standings. Pass `frozenAt` to score the event as it stood then, and `releasedOnly` for a player's
 * count of challenges, which must not reveal how many are still to come. */
export const eventLeaderboard = (live: any, individual = false, { frozenAt = null as string | null, releasedOnly = false } = {}) => {
  const c = frozenAt ? frozenView(live, frozenAt) : live;
  const ctx = scoringContext(c), solves = ctx.solves, dq = disqualifiedTeams(c);
  // Players on a disqualified team leave the individual board with it, even after withdrawing.
  const dqPlayers = new Set<string>(c.eventState.teams.filter((t: EventTeam) => dq.has(t.id)).flatMap((t: EventTeam) => [...t.members, ...(t.lockedMembers || [])]));
  const rows = individual ? c.eventState.registrations.filter((r: Registration) => !dqPlayers.has(r.userId)).map((r: Registration) => {
    const own = solves.filter(s => s.userId === r.userId);
    const costs = c.eventState.teams.flatMap((t: EventTeam) => t.hints).filter((h: any) => h.userId === r.userId).reduce((n: number, h: any) => n + h.cost, 0);
    return { _id: r.userId, username: r.username, universityCode: r.universityCode, points: own.reduce((n, s) => n + ctx.solveValue(s), 0) - costs,
      solvedChallenges: own.length, lastSolveTime: own[own.length - 1]?.solvedAt || null };
  }) : c.eventState.teams.filter((t: EventTeam) => !dq.has(t.id) && (t.members.length || solves.some(s => s.teamId === t.id))).map((t: EventTeam) => {
    const own = solves.filter(s => s.teamId === t.id);
    return { _id: t.id, username: t.name, name: t.name, points: teamScore(c, t, ctx), solvedChallenges: own.length,
      lastSolveTime: own[own.length - 1]?.solvedAt || null, memberCount: t.members.length };
  });
  rows.sort((a: any, b: any) => b.points - a.points || (a.lastSolveTime ? Date.parse(a.lastSolveTime) : Infinity) - (b.lastSolveTime ? Date.parse(b.lastSolveTime) : Infinity) || a._id.localeCompare(b._id));
  return { type: 'event', mode: individual ? 'individual' : 'team', leaderboard: rows, frozenAt,
    totalChallenges: releasedOnly ? c.challenges.filter((ch: any) => isReleased(ch)).length : c.challenges.length,
    ...(individual ? {} : { timeline: scoreTimeline(c, rows, ctx) }) };
};

/** One document owns every event invariant. Retry the whole decision after a competing commit.
 * Bounded capacity and a 12MB guard leave room below MongoDB's 16MB BSON limit.
 * The status guard also catches the independent expiry scheduler.
 */
export async function mutateEvent(id: string, action: (c: any) => Promise<any> | any) {
  for (let attempt = 0; attempt < 25; attempt++) {
    const c: any = await Competition.findOne({ _id: id, type: 'event' }).lean();
    assertEvent(c, 'Event not found', 404);
    const status = c.status, revision = c.eventRevision;
    const result = await action(c);
    assertEvent(Buffer.byteLength(JSON.stringify(c), 'utf8') < 12 * 1024 * 1024, 'Event storage limit reached; contact the organizer', 409);
    const { _id, __v, createdAt, updatedAt, eventRevision, ...fields } = c;
    const committed = await Competition.findOneAndUpdate({ _id, type: 'event', eventRevision: revision, status },
      { $set: fields, $inc: { eventRevision: 1 } }, { new: true, runValidators: true }).lean();
    if (committed) return { competition: committed, result };
  }
  throw new EventError(409, 'This event is busy. Please try again.');
}

export function leaveEventTeam(c: any, userId: string, administrative = false) {
  const team = eventTeamFor(c, userId);
  if (!team) return;
  assertEvent(administrative || !teamLocked(c, team), 'Team membership is locked after its first solve, hint or adjustment', 409);
  team.members = team.members.filter(id => id !== userId);
  if (team.captainId === userId) team.captainId = team.members[0] || '';
  if (!team.members.length && !teamLocked(c, team)) c.eventState.teams = c.eventState.teams.filter((t: EventTeam) => t.id !== team.id);
}
