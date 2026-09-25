import { NextFunction, Response } from 'express';
import { isValidObjectId, Types } from 'mongoose';
import { AuthRequest, requireAdmin } from '../middleware/auth';
import Competition from '../models/Competition';
import Challenge from '../models/Challenge';
import University from '../models/University';
import User from '../models/User';
import EventSubmission, { SUBMITTED_TEXT_LIMIT, SubmissionResult } from '../models/EventSubmission';
import Certificate from '../models/Certificate';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { getIO } from '../services/socketService';
import { assertEvent, EventError, EventState, EventTeam, Registration, eventAccess, eventDetails, eventId, eventLeaderboard, eventMetadata,
  eventOpen, eventOwner, eventPoints, eventRegistered, eventTeamFor, eventVisible, inviteCode, leaveEventTeam, mutateEvent, registrationOpen, canUnregister, teamLocked, teamScore, scoringContext, uniqueSolves,
  isReleased, freezeCutoff, scoreboardView, flagMatches } from '../services/eventCompetition';
import { issueCertificates, publicCertificate } from '../services/eventCertificates';

const fail = (res: Response, error: any) => {
  if (!(error instanceof EventError)) console.error('Event competition failed:', error);
  return res.status(error instanceof EventError ? error.status : 500).json({ error: error instanceof EventError ? error.message : 'Could not complete event request' });
};
// Limits count per player. A university's students often share one public address, so keying
// by IP let one classroom exhaust everyone's allowance; the per-address cap is only a backstop
// against one person cycling through many accounts.
const perPlayer = (req: any) => req.user?.userId || ipKeyGenerator(req.ip || '');
const eventWriteLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 120, keyGenerator: perPlayer, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many event requests. Try again later.' } });
const eventFlagLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 50, keyGenerator: perPlayer, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many flag submissions. Try again later.' } });
const eventAddressLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 3000, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests from this network. Try again later.' } });
const text = (value: unknown, label: string, max = 120) => {
  assertEvent(typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max, `${label} must contain 1–${max} characters`);
  return value.trim();
};
const brief = (value: unknown) => {
  assertEvent(value == null || (typeof value === 'string' && value.trim().length <= 5000), 'Description must be at most 5,000 characters');
  return typeof value === 'string' ? value.trim() : '';
};
const optionalDate = (value: unknown, label: string) => {
  if (value == null || value === '') return null;
  const date = new Date(value as string);
  assertEvent(Number.isFinite(date.getTime()), `Invalid ${label}`);
  return date;
};
/** Schedule rules shared by creation and settings edits. `changed` limits the future-start
 * check to a request that sets the start, so an overdue event can still have its brief edited. */
function assertSchedule(c: any, changed: { start?: boolean; autoStart?: boolean } = { start: true, autoStart: true }) {
  const time = (value: any) => value ? new Date(value).getTime() : null;
  const start = time(c.startTime), end = time(c.endTime), deadline = time(c.registrationDeadline);
  assertEvent(deadline != null, 'Registration deadline is required');
  assertEvent(end == null || (end > deadline && (start == null || end > start)), 'End time must follow registration and start time');
  if (c.autoStart && c.status === 'pending') {
    assertEvent(start != null, 'Set a start time to open the event automatically');
    assertEvent(!(changed.start || changed.autoStart) || start > Date.now(), 'The automatic start time must be in the future');
    assertEvent(!c.hasTimeLimit || end != null || c.duration, 'Set an end time or duration for a timed event');
  }
  if (c.status === 'active' && c.hasTimeLimit && end != null) assertEvent(end > Date.now(), 'End time must be in the future. Use End event to close it now.');
  const freeze = time(c.scoreboardFreezeAt);
  assertEvent(freeze == null || !c.hasTimeLimit || end == null || freeze < end, 'The scoreboard must freeze before the event ends');
}

/** When a challenge added to an event becomes visible. Added mid-event without a later time: now. */
function releaseTime(c: any, value: unknown) {
  const at = optionalDate(value, 'release time');
  // Waves are whole minutes, so challenges scheduled for the same minute always open together.
  at?.setUTCSeconds(0, 0);
  const when = c.status === 'active' && (!at || at.getTime() <= Date.now()) ? new Date() : at;
  assertEvent(!when || !c.hasTimeLimit || !c.endTime || when.getTime() < new Date(c.endTime).getTime(), 'Release challenges before the event ends');
  return when;
}

const SUBMISSION_RESULTS: SubmissionResult[] = ['correct', 'incorrect', 'already_solved', 'blocked'];

/**
 * Records one flag attempt in the host's log. `error` is what the submission threw, or null
 * when it succeeded. Only registered players are logged: anyone else was refused before
 * touching a flag. A failure here is reported and swallowed; the log never decides whether
 * a submission counts.
 */
async function recordSubmission(c: any, u: any, body: any, error: unknown) {
  try {
    if (!u || u.role !== 'user' || !eventRegistered(c, u.userId)) return;
    const challenge = c.challenges.find((ch: any) => String(ch._id) === String(body?.challengeId));
    if (!challenge) return;
    const code = error instanceof EventError ? error.code : undefined;
    const result: SubmissionResult = !error ? 'correct' : code === 'incorrect' ? 'incorrect' : code === 'already_solved' ? 'already_solved' : 'blocked';
    const submitted = typeof body.flag === 'string' ? body.flag : '';
    // Another challenge's flag in the wrong box is a mix-up at best and shared flags at worst.
    const other = result === 'incorrect' && submitted
      ? c.challenges.find((ch: any) => String(ch._id) !== String(challenge._id) && flagMatches(ch, submitted)) : undefined;
    const team = eventTeamFor(c, u.userId);
    await EventSubmission.create({
      competitionId: c._id, challengeId: String(challenge._id), challengeTitle: challenge.title,
      userId: u.userId, username: u.username, teamId: team?.id, teamName: team?.name, result,
      detail: result === 'blocked' ? (error instanceof EventError ? error.message : 'Server error').slice(0, 200) : undefined,
      submitted: result === 'incorrect' ? submitted.slice(0, SUBMITTED_TEXT_LIMIT) : undefined,
      matchedChallengeId: other ? String(other._id) : undefined, matchedChallengeTitle: other?.title,
    });
  } catch (logError) {
    console.error('Could not record event submission:', logError);
  }
}

/** A page of the submission log with a summary of the whole event. Host only; filters are whitelisted. */
async function submissionLog(c: any, query: any) {
  const competitionId = new Types.ObjectId(String(c._id));
  const filter: any = { competitionId };
  const pick = (value: unknown) => (typeof value === 'string' && /^[a-f\d]{24}$/i.test(value) ? value : undefined);
  if (SUBMISSION_RESULTS.includes(query.result)) filter.result = query.result;
  if (query.flagged === '1') filter.matchedChallengeId = { $exists: true };
  if (pick(query.teamId)) filter.teamId = pick(query.teamId);
  if (pick(query.challengeId)) filter.challengeId = pick(query.challengeId);
  if (pick(query.userId)) filter.userId = pick(query.userId);
  if (pick(query.before)) filter._id = { $lt: new Types.ObjectId(pick(query.before)) };
  const limit = Math.min(200, Math.max(1, Number.parseInt(query.limit, 10) || 100));
  const [rows, counts, noisiest, flagged] = await Promise.all([
    EventSubmission.find(filter).sort({ _id: -1 }).limit(limit + 1).lean(),
    EventSubmission.aggregate([{ $match: { competitionId } }, { $group: { _id: '$result', n: { $sum: 1 } } }]),
    EventSubmission.aggregate([{ $match: { competitionId, result: 'incorrect' } },
      { $group: { _id: '$teamId', teamName: { $last: '$teamName' }, n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 5 }]),
    EventSubmission.countDocuments({ competitionId, matchedChallengeId: { $exists: true } }),
  ]);
  const summary: Record<string, number> = { total: 0, correct: 0, incorrect: 0, already_solved: 0, blocked: 0, flagged };
  for (const row of counts) { summary[row._id] = row.n; summary.total += row.n; }
  return {
    items: rows.slice(0, limit).map(row => ({ _id: String(row._id), createdAt: row.createdAt, result: row.result, detail: row.detail,
      submitted: row.submitted, challengeId: row.challengeId, challengeTitle: row.challengeTitle, userId: row.userId, username: row.username,
      teamId: row.teamId, teamName: row.teamName, matchedChallengeId: row.matchedChallengeId, matchedChallengeTitle: row.matchedChallengeTitle })),
    nextCursor: rows.length > limit ? String(rows[limit - 1]._id) : null,
    summary,
    noisiestTeams: noisiest.map(row => ({ teamId: row._id, teamName: row.teamName, incorrect: row.n })),
  };
}

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
    const deadline = optionalDate(body.registrationDeadline, 'registration deadline');
    assertEvent(deadline && deadline.getTime() > Date.now(), 'Registration deadline must be in the future');
    const capacity = Number(body.capacity);
    assertEvent(Number.isInteger(capacity) && capacity > 0 && capacity <= 10000, 'Capacity must be between 1 and 10,000 participants');
    const duration = body.duration == null ? undefined : Number(body.duration);
    assertEvent(duration == null || (Number.isInteger(duration) && duration > 0 && duration <= 525600), 'Invalid event duration');
    const eventState: EventState = { registrations: [], teams: [], solves: [], invitations: codes.map(universityCode => ({ universityCode, status: universityCode === owner ? 'accepted' : 'pending' })) };
    const fields = { name: text(body.name, 'Name'), description: brief(body.description), type: 'event', universityCode: owner, universityCodes: codes,
      requiresSecurityCode: false, registrationDeadline: deadline, capacity, startTime: optionalDate(body.startTime, 'start time') ?? undefined,
      endTime: optionalDate(body.endTime, 'end time') ?? undefined, hasTimeLimit: body.hasTimeLimit !== false, autoStart: body.autoStart === true,
      duration, status: 'pending', eventRevision: 0, eventState, challenges: [] };
    assertSchedule(fields);
    const c = await Competition.create(fields);
    try { for (const code of codes.filter(code => code !== owner)) getIO().to(`university-admin:${code}`).emit('eventInvitation', { competitionId: String(c._id), name: c.name }); } catch { /* invitations remain available over HTTP */ }
    return res.status(201).json(eventMetadata(c, req.user));
  } catch (error) { return fail(res, error); }
};

export const getEventInvitations = async (req: AuthRequest, res: Response) => {
  try {
    const competitions = await Competition.find({ type: 'event', 'eventState.invitations': { $elemMatch: { universityCode: req.user!.universityCode, status: 'pending' } } }).lean();
    return res.json(competitions.map(c => ({ _id: String(c._id), name: c.name, description: c.description || '', universityCode: c.universityCode,
      registrationDeadline: c.registrationDeadline, startTime: c.startTime, endTime: c.endTime, capacity: c.capacity })));
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
      return eventAddressLimiter(req, res, () => (req.path === '/submit' ? eventFlagLimiter : eventWriteLimiter)(req, res, run));
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
      if (route === '/leaderboard') {
        // Hosts read live standings, but can ask for what players see, e.g. to put it on a projector.
        const asPlayer = !eventOwner(initial, u) || req.query.view === 'public';
        return res.json(eventLeaderboard(initial, req.query.mode === 'individual', { frozenAt: asPlayer ? freezeCutoff(initial) : null, releasedOnly: asPlayer }));
      }
      if (route === '/solved-challenges') {
        const requested = typeof req.query.userId === 'string' ? req.query.userId : u.userId;
        assertEvent(eventOwner(initial, u) || requested === u.userId, 'Access denied', 403);
        const team = eventTeamFor(initial, requested);
        return res.json(uniqueSolves(initial, true).filter(s => s.teamId === team?.id).map(s => s.challengeId));
      }
      if (route === '/activity') {
        const ctx = scoringContext(scoreboardView(initial, u).view);
        const teamName = (teamId: string) => initial.eventState.teams.find((t: EventTeam) => t.id === teamId)?.name;
        return res.json(ctx.solves.slice(-30).reverse().map(s => ({ type: s.firstBlood ? 'first_blood' : 'solve', timestamp: s.solvedAt,
        userId: s.userId, challengeId: s.challengeId, teamId: s.teamId, teamName: teamName(s.teamId), points: ctx.solveValue(s),
        category: initial.challenges.find((ch: any) => String(ch._id) === s.challengeId)?.category,
        username: s.username, challengeTitle: initial.challenges.find((ch: any) => String(ch._id) === s.challengeId)?.title,
        data: { username: s.username, challengeId: s.challengeId, teamId: s.teamId } })));
      }
      const solvers = route.match(/^\/challenges\/([a-f\d]{24})\/solvers$/i);
      if (solvers) {
        const challenge = initial.challenges.find((ch: any) => String(ch._id) === solvers[1]);
        assertEvent(challenge && (eventOwner(initial, u) || isReleased(challenge)), 'Challenge not found', 404);
        return res.json(uniqueSolves(scoreboardView(initial, u).view).filter(s => s.challengeId === solvers[1]).map(s => ({ username: s.username, teamId: s.teamId, solvedAt: s.solvedAt, isFirstBlood: s.firstBlood })));
      }
      if (route === '/submissions') {
        assertEvent(eventOwner(initial, u), 'Host required', 403);
        return res.json(await submissionLog(initial, req.query));
      }
      if (route === '/certificates') {
        assertEvent(eventOwner(initial, u), 'Host required', 403);
        const certificates = await Certificate.find({ competitionId: initial._id }).lean();
        return res.json(certificates.map(publicCertificate).sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.name.localeCompare(b.name)));
      }
      if (route === '/certificate') {
        const certificate = await Certificate.findOne({ competitionId: initial._id, userId: u.userId, revokedAt: null }).lean();
        return res.json(certificate ? publicCertificate(certificate) : null);
      }
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
    let invited: string[] = [];
    if (method === 'PATCH' && route === '/settings' && body.invite !== undefined) {
      assertEvent(eventOwner(initial, u), 'Only the host can manage this event', 403);
      assertEvent(Array.isArray(body.invite) && body.invite.length <= 200, 'Select universities to invite');
      invited = [...new Set(body.invite.map((code: unknown) => text(code, 'University code', 50).toUpperCase()))] as string[];
      assertEvent(await University.countDocuments({ code: { $in: invited } }) === invited.length, 'One or more universities do not exist');
    }
    if (method === 'POST' && route === '/certificates/issue') {
      assertEvent(eventOwner(initial, u), 'Only the host can manage this event', 403);
      assertEvent(initial.status === 'ended', 'Issue certificates after the event ends');
      assertEvent(!freezeCutoff(initial), 'Reveal the scoreboard before issuing certificates; they show final placings', 409);
      const result = await issueCertificates(initial);
      const committed = await mutateEvent(id, c => { c.certificatesIssuedAt = new Date(); });
      notifyEvent(committed.competition);
      return res.json(result);
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
        if (!regRoute) {
          assertEvent(body.teamAction === 'create' || body.teamAction === 'join', 'Choose create or join a team to register');
          assertEvent(!state.teams.some(t => t.lockedMembers?.includes(userId)), 'Your participation history locks team transfers. Contact the host to restore registration.', 409);
          if (body.teamAction === 'create') {
            const name = text(body.name, 'Team name', 60);
            assertEvent(!state.teams.some(t => t.name.toLowerCase() === name.toLowerCase()), 'Team name is already taken', 409);
            state.teams.push({ id: eventId(), name, inviteCode: inviteCode(), captainId: userId, members: [userId], hints: [], adjustments: [] });
          } else {
            const code = text(body.inviteCode, 'Invite code', 30).toUpperCase();
            const team = state.teams.find(t => t.inviteCode === code && t.members.length > 0);
            assertEvent(team, 'Invalid invite code', 404);
            assertEvent(!team.disqualified, 'This team has been disqualified', 409);
            assertEvent(team.members.length < 4, 'Team is full', 409);
            assertEvent(!teamLocked(c, team), 'Team roster is locked', 409);
            team.members.push(userId);
          }
        }
        state.registrations.push({ userId, username: registrationUser.username, universityCode: registrationUser.universityCode, registeredAt: new Date().toISOString() });
        return { success: true };
      }
      if (method === 'DELETE' && (route === '/register' || regRoute?.[1])) {
        const target = regRoute?.[1] || u.userId;
        assertEvent(regRoute ? owner : canUnregister(c, target), regRoute ? 'Only the host can remove participants' : 'Unregistration is only available during the first hour after registration', 403);
        assertEvent(eventRegistered(c, target), 'Participant not registered', 404);
        // Registration can be withdrawn during its first hour, including
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
          assertEvent(!team.disqualified, 'This team has been disqualified', 409);
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
        assertEvent(!team.disqualified, 'Your team has been disqualified from this event', 403);
        const challenge = c.challenges.find((ch: any) => String(ch._id) === body.challengeId);
        // An unreleased challenge answers exactly like one that does not exist.
        assertEvent(challenge && isReleased(challenge), 'Challenge not found', 404);
        if (state.solves.some(s => s.teamId === team.id && s.challengeId === body.challengeId)) throw new EventError(409, 'Your team already solved this challenge', 'already_solved');
        const submitted = text(body.flag, 'Flag', 4096);
        if (!flagMatches(challenge, submitted)) throw new EventError(400, 'Incorrect flag', 'incorrect');
        // Counted against ranked teams only, matching how the scoreboard awards it.
        const firstBlood = !uniqueSolves(c).some(s => s.challengeId === body.challengeId);
        team.lockedMembers ||= [...team.members];
        state.solves.push({ teamId: team.id, challengeId: body.challengeId, userId: u.userId, username: u.username, solvedAt: new Date().toISOString(), firstBlood });
        challenge.solves = uniqueSolves(c).filter(s => s.challengeId === body.challengeId).length;
        // While the scoreboard is frozen, a solve's value and first blood would say how many others solved it.
        if (freezeCutoff(c)) return { success: true, frozen: true, message: 'Correct flag! Solved for your team. Points stay hidden until the scoreboard is revealed.' };
        const basePoints = eventPoints(c, challenge);
        return { success: true, points: basePoints + (firstBlood ? (challenge.firstBloodBonus ?? 20) : 0), basePoints, firstBlood, firstBloodBonus: firstBlood ? (challenge.firstBloodBonus ?? 20) : 0, message: 'Correct flag! Solved for your team.' };
      }
      const hintRoute = route.match(/^\/challenges\/([a-f\d]{24})\/(buy-hint|publish-hint)$/i);
      if (method === 'POST' && hintRoute) {
        const challenge = c.challenges.find((ch: any) => String(ch._id) === hintRoute[1]);
        assertEvent(challenge && (owner || isReleased(challenge)) && Number.isInteger(body.hintIndex) && body.hintIndex >= 0 && challenge.hints?.[body.hintIndex], 'Hint not found', 404);
        const hint = challenge.hints[body.hintIndex];
        if (hintRoute[2] === 'publish-hint') { assertEvent(owner, 'Host required', 403); hint.isPublished = true; return { success: true }; }
        assertEvent(eventOpen(c), 'Competition is not active');
        const team = eventTeamFor(c, u.userId);
        assertEvent(team && u.role === 'user', 'Join a team to unlock hints', 403);
        assertEvent(!team.disqualified, 'Your team has been disqualified from this event', 403);
        if (hint.isPublished || team.hints.some(h => h.challengeId === hintRoute[1] && h.index === body.hintIndex)) return { success: true, hint: hint.text, teamPoints: teamScore(c, team) };
        const cost = hint.cost ?? 0;
        assertEvent(Number.isFinite(cost) && cost >= 0 && teamScore(c, team) >= cost, 'Not enough team points');
        team.lockedMembers ||= [...team.members];
        team.hints.push({ challengeId: hintRoute[1], index: body.hintIndex, cost, userId: u.userId, purchasedAt: new Date().toISOString() });
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
          assertEvent(!team.disqualified, 'Reinstate the team before adding members', 409);
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
      const disqualification = route.match(/^\/teams\/([a-f\d]{24})\/disqualification$/i);
      if (disqualification && (method === 'POST' || method === 'DELETE')) {
        const team = state.teams.find(t => t.id === disqualification[1]);
        assertEvent(team, 'Team not found', 404);
        if (method === 'POST') {
          assertEvent(!team.disqualified, 'Team is already disqualified', 409);
          team.disqualified = { reason: text(body.reason, 'Reason', 500), adminId: u.userId, at: new Date().toISOString() };
        } else {
          assertEvent(team.disqualified, 'Team is not disqualified', 409);
          delete team.disqualified;
        }
        return { success: true };
      }
      if (method === 'PATCH' && route === '/settings') {
        assertEvent(c.status !== 'ended', 'Ended events cannot be edited');
        const pending = c.status === 'pending';
        const beforeStart = (field: string) => assertEvent(pending, `The ${field} can only change before the event starts`);
        if (body.name !== undefined) c.name = text(body.name, 'Name');
        if (body.description !== undefined) c.description = brief(body.description);
        if (body.capacity !== undefined) {
          const capacity = Number(body.capacity);
          assertEvent(Number.isInteger(capacity) && capacity > 0 && capacity <= 10000, 'Capacity must be between 1 and 10,000 participants');
          assertEvent(capacity >= state.registrations.length, `Capacity cannot be lower than the ${state.registrations.length} registered participants`, 409);
          c.capacity = capacity;
        }
        if (body.registrationDeadline !== undefined) c.registrationDeadline = optionalDate(body.registrationDeadline, 'registration deadline');
        if (body.hasTimeLimit !== undefined) { beforeStart('time limit'); c.hasTimeLimit = body.hasTimeLimit !== false; }
        if (body.startTime !== undefined) { beforeStart('start time'); c.startTime = optionalDate(body.startTime, 'start time'); }
        if (body.duration !== undefined) {
          beforeStart('duration');
          const duration = body.duration == null ? null : Number(body.duration);
          assertEvent(duration == null || (Number.isInteger(duration) && duration > 0 && duration <= 525600), 'Invalid event duration');
          c.duration = duration;
        }
        if (body.autoStart !== undefined) { beforeStart('start mode'); c.autoStart = body.autoStart === true; }
        if (body.endTime !== undefined) c.endTime = optionalDate(body.endTime, 'end time');
        if (body.scoreboardFreezeAt !== undefined) {
          // A new freeze time is a new freeze: it applies even if an earlier one was revealed.
          c.scoreboardFreezeAt = optionalDate(body.scoreboardFreezeAt, 'freeze time');
          c.scoreboardRevealedAt = null;
        }
        if (!c.hasTimeLimit) { c.endTime = null; c.duration = null; }
        assertSchedule(c, { start: body.startTime !== undefined, autoStart: body.autoStart !== undefined });
        const added = invited.filter(code => !state.invitations.some(i => i.universityCode === code));
        state.invitations.push(...added.map(universityCode => ({ universityCode, status: 'pending' as const })));
        if (body.revoke !== undefined) {
          assertEvent(Array.isArray(body.revoke), 'Select invitations to withdraw');
          for (const code of body.revoke) {
            const invitation = state.invitations.find(i => i.universityCode === code);
            assertEvent(invitation, 'Invitation not found', 404);
            assertEvent(invitation.status !== 'accepted', 'Accepted universities cannot be removed; their students may already be registered', 409);
          }
          state.invitations = state.invitations.filter(i => !body.revoke.includes(i.universityCode));
        }
        c.universityCodes = state.invitations.map(i => i.universityCode);
        return { success: true, invited: added };
      }
      if (method === 'POST' && route === '/challenges') {
        assertEvent(c.status !== 'ended', 'Challenges cannot be added after the event ends');
        assertEvent(!c.challenges.some((ch: any) => ch.sourceChallengeId === String(source._id)), 'Challenge already added', 409);
        const releaseAt = releaseTime(c, body.releaseAt);
        const { _id, solvers, solves, createdAt, updatedAt, __v, ...copy } = source;
        c.challenges.push({ ...copy, _id: eventId(), sourceChallengeId: String(_id), solves: 0, solvers: [], ...(releaseAt ? { releaseAt } : {}) });
        return { success: true };
      }
      const release = route.match(/^\/challenges\/([a-f\d]{24})\/release$/i);
      if (method === 'PATCH' && release) {
        assertEvent(c.status !== 'ended', 'The event has ended');
        const challenge = c.challenges.find((ch: any) => String(ch._id) === release[1]);
        assertEvent(challenge, 'Challenge not found', 404);
        const releaseAt = releaseTime(c, body.releaseAt);
        if (releaseAt && releaseAt.getTime() > Date.now() && isReleased(challenge)) {
          assertEvent(!state.solves.some(s => s.challengeId === release[1]), 'Teams have already solved this challenge, so it cannot be hidden again', 409);
        }
        if (releaseAt) challenge.releaseAt = releaseAt; else delete challenge.releaseAt;
        return { success: true };
      }
      const removeChallenge = route.match(/^\/challenges\/([a-f\d]{24})$/i);
      if (method === 'DELETE' && removeChallenge) {
        const challenge = c.challenges.find((ch: any) => String(ch._id) === removeChallenge[1]);
        // Once the event runs, only a challenge nobody has seen yet can go.
        assertEvent(c.status === 'pending' || (c.status === 'active' && challenge && !isReleased(challenge)),
          'Once the event starts, only challenges that have not been released yet can be removed');
        c.challenges = c.challenges.filter((ch: any) => String(ch._id) !== removeChallenge[1]);
        return { success: true };
      }
      if (method === 'POST' && route === '/scoreboard/reveal') {
        assertEvent(freezeCutoff(c), 'The scoreboard is not frozen right now', 409);
        c.scoreboardRevealedAt = new Date();
        return { success: true };
      }
      if (route === '/results/publish' && (method === 'POST' || method === 'DELETE')) {
        if (method === 'POST') {
          assertEvent(c.status === 'ended', 'Publish results after the event ends');
          // Publishing is the final reveal, so it lifts a freeze that is still in place.
          if (freezeCutoff(c)) c.scoreboardRevealedAt = new Date();
          c.resultsPublishedAt = new Date();
        } else {
          c.resultsPublishedAt = null;
        }
        return { success: true };
      }
      if (method === 'PATCH' && (route === '/status' || route === '/start')) {
        assertEvent(body.status === 'active' || body.status === 'ended', 'Choose start or end');
        assertEvent(c.status !== 'ended', 'Ended events cannot be reopened');
        if (body.status === 'active') {
          assertEvent(c.status === 'pending' && c.challenges.some((ch: any) => isReleased(ch)), 'Add at least one challenge that is released at the start');
          c.startTime = new Date();
          if (c.hasTimeLimit) {
            if (c.duration) c.endTime = new Date(Date.now() + c.duration * 60000);
            assertEvent(c.endTime && new Date(c.endTime).getTime() > Date.now(), 'Set an end time or duration in the future');
          }
        } else if (!c.endTime || new Date(c.endTime).getTime() > Date.now()) {
          // Ending early records when play actually stopped, so results and the score graph end there.
          c.endTime = new Date();
        }
        c.status = body.status;
        return { success: true };
      }
      // Event records with score history are retained; closing is the reversible admin action.
      throw new EventError(400, 'This operation is not supported for events. Use the event management panel.');
    });
    if (method === 'POST' && route === '/submit') await recordSubmission(initial, u, body, null);
    const removed = committed.result?.removedUserId;
    if (removed) { try { getIO().in(`user:${removed}`).socketsLeave(`competition:${id}`); getIO().to(`user:${removed}`).emit('eventAccessRevoked', { competitionId: id }); } catch {} }
    notifyEvent(committed.competition);
    if (route === '/invitation') { try { getIO().to(`university:${u.universityCode}`).emit('eventInvitationResponded', { competitionId: id }); } catch {} }
    for (const code of committed.result?.invited || []) { try { getIO().to(`university-admin:${code}`).emit('eventInvitation', { competitionId: id, name: committed.competition.name }); } catch {} }
    return res.json(committed.result);
  } catch (error) {
    if (req.method === 'POST' && req.path.replace(/\/$/, '') === '/submit') await recordSubmission(initial, req.user, req.body, error);
    return fail(res, error);
  }
}
