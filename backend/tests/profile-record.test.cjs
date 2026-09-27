const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createServer } = require('node:http');
process.env.JWT_SECRET = 'disposable-profile-integration-test-secret';
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, '../node_modules/.cache/mongodb-binaries');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Competition = require('../dist/models/Competition').default;
const Challenge = require('../dist/models/Challenge').default;
const User = require('../dist/models/User').default;
const University = require('../dist/models/University').default;
const Certificate = require('../dist/models/Certificate').default;
const userRoutes = require('../dist/routes/users').default;
const competitionRoutes = require('../dist/routes/competitions').default;

let mongo, http, base, alice, bob, carol, dave, erin, frank;
let practice, shared, internal, frozenFinal, liveEvent, guestEvent;
const id = u => String(u._id);
const token = u => jwt.sign({ userId: id(u), username: u.username, role: u.role, universityCode: u.universityCode }, process.env.JWT_SECRET);
async function get(user, route, expected = 200) {
  const response = await fetch(`${base}${route}`, { headers: { Authorization: `Bearer ${token(user)}` } });
  const data = await response.json();
  assert.equal(response.status, expected, `GET ${route}: ${JSON.stringify(data)}`);
  return data;
}
// Everything happened ten days ago, so freezes and end times are safely in the past.
const origin = Date.now() - 10 * 86400000;
const at = minutes => new Date(origin + minutes * 60000);
const challenge = (fields) => ({ description: 'Fixture', author: 'host', flag: 'FLAG{fixture}', ...fields });
const registration = (u, minute = 100) => ({ userId: id(u), username: u.username, universityCode: u.universityCode, registeredAt: at(minute).toISOString() });
const team = (teamId, name, members) => ({ id: teamId, name, inviteCode: teamId.toUpperCase(), captainId: id(members[0]), members: members.map(id), hints: [], adjustments: [] });
const solve = (teamId, challengeId, u, minute, firstBlood) => ({ teamId, challengeId: String(challengeId), userId: id(u), username: u.username, solvedAt: at(minute).toISOString(), firstBlood });
const event = (name, host, invitations, fields) => ({
  type: 'event', name, universityCode: host, universityCodes: invitations.map(i => i.universityCode), requiresSecurityCode: false,
  startTime: at(200), endTime: at(300), hasTimeLimit: true, capacity: 50, registrationDeadline: at(150), eventRevision: 0, ...fields,
});

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'profile_record_disposable' });
  await University.create(['A', 'B', 'C', 'D'].map(code => ({ code, name: `University ${code}` })));
  const user = (username, universityCode) => ({ username, universityCode, role: 'user', password: 'fixture-only-password' });
  [alice, bob, carol, dave, erin, frank] = await User.insertMany([
    user('alice', 'A'), user('bob', 'A'), user('carol', 'A'), user('dave', 'B'), user('erin', 'C'), user('frank', 'D'),
  ]);

  practice = await Challenge.create([
    challenge({ title: 'Login bypass', category: 'Web Exploitation', difficulty: 'Easy', points: 500, universityCode: 'A', isPublished: true,
      solvers: [{ odId: id(alice), username: 'alice', solvedAt: at(1), isFirstBlood: true }, { odId: id(bob), username: 'bob', solvedAt: at(2) }] }),
    // Solved before first blood was flagged: the earliest solver drew it.
    challenge({ title: 'Weak keys', category: 'Cryptography', difficulty: 'Hard', points: 400, universityCode: 'A', isPublished: true,
      solvers: [{ odId: id(alice), username: 'alice', solvedAt: at(4) }, { odId: id(bob), username: 'bob', solvedAt: at(3) }] }),
    challenge({ title: 'Retired target', category: 'Web Exploitation', difficulty: 'Medium', points: 300, universityCode: 'A', isPublished: false,
      solvers: [{ odId: id(alice), username: 'alice', solvedAt: at(0), isFirstBlood: true }] }),
  ]);
  const [web, crypto, retired] = practice;

  [shared, internal] = await Competition.create([
    { type: 'workshop', name: 'Shared workshop', universityCode: 'A', universityCodes: ['A', 'B'], status: 'ended', startTime: at(5), endTime: at(60), requiresSecurityCode: false,
      challenges: [
        challenge({ title: 'Warmup', category: 'Web Exploitation', points: 600, hints: [{ text: 'Hint', cost: 30 }],
          solvers: [{ odId: id(alice), username: 'alice', solvedAt: at(10), isFirstBlood: true }] }),
        challenge({ title: 'Main', category: 'Pwn', points: 500,
          solvers: [{ odId: id(bob), username: 'bob', solvedAt: at(11), isFirstBlood: true }, { odId: id(dave), username: 'dave', solvedAt: at(12) }] }),
      ] },
    { type: 'workshop', name: 'Internal workshop', universityCode: 'A', universityCodes: ['A'], status: 'active', startTime: at(15), hasTimeLimit: false, requiresSecurityCode: false,
      challenges: [challenge({ title: 'Only A', category: 'OSINT', points: 300 })] },
  ]);
  const [warmup, main] = shared.challenges;
  const [onlyA] = internal.challenges;
  // A practice-range copy of a workshop challenge: its solves count toward the workshop.
  const copy = await Challenge.create(challenge({ title: 'Main (copy)', category: 'Pwn', points: 200, universityCode: 'A', isPublished: true, fromCompetition: true, competitionId: String(shared._id) }));

  await User.updateOne({ _id: alice._id }, {
    solvedChallengesDetails: [
      { challengeId: String(retired._id), solvedAt: at(0), points: 300 },
      { challengeId: String(web._id), solvedAt: at(1), points: 500 },
      { challengeId: String(crypto._id), solvedAt: at(4), points: 400 },
      { challengeId: String(warmup._id), solvedAt: at(10), points: 600 },
      { challengeId: String(onlyA._id), solvedAt: at(20), points: 300 },
    ],
    unlockedHints: [`${shared._id}_${warmup._id}_0`],
  });
  await User.updateOne({ _id: bob._id }, {
    solvedChallengesDetails: [
      { challengeId: String(web._id), solvedAt: at(2), points: 450 },
      { challengeId: String(crypto._id), solvedAt: at(3), points: 420 },
      { challengeId: String(main._id), solvedAt: at(11), points: 500 },
      { challengeId: String(copy._id), solvedAt: at(13), points: 200 },
    ],
    competitionPenalties: [{ competitionId: String(shared._id), amount: 50, reason: 'Fixture', adminId: 'admin' }],
  });
  await User.updateOne({ _id: carol._id }, { competitionBonusPoints: [{ competitionId: String(shared._id), amount: 100, reason: 'Fixture', adminId: 'admin' }] });
  await User.updateOne({ _id: dave._id }, { solvedChallengesDetails: [{ challengeId: String(main._id), solvedAt: at(12), points: 480 }] });

  const [first, second, solo] = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
  const staticChallenge = (_id, title, points) => challenge({ _id, title, category: 'Network', points, scoringMode: 'static', firstBloodBonus: 20 });
  [frozenFinal, liveEvent, guestEvent] = await Competition.create([
    // Ended with the scoreboard still frozen: Blue Screen's late solve must not count yet.
    event('Frozen final', 'A', [{ universityCode: 'A', status: 'accepted' }, { universityCode: 'B', status: 'accepted' }, { universityCode: 'C', status: 'declined' }], {
      status: 'ended', scoreboardFreezeAt: at(230), challenges: [staticChallenge(first, 'First', 100), staticChallenge(second, 'Second', 200)],
      eventState: {
        invitations: [{ universityCode: 'A', status: 'accepted' }, { universityCode: 'B', status: 'accepted' }, { universityCode: 'C', status: 'declined' }],
        registrations: [registration(alice), registration(bob), registration(dave)],
        teams: [team('t1', 'Root Cause', [alice, bob]), team('t2', 'Blue Screen', [dave])],
        solves: [solve('t1', first, alice, 210, true), solve('t2', first, dave, 220, false), solve('t2', second, dave, 240, true)],
      },
    }),
    event('Live qualifier', 'A', [{ universityCode: 'A', status: 'accepted' }], {
      status: 'active', startTime: at(0), endTime: new Date(Date.now() + 86400000),
      eventState: { invitations: [{ universityCode: 'A', status: 'accepted' }], registrations: [registration(alice)], teams: [team('t3', 'Night Shift', [alice])], solves: [] },
    }),
    event('Guest cup', 'C', [{ universityCode: 'C', status: 'accepted' }, { universityCode: 'A', status: 'accepted' }], {
      status: 'ended', resultsPublishedAt: at(320), challenges: [staticChallenge(solo, 'Solo', 150)],
      eventState: {
        invitations: [{ universityCode: 'C', status: 'accepted' }, { universityCode: 'A', status: 'accepted' }],
        registrations: [registration(alice)], teams: [team('t4', 'Solo Run', [alice])], solves: [solve('t4', solo, alice, 250, true)],
      },
    }),
  ]);

  const certificate = (u, competition, code, fields) => ({
    code, competitionId: competition._id, userId: id(u), name: u.username, username: u.username, universityCode: u.universityCode,
    universityName: `University ${u.universityCode}`, totalTeams: 1, eventName: competition.name, hostUniversityCode: competition.universityCode,
    hostUniversityName: `University ${competition.universityCode}`, issuedAt: at(330), ...fields,
  });
  await Certificate.create([
    certificate(alice, guestEvent, 'a'.repeat(32), { teamName: 'Solo Run', rank: 1, points: 170, solved: 1 }),
    certificate(bob, frozenFinal, 'b'.repeat(32), { revokedAt: at(331) }),
  ]);

  const app = express();
  app.use(express.json());
  app.use('/users', userRoutes);
  app.use('/competitions', competitionRoutes);
  http = createServer(app);
  await new Promise(resolve => http.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${http.address().port}`;
}, { timeout: 300000 });

after(async () => {
  if (http?.listening) await new Promise(resolve => http.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('profiles carry difficulty, first blood and category coverage for every practice solve', async () => {
  const [web, crypto, retired] = practice.map(c => String(c._id));
  const me = await get(alice, '/users/me');
  assert.deepEqual(me.regularSolvedChallenges.map(s => s.challengeId), [crypto, web, retired], 'newest first');
  const byId = Object.fromEntries(me.regularSolvedChallenges.map(s => [s.challengeId, s]));
  assert.equal(byId[web].firstBlood, true);
  assert.equal(byId[web].difficulty, 'Easy');
  assert.equal(byId[crypto].firstBlood, false, 'unflagged solvers fall back to the earliest solve, which was bob');
  assert.equal(byId[crypto].difficulty, 'Hard');
  assert.equal(me.regularSolvedCount, 3);
  assert.deepEqual([byId[web].published, byId[crypto].published, byId[retired].published], [true, true, false]);
  // Unpublished challenges and workshop copies are not part of the range.
  assert.deepEqual(me.categoryTotals, { 'Web Exploitation': 1, Cryptography: 1 });
  assert.equal(me.totalChallenges, 2);

  const bobs = await get(bob, '/users/me');
  assert.equal(bobs.regularSolvedChallenges.find(s => s.challengeId === crypto).firstBlood, true);

  const seenByDave = await get(dave, `/users/profile/${id(alice)}`);
  assert.equal(seenByDave.regularSolvedChallenges.find(s => s.challengeId === web).firstBlood, true);
  assert.deepEqual(seenByDave.categoryTotals, me.categoryTotals);
  assert.equal(seenByDave.totalChallenges, 2);
});

test('a workshop placing on a profile is the one its leaderboard shows', async () => {
  const board = await get(alice, `/competitions/${shared._id}/leaderboard`);
  assert.deepEqual(board.leaderboard.map(r => r.username), ['bob', 'alice', 'dave', 'carol']);
  assert.deepEqual(board.leaderboard.map(r => r.points), [650, 570, 480, 100], 'copy solves, penalties, hints and bonuses all count');
  assert.equal(board.leaderboard[0].penaltyPoints, 50);
  assert.equal(board.leaderboard[3].bonusPoints, 100);

  const { competitions } = await get(alice, '/users/me/competitions');
  const entry = competitions.find(c => c.id === String(shared._id));
  assert.equal(entry.kind, 'workshop');
  assert.equal(entry.rank, 2);
  assert.equal(entry.field, 4);
  assert.equal(entry.points, 570);
  assert.equal(entry.solved, 1);
  assert.equal(entry.totalChallenges, 2);
  assert.equal(entry.firstBloods, 1);
  assert.equal(entry.host.name, 'University A');

  // A bonus alone is participation.
  const carols = (await get(carol, '/users/me/competitions')).competitions;
  assert.deepEqual(carols.map(c => [c.name, c.rank, c.points, c.solved]), [['Shared workshop', 4, 100, 0]]);
});

test('event entries show final placings as players see them, and live events show no standings', async () => {
  const { competitions, certificates } = await get(alice, '/users/me/competitions');
  assert.deepEqual(competitions.map(c => c.name).sort(), ['Frozen final', 'Guest cup', 'Internal workshop', 'Live qualifier', 'Shared workshop']);

  const frozen = competitions.find(c => c.id === String(frozenFinal._id));
  // Live standings would put Blue Screen first on its post-freeze solve.
  assert.equal(frozen.rank, 1);
  assert.equal(frozen.field, 2);
  assert.equal(frozen.points, 120);
  assert.equal(frozen.team, 'Root Cause');
  assert.equal(frozen.ownSolves, 1);
  assert.equal(frozen.firstBloods, 1);
  assert.equal(frozen.certificateCode, null);

  const live = competitions.find(c => c.id === String(liveEvent._id));
  assert.equal(live.team, 'Night Shift');
  assert.deepEqual([live.rank, live.field, live.points, live.solved, live.ownSolves], [null, null, null, null, null]);

  const guest = competitions.find(c => c.id === String(guestEvent._id));
  assert.deepEqual([guest.rank, guest.field, guest.points, guest.resultsPublished], [1, 1, 170, true]);
  assert.equal(guest.certificateCode, 'a'.repeat(32));
  assert.equal(guest.host.name, 'University C');

  assert.deepEqual(certificates.map(c => c.code), ['a'.repeat(32)]);
  assert.equal(JSON.stringify(certificates).includes('userId'), false, 'certificates keep to the public allowlist');
  // A revoked certificate is gone from its holder's profile.
  assert.deepEqual((await get(bob, '/users/me/competitions')).certificates, []);
});

test('other players see only the part of a record they could open themselves', async () => {
  const self = await get(alice, `/users/profile/${id(alice)}/competitions`);
  assert.equal(self.competitions.length, 5, 'your own public view is unfiltered');

  // B shares the workshop and the frozen final with A, and nothing else.
  const fromB = await get(dave, `/users/profile/${id(alice)}/competitions`);
  assert.deepEqual(fromB.competitions.map(c => c.name).sort(), ['Frozen final', 'Shared workshop']);
  assert.deepEqual(fromB.certificates, []);

  // C declined the final but hosted the cup, and so sees the cup and its certificate.
  const fromC = await get(erin, `/users/profile/${id(alice)}/competitions`);
  assert.deepEqual(fromC.competitions.map(c => c.name), ['Guest cup']);
  assert.deepEqual(fromC.certificates.map(c => c.code), ['a'.repeat(32)]);

  // D shares nothing with A.
  await get(frank, `/users/profile/${id(alice)}/competitions`, 403);
  await get(frank, `/users/profile/${id(alice)}`, 403);
  await get(alice, '/users/profile/not-an-id/competitions', 404);
  await get(alice, '/users/profile/not-an-id', 404);
});
