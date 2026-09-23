import { NextFunction, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { AuthRequest, requireAdmin } from '../middleware/auth';
import Competition from '../models/Competition';
import Challenge from '../models/Challenge';
import University from '../models/University';
import User from '../models/User';
import rateLimit from 'express-rate-limit';
import { getIO } from '../services/socketService';
import { assertEvent, EventError, EventState, EventTeam, Registration, eventAccess, eventDetails, eventId, eventLeaderboard, eventMetadata,
  eventOpen, eventOwner, eventPoints, eventRegistered, eventTeamFor, eventVisible, inviteCode, leaveEventTeam, mutateEvent, registrationOpen, teamLocked, teamScore, uniqueSolves } from '../services/eventCompetition';

const fail = (res: Response, error: any) => {
  if (!(error instanceof EventError)) console.error('Event competition failed:', error);
  return res.status(error instanceof EventError ? error.status : 500).json({ error: error instanceof EventError ? error.message : 'Could not complete event request' });
};
const eventWriteLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many event requests. Try again later.' } });
const eventFlagLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many flag submissions. Try again later.' } });
const text = (value: unknown, label: string, max = 120) => {
  assertEvent(typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max, `${label} must contain 1–${max} characters`);
  return value.trim();
};

export function notifyEvent(c: any) {
  try {
    const io = getIO(), id = String(c._id);
    // Counts contain no challenge data; challenge changes use a payload-free invalidation.
    for (const i of c.eventState.invitations.filter((i: any) => i.status === 'accepted')) {
      io.to(`university:${i.universityCode}`).emit('eventRegistrationChanged', { competitionId: id, registrationCount: c.eventState.registrations.length });
    }
    io.to(`competition:${id}`).emit('eventChanged', { competitionId: id });
  } catch { /* A committed write remains successful if realtime is temporarily unavailable. */ }
}

export const createEventCompetition = async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;
    const owner = req.user!.role === 'super-admin' ? text(body.universityCode, 'Host university').toUpperCase() : req.user!.universityCode;
    assertEvent(Array.isArray(body.universityCodes), 'Select universities to invite');
    const codes = [...new Set([owner, ...body.universityCodes.map((code: unknown) => text(code, 'University code', 50).toUpperCase())])] as string[];
    const found = await University.countDocuments({ code: { $in: codes } });
    assertEvent(found === codes.length, 'One or more universities do not exist');
    const deadline = new Date(body.registrationDeadline), start = body.startTime ? new Date(body.startTime) : undefined;
    const end = body.endTime ? new Date(body.endTime) : undefined;
    assertEvent(Number.isFinite(deadline.getTime()) && deadline.getTime() > Date.now(), 'Registration deadline must be in the future');
    assertEvent(!start || Number.isFinite(start.getTime()), 'Invalid start time');
    assertEvent(!end || (Number.isFinite(end.getTime()) && end.getTime() > deadline.getTime() && (!start || end > start)), 'End time must follow registration and start time');
    const capacity = Number(body.capacity);
    assertEvent(Number.isInteger(capacity) && capacity > 0 && capacity <= 10000, 'Capacity must be between 1 and 10,000 participants');
    const duration = body.duration == null ? undefined : Number(body.duration);
    assertEvent(duration == null || (Number.isInteger(duration) && duration > 0 && duration <= 525600), 'Invalid event duration');
    const eventState: EventState = { registrations: [], teams: [], solves: [], invitations: codes.map(universityCode => ({ universityCode, status: universityCode === owner ? 'accepted' : 'pending' })) };
    const c = await Competition.create({ name: text(body.name, 'Name'), type: 'event', universityCode: owner, universityCodes: codes,
      requiresSecurityCode: false, registrationDeadline: deadline, capacity, startTime: start, endTime: end, hasTimeLimit: body.hasTimeLimit !== false,
      duration, status: 'pending', eventRevision: 0, eventState, challenges: [] });
    try { for (const code of codes.filter(code => code !== owner)) getIO().to(`university-admin:${code}`).emit('eventInvitation', { competitionId: String(c._id), name: c.name }); } catch { /* invitations remain available over HTTP */ }
    return res.status(201).json(eventMetadata(c, req.user));
  } catch (error) { return fail(res, error); }
};

export const getEventInvitations = async (req: AuthRequest, res: Response) => {
  try {
    const competitions = await Competition.find({ type: 'event', 'eventState.invitations': { $elemMatch: { universityCode: req.user!.universityCode, status: 'pending' } } }).lean();
    return res.json(competitions.map(c => ({ _id: String(c._id), name: c.name, universityCode: c.universityCode, registrationDeadline: c.registrationDeadline })));
  } catch (error) { return fail(res, error); }
};

/** Mounted before workshop routes; legacy documents always fall through unchanged. */
export const dispatchEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!isValidObjectId(req.params.id)) return next();
  try {
    const c: any = await Competition.findById(req.params.id).lean();
    if (c?.type !== 'event') return next();
    if (req.method !== 'GET') {
      const run = () => req.user?.role !== 'user'
        ? requireAdmin(req, res, () => { void handleEvent(req, res, c); })
        : void handleEvent(req, res, c);
      return (req.path === '/submit' ? eventFlagLimiter : eventWriteLimiter)(req, res, run);
    }
    return await handleEvent(req, res, c);
  } catch (error) { return fail(res, error); }
};

async function handleEvent(req: AuthRequest, res: Response, initial: any) {
  try {
    const id = String(initial._id), u = req.user!, route = req.path.replace(/\/$/, '') || '/', method = req.method;
    const actor = u.role === 'super-admin' ? null : await User.findById(u.userId).select('isBanned role universityCode').lean();
    assertEvent(u.role === 'super-admin' || (actor && !actor.isBanned && actor.role === u.role && actor.universityCode === u.universityCode), 'Access denied', 403);
    if (method === 'GET') {
      assertEvent(eventVisible(initial, u), 'Access denied', 403);
      if (route === '/registration') return res.json(eventMetadata(initial, u));
      assertEvent(eventAccess(initial, u), 'Register for this event before entering', 403);
      if (route === '/registration-candidates') {
        assertEvent(eventOwner(initial, u), 'Host required', 403);
        const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 60) : '';
        if (search.length < 2) return res.json([]);
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const users = await User.find({ role: 'user', isBanned: { $ne: true },
          universityCode: { $in: initial.eventState.invitations.filter((i: any) => i.status === 'accepted').map((i: any) => i.universityCode) },
          username: { $regex: escaped, $options: 'i' } }).select('_id username universityCode').limit(30).lean();
        return res.json(users);
      }
      if (route === '/' || route === '/details' || route === '/event') return res.json(eventDetails(initial, u));
      if (route === '/leaderboard') return res.json(eventLeaderboard(initial, req.query.mode === 'individual'));
      if (route === '/solved-challenges') {
        const requested = typeof req.query.userId === 'string' ? req.query.userId : u.userId;
        assertEvent(eventOwner(initial, u) || requested === u.userId, 'Access denied', 403);
        const team = eventTeamFor(initial, requested);
        return res.json(uniqueSolves(initial).filter(s => s.teamId === team?.id).map(s => s.challengeId));
      }
      if (route === '/activity') return res.json(uniqueSolves(initial).slice(-30).reverse().map(s => ({ type: s.firstBlood ? 'first_blood' : 'solve', timestamp: s.solvedAt,
        username: s.username, challengeTitle: initial.challenges.find((ch: any) => String(ch._id) === s.challengeId)?.title,
        data: { username: s.username, challengeId: s.challengeId, teamId: s.teamId } })));
      const solvers = route.match(/^\/challenges\/([a-f\d]{24})\/solvers$/i);
      if (solvers) return res.json(uniqueSolves(initial).filter(s => s.challengeId === solvers[1]).map(s => ({ username: s.username, teamId: s.teamId, solvedAt: s.solvedAt, isFirstBlood: s.firstBlood })));
      throw new EventError(404, 'Event endpoint not found');
    }

    const body = req.body || {};
    // A source challenge is read outside CAS; the immutable copy is added inside the commit.
    let source: any;
    if (method === 'POST' && route === '/challenges') {
      assertEvent(eventOwner(initial, u), 'Only the host can manage this event', 403);
      assertEvent(isValidObjectId(body.challengeId), 'Invalid challenge');
      source = await Challenge.findById(body.challengeId).lean();
      assertEvent(source && !source.fromCompetition && (u.role === 'super-admin' || source.universityCode === initial.universityCode), 'Challenge not available', 403);
    }
    let registrationUser: any;
    const regRoute = route.match(/^\/registrations(?:\/([a-f\d]{24}))?$/i);
    if (method === 'POST' && (route === '/register' || regRoute)) {
      if (regRoute) assertEvent(eventOwner(initial, u), 'Only the host can manage registrations', 403);
      const userId = regRoute ? body.userId : u.userId;
      assertEvent(isValidObjectId(userId), 'Invalid participant ID');
      registrationUser = await User.findById(userId).select('username universityCode role isBanned').lean();
      assertEvent(registrationUser && registrationUser.role === 'user' && !registrationUser.isBanned, 'Participant must be an active student');
    }

    const committed = await mutateEvent(id, c => {
      const owner = eventOwner(c, u), state = c.eventState as EventState;
      if (method === 'POST' && route === '/invitation') {
        assertEvent(u.role === 'admin', 'University admin required', 403);
        const invitation = state.invitations.find(i => i.universityCode === u.universityCode);
        assertEvent(invitation && invitation.status === 'pending', 'No pending invitation', 409);
        assertEvent(body.status === 'accepted' || body.status === 'declined', 'Choose accept or decline');
        invitation.status = body.status;
        return { success: true };
      }
      assertEvent(eventVisible(c, u), 'Access denied', 403);
      if ((method === 'POST' && route === '/register') || (method === 'POST' && regRoute)) {
        assertEvent(regRoute ? owner : u.role === 'user', 'Only students can register', 403);
        assertEvent(registrationOpen(c) || (owner && regRoute && c.status !== 'ended'), 'Registration is closed');
        assertEvent(state.invitations.some(i => i.universityCode === registrationUser.universityCode && i.status === 'accepted'), 'Participant university has not accepted its invitation', 403);
        const userId = String(registrationUser._id);
        assertEvent(!eventRegistered(c, userId), 'Already registered', 409);
        assertEvent(state.registrations.length < c.capacity, 'This event is full', 409);
        state.registrations.push({ userId, username: registrationUser.username, universityCode: registrationUser.universityCode, registeredAt: new Date().toISOString() });
        return { success: true };
      }
      if (method === 'DELETE' && (route === '/register' || regRoute?.[1])) {
        const target = regRoute?.[1] || u.userId;
        assertEvent(regRoute ? owner : registrationOpen(c), regRoute ? 'Only the host can remove participants' : 'Registration is closed', 403);
        assertEvent(eventRegistered(c, target), 'Participant not registered', 404);
        // Registration can always be withdrawn before its deadline, including
        // after a solve. Keep historical contributions and the transfer lock.
        leaveEventTeam(c, target, true);
        state.registrations = state.registrations.filter(r => r.userId !== target);
        return { success: true, removedUserId: target };
      }
      assertEvent(eventAccess(c, u), 'Register for this event before entering', 403);
      if (method === 'POST' && (route === '/teams' || route === '/teams/join')) {
        assertEvent(u.role === 'user' && eventRegistered(c, u.userId), 'Registered student required', 403);
        assertEvent(c.status !== 'ended' && (!c.endTime || new Date(c.endTime).getTime() > Date.now()), 'Event has ended');
        assertEvent(!eventTeamFor(c, u.userId), 'Leave your current team first', 409);
        // Administrative removals cannot be used to transfer an existing solver to another team.
        assertEvent(!state.teams.some(t => t.lockedMembers?.includes(u.userId)), 'Your participation history locks team transfers', 409);
        if (route === '/teams') {
          const name = text(body.name, 'Team name', 60);
          assertEvent(!state.teams.some(t => t.name.toLowerCase() === name.toLowerCase()), 'Team name is already taken', 409);
          state.teams.push({ id: eventId(), name, inviteCode: inviteCode(), captainId: u.userId, members: [u.userId], hints: [], adjustments: [] });
        } else {
          const code = text(body.inviteCode, 'Invite code', 30).toUpperCase();
          const team = state.teams.find(t => t.inviteCode === code && t.members.length > 0);
          assertEvent(team, 'Invalid invite code', 404);
          assertEvent(team.members.length < 4, 'Team is full', 409);
          assertEvent(!teamLocked(c, team), 'Team roster is locked after its first solve, hint or adjustment', 409);
          team.members.push(u.userId);
        }
        return { success: true };
      }
      if (method === 'DELETE' && route === '/teams/me') { assertEvent(c.status !== 'ended', 'Event has ended'); leaveEventTeam(c, u.userId); return { success: true }; }
      if (method === 'POST' && route === '/submit') {
        assertEvent(eventOpen(c), 'Competition is not active');
        const team = eventTeamFor(c, u.userId);
        assertEvent(u.role === 'user' && team, 'Join a team before submitting flags', 403);
        const challenge = c.challenges.find((ch: any) => String(ch._id) === body.challengeId);
        assertEvent(challenge, 'Challenge not found', 404);
        assertEvent(!state.solves.some(s => s.teamId === team.id && s.challengeId === body.challengeId), 'Your team already solved this challenge', 409);
        const submitted = text(body.flag, 'Flag', 4096);
        const normalize = (s: string) => s.replace(/[\u200B\u200C\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim().normalize('NFKC');
        assertEvent([challenge.flag, ...(challenge.flags || [])].filter(Boolean).some(f => normalize(f) === normalize(submitted)), 'Incorrect flag');
        const firstBlood = !state.solves.some(s => s.challengeId === body.challengeId);
        team.lockedMembers ||= [...team.members];
        state.solves.push({ teamId: team.id, challengeId: body.challengeId, userId: u.userId, username: u.username, solvedAt: new Date().toISOString(), firstBlood });
        challenge.solves = uniqueSolves(c).filter(s => s.challengeId === body.challengeId).length;
        const basePoints = eventPoints(c, challenge);
        return { success: true, points: basePoints + (firstBlood ? (challenge.firstBloodBonus ?? 20) : 0), basePoints, firstBlood, firstBloodBonus: firstBlood ? (challenge.firstBloodBonus ?? 20) : 0, message: 'Correct flag! Solved for your team.' };
      }
      const hintRoute = route.match(/^\/challenges\/([a-f\d]{24})\/(buy-hint|publish-hint)$/i);
      if (method === 'POST' && hintRoute) {
        const challenge = c.challenges.find((ch: any) => String(ch._id) === hintRoute[1]);
        assertEvent(challenge && Number.isInteger(body.hintIndex) && body.hintIndex >= 0 && challenge.hints?.[body.hintIndex], 'Hint not found', 404);
        const hint = challenge.hints[body.hintIndex];
        if (hintRoute[2] === 'publish-hint') { assertEvent(owner, 'Host required', 403); hint.isPublished = true; return { success: true }; }
        assertEvent(eventOpen(c), 'Competition is not active');
        const team = eventTeamFor(c, u.userId);
        assertEvent(team && u.role === 'user', 'Join a team to unlock hints', 403);
        if (hint.isPublished || team.hints.some(h => h.challengeId === hintRoute[1] && h.index === body.hintIndex)) return { success: true, hint: hint.text, teamPoints: teamScore(c, team) };
        const cost = hint.cost ?? 0;
        assertEvent(Number.isFinite(cost) && cost >= 0 && teamScore(c, team) >= cost, 'Not enough team points');
        team.lockedMembers ||= [...team.members];
        team.hints.push({ challengeId: hintRoute[1], index: body.hintIndex, cost, userId: u.userId });
        return { success: true, hint: hint.text, teamPoints: teamScore(c, team) };
      }
      assertEvent(owner, 'Only the host can manage this event', 403);
      const memberRoute = route.match(/^\/teams\/([a-f\d]{24})\/members(?:\/([a-f\d]{24}))?$/i);
      if (memberRoute && (method === 'POST' || method === 'DELETE')) {
        const team = state.teams.find(t => t.id === memberRoute[1]);
        assertEvent(team && c.status !== 'ended', 'Team not available');
        const target = method === 'POST' ? body.userId : memberRoute[2];
        assertEvent(eventRegistered(c, target), 'Register the participant first');
        if (method === 'DELETE') {
          assertEvent(team.members.includes(target), 'Participant is not on this team');
          leaveEventTeam(c, target, true);
        } else {
          assertEvent(!eventTeamFor(c, target), 'Remove the participant from their current team first', 409);
          assertEvent(team.members.length < 4, 'Team is full', 409);
          assertEvent(!state.teams.some(t => t.id !== team.id && t.lockedMembers?.includes(target)), 'Participant is locked to their original team', 409);
          team.members.push(target);
          if (!team.captainId) team.captainId = target;
          if (teamLocked(c, team)) team.lockedMembers = [...new Set([...(team.lockedMembers || []), target])];
        }
        return { success: true };
      }
      const adjustment = route.match(/^\/teams\/([a-f\d]{24})\/adjustments$/i);
      if (method === 'POST' && adjustment) {
        const team = state.teams.find(t => t.id === adjustment[1]);
        assertEvent(team, 'Team not found', 404);
        assertEvent(Number.isInteger(body.amount) && body.amount !== 0 && Math.abs(body.amount) <= 1000000, 'Enter a nonzero whole-number adjustment up to 1,000,000 points');
        team.lockedMembers ||= [...team.members];
        team.adjustments.push({ amount: body.amount, reason: text(body.reason, 'Reason', 500), adminId: u.userId, createdAt: new Date().toISOString() });
        return { success: true };
      }
      if (method === 'POST' && route === '/challenges') {
        assertEvent(c.status === 'pending', 'Add challenges before starting the event');
        assertEvent(!c.challenges.some((ch: any) => ch.sourceChallengeId === String(source._id)), 'Challenge already added', 409);
        const { _id, solvers, solves, createdAt, updatedAt, __v, ...copy } = source;
        c.challenges.push({ ...copy, _id: eventId(), sourceChallengeId: String(_id), solves: 0, solvers: [] });
        return { success: true };
      }
      const removeChallenge = route.match(/^\/challenges\/([a-f\d]{24})$/i);
      if (method === 'DELETE' && removeChallenge) {
        assertEvent(c.status === 'pending', 'Remove challenges before starting the event');
        c.challenges = c.challenges.filter((ch: any) => String(ch._id) !== removeChallenge[1]);
        return { success: true };
      }
      if (method === 'PATCH' && (route === '/status' || route === '/start')) {
        assertEvent(body.status === 'active' || body.status === 'ended', 'Choose start or end');
        assertEvent(c.status !== 'ended', 'Ended events cannot be reopened');
        if (body.status === 'active') {
          assertEvent(c.status === 'pending' && c.challenges.length > 0, 'Add challenges before starting');
          c.startTime = new Date();
          if (c.hasTimeLimit) {
            if (c.duration) c.endTime = new Date(Date.now() + c.duration * 60000);
            assertEvent(c.endTime && new Date(c.endTime).getTime() > Date.now(), 'Set an end time or duration in the future');
          }
        }
        c.status = body.status;
        return { success: true };
      }
      // Event records with score history are retained; closing is the reversible admin action.
      throw new EventError(400, 'This operation is not supported for events. Use the event management panel.');
    });
    const removed = committed.result?.removedUserId;
    if (removed) { try { getIO().in(`user:${removed}`).socketsLeave(`competition:${id}`); getIO().to(`user:${removed}`).emit('eventAccessRevoked', { competitionId: id }); } catch {} }
    notifyEvent(committed.competition);
    if (route === '/invitation') { try { getIO().to(`university:${u.universityCode}`).emit('eventInvitationResponded', { competitionId: id }); } catch {} }
    return res.json(committed.result);
  } catch (error) { return fail(res, error); }
}
