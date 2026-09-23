import { randomBytes } from 'crypto';
import Competition from '../models/Competition';
import { calculateDynamicScore } from '../models/Challenge';
import { IJWTPayload } from '../types';

export interface Registration { userId: string; username: string; universityCode: string; registeredAt: string }
export interface EventTeam {
  id: string; name: string; inviteCode: string; members: string[]; captainId: string;
  lockedMembers?: string[];
  hints: Array<{ challengeId: string; index: number; cost: number; userId: string }>;
  adjustments: Array<{ amount: number; reason: string; adminId: string; createdAt: string }>;
}
export interface EventSolve { teamId: string; challengeId: string; userId: string; username: string; solvedAt: string; firstBlood: boolean }
export interface EventState {
  invitations: Array<{ universityCode: string; status: 'pending' | 'accepted' | 'declined' }>;
  registrations: Registration[];
  teams: EventTeam[];
  solves: EventSolve[];
}
export class EventError extends Error { constructor(public status: number, message: string) { super(message); } }
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
export const eventId = () => randomBytes(12).toString('hex');
export const inviteCode = () => randomBytes(9).toString('hex').toUpperCase();
export const uniqueSolves = (c: any): EventSolve[] => {
  const seen = new Set<string>();
  return [...c.eventState.solves].sort((a, b) => a.solvedAt.localeCompare(b.solvedAt)).filter(s => {
    const key = `${s.teamId}:${s.challengeId}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
};
export const eventPoints = (c: any, challenge: any, solves = uniqueSolves(c)) => challenge.scoringMode === 'static'
  ? challenge.points
  : calculateDynamicScore(challenge.initialPoints ?? 1000, challenge.minimumPoints ?? 100, challenge.decay ?? 38,
    solves.filter(s => s.challengeId === String(challenge._id)).length);
export const solvePoints = (c: any, s: EventSolve, solves = uniqueSolves(c)) => {
  const challenge = c.challenges.find((ch: any) => String(ch._id) === s.challengeId);
  return challenge ? eventPoints(c, challenge, solves) + (s.firstBlood ? (challenge.firstBloodBonus ?? 20) : 0) : 0;
};
export const teamScore = (c: any, t: EventTeam) => {
  const solves = uniqueSolves(c);
  return solves.filter(s => s.teamId === t.id).reduce((n, s) => n + solvePoints(c, s, solves), 0)
    - t.hints.reduce((n, h) => n + h.cost, 0) + t.adjustments.reduce((n, a) => n + a.amount, 0);
};
export const eventMetadata = (c: any, u?: IJWTPayload) => ({
  _id: String(c._id), type: 'event', name: c.name, universityCode: c.universityCode,
  universityCodes: c.eventState.invitations.filter((i: any) => i.status === 'accepted').map((i: any) => i.universityCode),
  startTime: c.startTime, endTime: c.endTime, status: c.status, hasTimeLimit: c.hasTimeLimit, duration: c.duration,
  requiresSecurityCode: false, registrationDeadline: c.registrationDeadline, capacity: c.capacity,
  registrationCount: c.eventState.registrations.length, registered: eventRegistered(c, u?.userId),
  unregisterUntil: unregisterUntil(c, u?.userId), canUnregister: canUnregister(c, u?.userId),
  canRegister: u?.role === 'user', registrationOpen: registrationOpen(c), canManage: eventOwner(c, u), challenges: [],
});

export const eventDetails = (c: any, u: IJWTPayload) => {
  assertEvent(eventAccess(c, u), 'Register for this event before entering', 403);
  const owner = eventOwner(c, u), team = eventTeamFor(c, u.userId), solves = uniqueSolves(c);
  const reveal = owner || eventOpen(c);
  return {
    ...eventMetadata(c, u),
    team: team ? { ...team, score: teamScore(c, team), locked: teamLocked(c, team), members: team.members.map(id => c.eventState.registrations.find((r: Registration) => r.userId === id)) } : null,
    challenges: reveal ? c.challenges.map((ch: any) => {
      const { flag, flags, ...safe } = ch.toObject ? ch.toObject() : ch;
      const solved = solves.find(s => s.teamId === team?.id && s.challengeId === String(ch._id));
      return { ...safe, ...(owner ? { flag, flags } : {}), points: eventPoints(c, ch, solves), currentPoints: eventPoints(c, ch, solves),
        solves: solves.filter(s => s.challengeId === String(ch._id)).length,
        solvers: solves.filter(s => s.challengeId === String(ch._id)).map(s => ({ username: s.username, teamId: s.teamId, solvedAt: s.solvedAt, isFirstBlood: s.firstBlood })),
        solvedBy: solved?.username, solvedByTeammate: !!solved && solved.userId !== u.userId,
        hints: (ch.hints || []).map((h: any, index: number) => ({ cost: h.cost, isPublished: !!h.isPublished,
          text: owner || h.isPublished || team?.hints.some(p => p.challengeId === String(ch._id) && p.index === index) ? h.text : 'LOCKED' })),
      };
    }) : [],
    ...(owner ? { registrations: c.eventState.registrations, invitations: c.eventState.invitations,
      teams: c.eventState.teams.map((t: EventTeam) => ({ ...t, score: teamScore(c, t), locked: teamLocked(c, t) })) } : {}),
  };
};

export const eventLeaderboard = (c: any, individual = false) => {
  const solves = uniqueSolves(c);
  const rows = individual ? c.eventState.registrations.map((r: Registration) => {
    const own = solves.filter(s => s.userId === r.userId);
    const costs = c.eventState.teams.flatMap((t: EventTeam) => t.hints).filter((h: any) => h.userId === r.userId).reduce((n: number, h: any) => n + h.cost, 0);
    return { _id: r.userId, username: r.username, universityCode: r.universityCode, points: own.reduce((n, s) => n + solvePoints(c, s, solves), 0) - costs,
      solvedChallenges: own.length, lastSolveTime: own[own.length - 1]?.solvedAt || null };
  }) : c.eventState.teams.filter((t: EventTeam) => t.members.length || solves.some(s => s.teamId === t.id)).map((t: EventTeam) => {
    const own = solves.filter(s => s.teamId === t.id);
    return { _id: t.id, username: t.name, name: t.name, points: teamScore(c, t), solvedChallenges: own.length,
      lastSolveTime: own[own.length - 1]?.solvedAt || null, memberCount: t.members.length };
  });
  rows.sort((a: any, b: any) => b.points - a.points || (a.lastSolveTime ? Date.parse(a.lastSolveTime) : Infinity) - (b.lastSolveTime ? Date.parse(b.lastSolveTime) : Infinity) || a._id.localeCompare(b._id));
  return { type: 'event', mode: individual ? 'individual' : 'team', leaderboard: rows, totalChallenges: c.challenges.length };
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
