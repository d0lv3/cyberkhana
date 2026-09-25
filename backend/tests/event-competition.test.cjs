const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
process.env.JWT_SECRET = 'disposable-event-integration-test-secret';
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../node_modules/.cache/mongodb-binaries');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Competition = require('../dist/models/Competition').default;
const Challenge = require('../dist/models/Challenge').default;
const User = require('../dist/models/User').default;
const University = require('../dist/models/University').default;
const routes = require('../dist/routes/competitions').default;
const announcements = require('../dist/routes/announcements').default;
const { initializeSocket } = require('../dist/services/socketService');
const { joinCompetitionRoom } = require('../dist/services/competitionRooms');
const { io: clientIO } = require('socket.io-client');
const { eventLeaderboard, eventAccess, mutateEvent, canUnregister } = require('../dist/services/eventCompetition');
const { startScheduledEvents } = require('../dist/services/competitionScheduler');
let mongo, http, io, base, students, admin, invitedAdmin, outsiders, challenges;
const token = u => jwt.sign({ userId: String(u._id), username: u.username, role: u.role, universityCode: u.universityCode }, process.env.JWT_SECRET);
async function request(user, method, route, body, expected = 200) {
  const response = await fetch(`${base}${route}`, { method, headers: { Authorization: `Bearer ${token(user)}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json();
  if (expected != null) assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(data)}`);
  return { status: response.status, data };
}
async function createEvent(capacity = 30, codes = ['A', 'B', 'C']) {
  const { data } = await request(admin, 'POST', '/competitions', { type: 'event', name: 'Event test', universityCodes: codes, universityCode: 'A', capacity,
    registrationDeadline: new Date(Date.now() + 86400000).toISOString(), hasTimeLimit: false }, 201);
  return data._id;
}
async function register(id, users) { for (const user of users) await request(admin, 'POST', `/competitions/${id}/registrations`, { userId: String(user._id) }); }
async function createTeam(id, user, name) {
  await request(user, 'POST', `/competitions/${id}/teams`, { name });
  return (await request(user, 'GET', `/competitions/${id}/event`)).data.team;
}
before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'event_integration_disposable' });
  await University.create(['A', 'B', 'C'].map(code => ({ code, name: `University ${code}` })));
  const user = (username, universityCode = 'A', role = 'user') => ({ username, universityCode, role, password: 'fixture-only-password', ambassadorAgreementAcceptedAt: new Date(), ambassadorAgreementVersion: '2026-09-07' });
  const all = await User.insertMany([user('host', 'A', 'admin'), user('invitee', 'B', 'admin'), ...Array.from({length: 25}, (_, i) => user(`student${i}`)), user('outside', 'B'), user('declined', 'C')]);
  [admin, invitedAdmin] = all; students = all.slice(2, 27); outsiders = all.slice(27);
  challenges = await Challenge.create([
    { title: 'Private event target', category: 'OSINT', points: 100, description: 'Secret challenge description', author: 'host', flag: 'FLAG{team}', flags: ['FLAG{alternative}'], universityCode: 'A', scoringMode: 'static', firstBloodBonus: 20, hints: [{ text: 'Secret paid hint', cost: 10 }] },
    { title: 'Dynamic event target', category: 'Network', points: 1000, description: 'Dynamic scoring', author: 'host', flag: 'FLAG{dynamic}', universityCode: 'A', scoringMode: 'dynamic', initialPoints: 1000, minimumPoints: 100, decay: 3, firstBloodBonus: 0 },
  ]);
  const app = express(); app.use(express.json()); app.use('/competitions', routes); app.use('/announcements', announcements);
  http = createServer(app); io = new Server(http); initializeSocket(io);
  io.use((socket, next) => { try { socket.user = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET); next(); } catch(e) { next(e); } });
  io.on('connection', socket => {
    socket.join(`user:${socket.user.userId}`); socket.join(`university:${socket.user.universityCode}`);
    socket.on('joinCompetition', async ({ competitionId }, done) => { await joinCompetitionRoom(socket, competitionId); done(socket.rooms.has(`competition:${competitionId}`)); });
  });
  await new Promise(resolve => http.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${http.address().port}`;
}, { timeout: 300000 });
after(async () => { if (io) await new Promise(resolve => io.close(resolve)); if (http?.listening) await new Promise(resolve => http.close(resolve)); await mongoose.disconnect(); if (mongo) await mongo.stop(); });

test('event registration, invitation authorization, team races and scoring', async t => {
  const id = await createEvent();
  await t.test('invitations support more than two universities and enforce acceptance', async () => {
    assert.equal((await request(outsiders[0], 'GET', '/competitions')).data.some(c => c._id === id), false);
    await request(outsiders[0], 'POST', `/competitions/${id}/register`, undefined, 403);
    assert.equal((await request(invitedAdmin, 'GET', '/competitions/invitations')).data[0]._id, id);
    await request(invitedAdmin, 'POST', `/competitions/${id}/invitation`, { status: 'accepted' });
    await request(invitedAdmin, 'POST', `/competitions/${id}/invitation`, { status: 'accepted' }, 409);
    assert.equal((await request(outsiders[0], 'GET', '/competitions')).data.some(c => c._id === id), true);
    await request(invitedAdmin, 'PATCH', `/competitions/${id}/status`, { status: 'active' }, 403);
    await request(invitedAdmin, 'POST', `/competitions/${id}/registrations`, { userId: String(outsiders[0]._id) }, 403);
  });
  await request(admin, 'POST', `/competitions/${id}/challenges`, { challengeId: String(challenges[0]._id) });
  await request(admin, 'POST', `/competitions/${id}/challenges`, { challengeId: String(challenges[0]._id) }, 409);
  await request(admin, 'POST', `/competitions/${id}/challenges`, { challengeId: String(challenges[1]._id) });
  const snapshot = (await request(admin, 'GET', `/competitions/${id}/event`)).data;
  const [challengeId, dynamicId] = snapshot.challenges.map(c => c._id);
  await t.test('unregistered API responses contain no challenges, hints or activity', async () => {
    const card = (await request(students[24], 'GET', '/competitions')).data.find(c => c._id === id);
    assert.deepEqual(card.challenges, []);
    for (const secret of ['FLAG{', 'Secret', 'Private event target', 'inviteCode', 'eventState']) assert.equal(JSON.stringify(card).includes(secret), false);
    for (const route of ['event', 'details', '', 'solved-challenges', 'leaderboard', 'activity', `challenges/${challengeId}/solvers`]) await request(students[24], 'GET', `/competitions/${id}/${route}`, undefined, 403);
    await request(students[24], 'POST', `/competitions/${id}/submit`, { challengeId, flag: 'FLAG{team}' }, 403);
    await request(students[24], 'POST', `/competitions/${id}/challenges/${challengeId}/buy-hint`, { hintIndex: 0 }, 403);
    await request(students[24], 'GET', `/announcements/competition/${id}`, undefined, 403);
    const socket = clientIO(base, { auth: { token: token(students[24]) }, transports: ['websocket'] });
    try { await new Promise(resolve => socket.on('connect', resolve));
      assert.equal(await new Promise(resolve => socket.emit('joinCompetition', { competitionId: id }, resolve)), false);
    } finally { socket.close(); }
  });
  await register(id, students.slice(0, 14));
  await register(id, [outsiders[0]]);
  await t.test('registration cannot duplicate or exceed capacity under contention', async () => {
    await request(students[0], 'POST', `/competitions/${id}/register`, undefined, 409);
    const limited = await createEvent(1, ['A']);
    const results = await Promise.all(students.slice(14, 19).map(u => request(u, 'POST', `/competitions/${limited}/register`, { teamAction: 'create', name: u.username }, null)));
    assert.equal(results.filter(r => r.status === 200).length, 1);
    assert.equal(results.filter(r => r.status === 409).length, 4);
    assert.equal((await Competition.findById(limited)).eventState.registrations.length, 1);
  });
  const teamA = await createTeam(id, students[0], 'Alpha');
  const teamB = await createTeam(id, students[5], 'Beta');
  await t.test('concurrent joins enforce four-member cap and one team per user', async () => {
    const joins = await Promise.all(students.slice(1, 5).map(u => request(u, 'POST', `/competitions/${id}/teams/join`, { inviteCode: teamA.inviteCode }, null)));
    assert.equal(joins.filter(r => r.status === 200).length, 3); assert.equal(joins.filter(r => r.status === 409).length, 1);
    const teamC = await createTeam(id, students[6], 'Gamma');
    const cross = await Promise.all([teamB, teamC].map(team => request(students[7], 'POST', `/competitions/${id}/teams/join`, { inviteCode: team.inviteCode }, null)));
    assert.equal(cross.filter(r => r.status === 200).length, 1);
    const state = (await Competition.findById(id)).eventState;
    assert.equal(state.teams.filter(t => t.members.includes(String(students[7]._id))).length, 1);
    await request(outsiders[0], 'POST', `/competitions/${id}/teams/join`, { inviteCode: teamB.inviteCode });
  });
  await t.test('captain succession and empty-team disbanding', async () => {
    const team = await createTeam(id, students[8], 'Temporary');
    await request(students[9], 'POST', `/competitions/${id}/teams/join`, { inviteCode: team.inviteCode });
    await request(students[8], 'DELETE', `/competitions/${id}/teams/me`);
    assert.equal((await request(students[9], 'GET', `/competitions/${id}/event`)).data.team.captainId, String(students[9]._id));
    await request(students[9], 'DELETE', `/competitions/${id}/teams/me`);
    assert.equal((await Competition.findById(id)).eventState.teams.some(t => t.id === team.id), false);
  });
  await t.test('registered pre-start users see team controls but no challenge content', async () => {
    assert.deepEqual((await request(students[0], 'GET', `/competitions/${id}/event`)).data.challenges, []);
    await request(students[0], 'POST', `/competitions/${id}/submit`, { challengeId, flag: 'FLAG{team}' }, 400);
  });
  await request(admin, 'PATCH', `/competitions/${id}/status`, { status: 'active' });
  const aMembers = (await Competition.findById(id)).eventState.teams.find(t => t.id === teamA.id).members;
  const teammate = students.find(u => String(u._id) === aMembers[1]);
  await t.test('teammate simultaneous flags create one solve and reveal no flags or locked hints', async () => {
    const result = await Promise.all([students[0], teammate].map(u => request(u, 'POST', `/competitions/${id}/submit`, { challengeId, flag: 'FLAG{team}' }, null)));
    assert.equal(result.filter(r => r.status === 200).length, 1); assert.equal(result.filter(r => r.status === 409).length, 1);
    const state = (await Competition.findById(id)).eventState;
    assert.equal(state.solves.filter(s => s.challengeId === challengeId).length, 1);
    for (const u of [students[0], teammate]) {
      assert.deepEqual((await request(u, 'GET', `/competitions/${id}/solved-challenges`)).data, [challengeId]);
      const data = (await request(u, 'GET', `/competitions/${id}/event`)).data;
      assert.equal(JSON.stringify(data).includes('FLAG{'), false);
      assert.equal(data.challenges[0].hints[0].text, 'LOCKED');
      assert.ok(data.challenges[0].solvedBy);
    }
    await request(students[0], 'DELETE', `/competitions/${id}/teams/me`, undefined, 409);
    await request(students[10], 'POST', `/competitions/${id}/teams/join`, { inviteCode: teamA.inviteCode }, 409);
  });
  await t.test('concurrent hint purchase charges once and unlocks for the team', async () => {
    await Promise.all([students[0], teammate].map(u => request(u, 'POST', `/competitions/${id}/challenges/${challengeId}/buy-hint`, { hintIndex: 0 })));
    const data = (await request(teammate, 'GET', `/competitions/${id}/event`)).data;
    assert.equal(data.team.score, 110); assert.equal(data.team.hints.length, 1); assert.equal(data.challenges[0].hints[0].text, 'Secret paid hint');
    await request(admin, 'POST', `/competitions/${id}/teams/${teamA.id}/adjustments`, { amount: -15, reason: 'Fixture penalty' });
    assert.equal((await request(teammate, 'GET', `/competitions/${id}/event`)).data.team.score, 95);
  });
  await t.test('unique solving teams drive decay and exactly one first blood, including zero bonus', async () => {
    const results = await Promise.all([students[0], students[5]].map(u => request(u, 'POST', `/competitions/${id}/submit`, { challengeId: dynamicId, flag: 'FLAG{dynamic}' })));
    assert.equal(results.filter(r => r.data.firstBlood).length, 1);
    assert.ok(results.every(r => r.data.firstBloodBonus === 0));
    const c = await Competition.findById(id).lean();
    assert.equal(c.eventState.solves.filter(s => s.challengeId === dynamicId).length, 2);
    const ranks = eventLeaderboard(c).leaderboard;
    assert.equal(ranks.find(r => r._id === teamA.id).points, 695);
    assert.equal(ranks.find(r => r._id === teamB.id).points, 600);
    const duplicated = JSON.parse(JSON.stringify(c)); duplicated.eventState.solves.push(duplicated.eventState.solves[0]);
    assert.deepEqual(eventLeaderboard(duplicated), eventLeaderboard(c));
    const individual = (await request(students[0], 'GET', `/competitions/${id}/leaderboard?mode=individual`)).data;
    assert.equal(individual.mode, 'individual'); assert.equal(individual.leaderboard.reduce((n, r) => n + r.solvedChallenges, 0), 3);
  });
  await t.test('deadline closes self-service but host additions keep capacity and university checks', async () => {
    await mutateEvent(id, c => { c.registrationDeadline = new Date(Date.now() - 1000); c.eventState.registrations.find(r => r.userId === String(students[11]._id)).registeredAt = new Date(Date.now() - 3600000).toISOString(); });
    await request(students[20], 'POST', `/competitions/${id}/register`, undefined, 400);
    await request(students[11], 'DELETE', `/competitions/${id}/register`, undefined, 403);
    await request(admin, 'POST', `/competitions/${id}/registrations`, { userId: String(students[20]._id) });
    await request(admin, 'POST', `/competitions/${id}/registrations`, { userId: String(outsiders[1]._id) }, 403);
    const socket = clientIO(base, { auth: { token: token(teammate) }, transports: ['websocket'] });
    try {
      await new Promise(resolve => socket.on('connect', resolve));
      assert.equal(await new Promise(resolve => socket.emit('joinCompetition', { competitionId: id }, resolve)), true);
      const revoked = new Promise(resolve => socket.once('eventAccessRevoked', resolve));
      await request(admin, 'DELETE', `/competitions/${id}/registrations/${teammate._id}`);
      assert.equal((await revoked).competitionId, id);
      assert.equal(io.sockets.sockets.get(socket.id).rooms.has(`competition:${id}`), false);
      assert.equal(await new Promise(resolve => socket.emit('joinCompetition', { competitionId: id }, resolve)), false);
    } finally { socket.close(); }
    await request(teammate, 'GET', `/competitions/${id}/event`, undefined, 403);
    assert.equal(eventAccess(await Competition.findById(id), { userId: String(teammate._id), role: 'user', universityCode: 'A' }), false);
    await request(admin, 'POST', `/competitions/${id}/registrations`, { userId: String(teammate._id) });
    await request(admin, 'POST', `/competitions/${id}/teams/${teamB.id}/members`, { userId: String(teammate._id) }, 409);
    await request(admin, 'POST', `/competitions/${id}/teams/${teamA.id}/members`, { userId: String(teammate._id) });
  });
  await t.test('ending preserves rankings and closes challenge reads, hints and submission', async () => {
    await request(admin, 'PATCH', `/competitions/${id}/status`, { status: 'ended' });
    assert.deepEqual((await request(students[0], 'GET', `/competitions/${id}/event`)).data.challenges, []);
    await request(students[5], 'POST', `/competitions/${id}/submit`, { challengeId, flag: 'FLAG{team}' }, 400);
    await request(students[0], 'POST', `/competitions/${id}/challenges/${challengeId}/buy-hint`, { hintIndex: 0 }, 400);
    await request(admin, 'PATCH', `/competitions/${id}/status`, { status: 'active' }, 400);
    assert.equal((await request(students[0], 'GET', `/competitions/${id}/leaderboard`)).data.mode, 'team');
  });
});

test('withdrawing within one hour preserves earned history and blocks team transfers', async () => {
  const id = await createEvent(4, ['A']);
  await register(id, [students[21], students[22]]);
  const team = await createTeam(id, students[21], 'Withdrawal fixture');
  await request(students[22], 'POST', `/competitions/${id}/teams/join`, { inviteCode: team.inviteCode });
  await request(admin, 'POST', `/competitions/${id}/challenges`, { challengeId: String(challenges[0]._id) });
  await request(admin, 'PATCH', `/competitions/${id}/status`, { status: 'active' });
  const challengeId = (await request(students[21], 'GET', `/competitions/${id}/event`)).data.challenges[0]._id;
  await request(students[21], 'POST', `/competitions/${id}/submit`, { challengeId, flag: 'FLAG{team}' });
  await request(students[21], 'DELETE', `/competitions/${id}/register`);
  const remaining = (await request(students[22], 'GET', `/competitions/${id}/event`)).data;
  assert.equal(remaining.team.captainId, String(students[22]._id));
  assert.equal(remaining.team.score, 120);
  await request(students[21], 'GET', `/competitions/${id}/event`, undefined, 403);
  await register(id, [students[21]]);
  await request(students[21], 'POST', `/competitions/${id}/teams`, { name: 'Transfer attempt' }, 409);
  await request(students[22], 'DELETE', `/competitions/${id}/register`);
  const stored = await Competition.findById(id).lean();
  assert.equal(stored.eventState.teams[0].members.length, 0);
  assert.equal(eventLeaderboard(stored).leaderboard[0].points, 120);
});

test('declined university invitations remain hidden and equal scores use the earliest last solve', async () => {
  const id = await createEvent();
  await request(invitedAdmin, 'POST', `/competitions/${id}/invitation`, { status: 'declined' });
  assert.equal((await request(outsiders[0], 'GET', '/competitions')).data.some(c => c._id === id), false);
  await request(outsiders[0], 'POST', `/competitions/${id}/register`, undefined, 403);
  const fixture = {
    challenges: [{ _id: 'challenge', scoringMode: 'static', points: 100, firstBloodBonus: 0 }],
    eventState: { registrations: [], teams: ['early', 'late'].map(id => ({ id, name: id, members: [id], hints: [], adjustments: [] })),
      solves: ['late', 'early'].map((teamId, i) => ({ teamId, challengeId: 'challenge', userId: teamId, solvedAt: `2026-09-22T12:0${1-i}:00.000Z`, firstBlood: false })) }
  };
  assert.deepEqual(eventLeaderboard(fixture).leaderboard.map(r => r._id), ['early', 'late']);
});

test('registration requires a team and atomically creates or joins it before the event starts', async () => {
  const id = await createEvent(10, ['A']);
  const route = `/competitions/${id}/register`;
  await request(students[0], 'POST', route, undefined, 400);
  await request(students[0], 'POST', route, { teamAction: 'join', inviteCode: 'INVALID' }, 404);
  assert.equal((await Competition.findById(id)).eventState.registrations.length, 0);
  const attempts = await Promise.all(['First', 'Second'].map(name => request(students[0], 'POST', route, { teamAction: 'create', name }, null)));
  assert.deepEqual(attempts.map(r => r.status).sort(), [200, 409]);
  const state = (await Competition.findById(id)).eventState;
  assert.equal(state.registrations.length, 1); assert.equal(state.teams.length, 1);
  const team = state.teams[0];
  const joins = await Promise.all(students.slice(1, 5).map(user => request(user, 'POST', route, { teamAction: 'join', inviteCode: team.inviteCode }, null)));
  assert.equal(joins.filter(r => r.status === 200).length, 3);
  assert.equal(joins.filter(r => r.status === 409).length, 1);
  const finalState = (await Competition.findById(id)).eventState;
  assert.equal(finalState.registrations.length, 4); assert.equal(finalState.teams[0].members.length, 4);
  await request(students[5], 'POST', route, { teamAction: 'create', name: team.name }, 409);
  assert.equal((await Competition.findById(id)).eventState.registrations.length, 4);
  const data = (await request(students[0], 'GET', `/competitions/${id}/event`)).data;
  assert.equal(data.team.members.length, 4); assert.deepEqual(data.challenges, []);
});

test('withdrawal closes at exactly one hour and the API enforces it independently of registration deadline', async () => {
  const id = await createEvent(5, ['A']);
  await request(students[0], 'POST', `/competitions/${id}/register`, { teamAction: 'create', name: 'One hour' });
  const snapshot = await Competition.findById(id).lean();
  const at = Date.parse(snapshot.eventState.registrations[0].registeredAt), uid = String(students[0]._id);
  assert.equal(canUnregister(snapshot, uid, at + 3599999), true);
  assert.equal(canUnregister(snapshot, uid, at + 3600000), false);
  await mutateEvent(id, c => { c.eventState.registrations[0].registeredAt = new Date(Date.now() - 3600001).toISOString(); });
  const card = (await request(students[0], 'GET', `/competitions/${id}/registration`)).data;
  assert.equal(card.canUnregister, false);
  await request(students[0], 'DELETE', `/competitions/${id}/register`, undefined, 403);
  assert.equal((await Competition.findById(id)).eventState.registrations.length, 1);
  await request(admin, 'DELETE', `/competitions/${id}/registrations/${uid}`);
  await request(students[1], 'POST', `/competitions/${id}/register`, { teamAction: 'create', name: 'Recent registration' });
  await mutateEvent(id, c => { c.registrationDeadline = new Date(Date.now() - 1); });
  await request(students[1], 'DELETE', `/competitions/${id}/register`);
  const empty = (await Competition.findById(id)).eventState;
  assert.equal(empty.registrations.length, 0); assert.equal(empty.teams.length, 0);
});

test('legacy missing-type and explicit workshop competitions keep existing behavior', async () => {
  for (const explicit of [false, true]) {
    const challengeId = new mongoose.Types.ObjectId();
    const { insertedId } = await Competition.collection.insertOne({ ...(explicit ? { type: 'workshop' } : {}), name: 'Workshop fixture', universityCode: 'A', universityCodes: ['A'], status: 'active', requiresSecurityCode: false, hasTimeLimit: false, startTime: new Date(Date.now() - 1000), challenges: [{ _id: challengeId, title: 'Workshop target', category: 'OSINT', description: 'Workshop description', author: 'host', flag: 'FLAG{workshop}', points: 100, initialPoints: 100, minimumPoints: 10, decay: 38, scoringMode: 'static', firstBloodBonus: 20, solves: 0, solvers: [] }] });
    const id = String(insertedId);
    const response = await request(students[23], 'GET', `/competitions/${id}/details`);
    assert.equal(response.data.challenges.length, 1); assert.equal(response.data.challenges[0].flag, undefined);
    await request(students[23], 'POST', `/competitions/${id}/submit`, { challengeId: String(challengeId), flag: 'FLAG{workshop}' });
    assert.ok((await request(students[23], 'GET', `/competitions/${id}/solved-challenges`)).data.includes(String(challengeId)));
    assert.ok((await request(students[23], 'GET', `/competitions/${id}/leaderboard`)).data.leaderboard.some(u => u.username === students[23].username));
  }
  await request(admin, 'POST', '/competitions', { name: 'Too many workshop universities', universityCodes: ['A', 'B', 'C'] }, 400);
});

test('disqualified teams leave the scoreboard, return first blood and decay, and cannot play', async () => {
  const id = await createEvent(10, ['A']);
  for (const challenge of challenges) await request(admin, 'POST', `/competitions/${id}/challenges`, { challengeId: String(challenge._id) });
  await request(students[0], 'POST', `/competitions/${id}/register`, { teamAction: 'create', name: 'Flag sharers' });
  await request(students[1], 'POST', `/competitions/${id}/register`, { teamAction: 'create', name: 'Honest' });
  await request(admin, 'PATCH', `/competitions/${id}/status`, { status: 'active' });
  const [staticId, dynamicId] = (await request(admin, 'GET', `/competitions/${id}/event`)).data.challenges.map(c => c._id);
  for (const user of [students[0], students[1]]) {
    await request(user, 'POST', `/competitions/${id}/submit`, { challengeId: staticId, flag: 'FLAG{team}' });
    await request(user, 'POST', `/competitions/${id}/submit`, { challengeId: dynamicId, flag: 'FLAG{dynamic}' });
  }
  const teams = (await request(admin, 'GET', `/competitions/${id}/event`)).data.teams;
  const cheaters = teams.find(t => t.name === 'Flag sharers'), honest = teams.find(t => t.name === 'Honest');
  const points = async () => Object.fromEntries((await request(students[1], 'GET', `/competitions/${id}/leaderboard`)).data.leaderboard.map(r => [r.name, r.points]));
  assert.deepEqual(await points(), { 'Flag sharers': 720, Honest: 700 });

  await request(students[1], 'POST', `/competitions/${id}/teams/${cheaters.id}/disqualification`, { reason: 'Shared flags' }, 403);
  await request(admin, 'POST', `/competitions/${id}/teams/${cheaters.id}/disqualification`, {}, 400);
  await request(admin, 'POST', `/competitions/${id}/teams/${cheaters.id}/disqualification`, { reason: 'Shared flags' });
  await request(admin, 'POST', `/competitions/${id}/teams/${cheaters.id}/disqualification`, { reason: 'Again' }, 409);
  // First blood and the undecayed dynamic value both pass to the honest team.
  assert.deepEqual(await points(), { Honest: 1020 });
  const board = (await request(students[1], 'GET', `/competitions/${id}/leaderboard`)).data;
  assert.equal(board.timeline.length, 1);
  assert.equal(board.timeline[0].points.at(-1).score, 1020);
  const individual = (await request(students[1], 'GET', `/competitions/${id}/leaderboard?mode=individual`)).data.leaderboard;
  assert.deepEqual(individual.map(r => r._id), [String(students[1]._id)]);
  assert.equal((await request(students[1], 'GET', `/competitions/${id}/activity`)).data.every(a => a.teamId === honest.id), true);
  const own = (await request(students[0], 'GET', `/competitions/${id}/event`)).data;
  assert.equal(own.team.disqualified.reason, 'Shared flags');
  assert.equal((await request(students[0], 'GET', `/competitions/${id}/solved-challenges`)).data.length, 2);
  await request(students[0], 'POST', `/competitions/${id}/challenges/${staticId}/buy-hint`, { hintIndex: 0 }, 403);
  await request(students[2], 'POST', `/competitions/${id}/register`, { teamAction: 'join', inviteCode: cheaters.inviteCode }, 409);
  await request(admin, 'POST', `/competitions/${id}/registrations`, { userId: String(students[2]._id) });
  await request(admin, 'POST', `/competitions/${id}/teams/${cheaters.id}/members`, { userId: String(students[2]._id) }, 409);

  await request(admin, 'DELETE', `/competitions/${id}/teams/${cheaters.id}/disqualification`);
  await request(admin, 'DELETE', `/competitions/${id}/teams/${cheaters.id}/disqualification`, undefined, 409);
  assert.deepEqual(await points(), { 'Flag sharers': 720, Honest: 700 });
});

test('hosts edit event settings and invitations without breaking registration invariants', async () => {
  const id = await createEvent(5, ['A']);
  const route = `/competitions/${id}/settings`;
  await request(students[0], 'POST', `/competitions/${id}/register`, { teamAction: 'create', name: 'Settings one' });
  await request(students[1], 'POST', `/competitions/${id}/register`, { teamAction: 'create', name: 'Settings two' });
  await request(students[0], 'PATCH', route, { name: 'Hijacked' }, 403);
  await request(invitedAdmin, 'PATCH', route, { name: 'Hijacked' }, 403);
  await request(admin, 'PATCH', route, { capacity: 1 }, 409);
  await request(admin, 'PATCH', route, { invite: ['ZZZ'] }, 400);
  await request(admin, 'PATCH', route, { name: 'Renamed event', description: 'No flag sharing.', capacity: 2, invite: ['B', 'C'] });
  const card = (await request(students[0], 'GET', `/competitions/${id}/registration`)).data;
  assert.equal(card.name, 'Renamed event'); assert.equal(card.description, 'No flag sharing.'); assert.equal(card.capacity, 2);
  const invitation = (await request(invitedAdmin, 'GET', '/competitions/invitations')).data.find(i => i._id === id);
  assert.equal(invitation.description, 'No flag sharing.');
  await request(admin, 'PATCH', route, { revoke: ['A'] }, 409);
  await request(admin, 'PATCH', route, { revoke: ['C'] });
  assert.deepEqual((await Competition.findById(id).lean()).eventState.invitations.map(i => i.universityCode), ['A', 'B']);
  await request(admin, 'PATCH', route, { hasTimeLimit: true, endTime: new Date(Date.now() + 3600000).toISOString() }, 400);
  await request(admin, 'PATCH', route, { autoStart: true }, 400);
  await request(admin, 'PATCH', route, { autoStart: true, startTime: new Date(Date.now() - 60000).toISOString() }, 400);
  await request(admin, 'PATCH', route, { autoStart: true, startTime: new Date(Date.now() + 2 * 86400000).toISOString() });
  assert.equal((await request(admin, 'GET', `/competitions/${id}/event`)).data.autoStart, true);
  await request(admin, 'PATCH', `/competitions/${id}/status`, { status: 'ended' });
  assert.ok(Math.abs((await Competition.findById(id).lean()).endTime.getTime() - Date.now()) < 60000, 'ending an event records when it stopped');
  await request(admin, 'PATCH', route, { name: 'After the end' }, 400);
});

test('scheduled events open automatically once they have challenges', async () => {
  const at = offset => new Date(Date.now() + offset).toISOString();
  const event = { type: 'event', name: 'Scheduled', universityCodes: ['A'], universityCode: 'A', capacity: 5, registrationDeadline: at(86400000), autoStart: true };
  await request(admin, 'POST', '/competitions', { ...event, startTime: at(-60000), endTime: at(3 * 86400000) }, 400);
  await request(admin, 'POST', '/competitions', { ...event, startTime: at(3600000) }, 400);
  const windowed = (await request(admin, 'POST', '/competitions', { ...event, startTime: at(3600000), endTime: at(3 * 86400000) }, 201)).data;
  const timed = (await request(admin, 'POST', '/competitions', { ...event, startTime: at(3600000), duration: 90 }, 201)).data;
  assert.equal(windowed.autoStart, true);
  const start = new Date(Date.now() - 1000);
  for (const { _id } of [windowed, timed]) await mutateEvent(_id, c => { c.startTime = start; });
  assert.equal(await startScheduledEvents(), 0);
  for (const { _id } of [windowed, timed]) await request(admin, 'POST', `/competitions/${_id}/challenges`, { challengeId: String(challenges[0]._id) });
  assert.equal(await startScheduledEvents(), 2);
  assert.equal(await startScheduledEvents(), 0);
  const [opened, timer] = await Promise.all([windowed, timed].map(({ _id }) => Competition.findById(_id).lean()));
  assert.equal(opened.status, 'active'); assert.equal(timer.status, 'active');
  assert.equal(timer.endTime.getTime(), start.getTime() + 90 * 60000);
  assert.equal((await request(admin, 'GET', `/competitions/${timed._id}/event`)).data.challenges.length, 1);
});
