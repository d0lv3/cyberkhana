import { randomBytes } from 'crypto';
import Certificate from '../models/Certificate';
import University from '../models/University';
import User from '../models/User';
import { disqualifiedTeams, eventLeaderboard, eventTeamFor, Registration } from './eventCompetition';

/** 128 random bits as hex: unguessable, and safe in a URL. */
export const certificateCode = () => randomBytes(16).toString('hex');

/**
 * Issues or refreshes the certificates for a finished event, one per registered player.
 *
 * Idempotent: a player keeps the same code on every run, so a link already shared keeps
 * working, while the printed details are refreshed from the final standings. Players who are
 * no longer eligible (removed, or on a team disqualified after issuing) have their
 * certificate revoked rather than deleted, so its verification page can say so.
 */
export async function issueCertificates(c: any) {
  const board = eventLeaderboard(c).leaderboard;
  const place = new Map<string, number>(board.map((row: any, index: number) => [row._id, index + 1]));
  const dq = disqualifiedTeams(c);
  const eligible: Registration[] = c.eventState.registrations.filter((r: Registration) => {
    const team = eventTeamFor(c, r.userId);
    return !team || !dq.has(team.id);
  });
  const [users, universities] = await Promise.all([
    User.find({ _id: { $in: eligible.map(r => r.userId) } }).select('username fullName displayName').lean(),
    University.find({ code: { $in: [c.universityCode, ...eligible.map(r => r.universityCode)] } }).select('code name').lean(),
  ]);
  const universityName = (code: string) => universities.find(u => u.code === code)?.name || code;
  const issuedAt = new Date();

  const operations = eligible.map(r => {
    const user: any = users.find(x => String(x._id) === r.userId);
    const team = eventTeamFor(c, r.userId);
    const row: any = team && board.find((entry: any) => entry._id === team.id);
    const placing = row ? { teamName: team!.name, rank: place.get(team!.id), points: row.points, solved: row.solvedChallenges } : null;
    return {
      updateOne: {
        filter: { competitionId: c._id, userId: r.userId },
        update: {
          $setOnInsert: { code: certificateCode(), issuedAt },
          $set: {
            name: user?.fullName?.trim() || user?.displayName?.trim() || r.username,
            username: r.username, universityCode: r.universityCode, universityName: universityName(r.universityCode),
            totalTeams: board.length, eventName: c.name,
            hostUniversityCode: c.universityCode, hostUniversityName: universityName(c.universityCode),
            eventStart: c.startTime, eventEnd: c.endTime,
            ...(placing || {}),
          },
          // A player without a team places nowhere; clear anything an earlier run recorded.
          $unset: { revokedAt: '', ...(placing ? {} : { teamName: '', rank: '', points: '', solved: '' }) },
        },
        upsert: true,
      },
    };
  });
  if (operations.length) await Certificate.bulkWrite(operations as any, { ordered: false });

  const revoked = await Certificate.updateMany(
    { competitionId: c._id, userId: { $nin: eligible.map(r => r.userId) }, revokedAt: null },
    { $set: { revokedAt: issuedAt } },
  );
  return { issued: operations.length, revoked: revoked.modifiedCount };
}

/**
 * The only certificate fields that ever leave the server. The verification page is public,
 * so this is an allowlist: no user id, no event id, nothing that links to other records.
 */
export const publicCertificate = (certificate: any) => ({
  code: certificate.code,
  name: certificate.name,
  username: certificate.username,
  universityName: certificate.universityName,
  teamName: certificate.teamName ?? null,
  rank: certificate.rank ?? null,
  totalTeams: certificate.totalTeams,
  points: certificate.points ?? null,
  solved: certificate.solved ?? null,
  eventName: certificate.eventName,
  hostUniversityName: certificate.hostUniversityName,
  eventStart: certificate.eventStart ?? null,
  eventEnd: certificate.eventEnd ?? null,
  issuedAt: certificate.issuedAt,
  revoked: !!certificate.revokedAt,
});
