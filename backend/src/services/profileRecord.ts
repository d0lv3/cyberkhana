import mongoose, { isValidObjectId } from 'mongoose';
import Competition from '../models/Competition';
import Challenge from '../models/Challenge';
import User from '../models/User';
import University from '../models/University';
import Certificate from '../models/Certificate';
import { IJWTPayload } from '../types';
import { EventTeam, eventLeaderboard, eventTeamFor, eventVisible, freezeCutoff, frozenView, isReleased, uniqueSolves } from './eventCompetition';
import { publicCertificate } from './eventCertificates';
import { getCompetitionUniversityCodes, workshopStandings } from './workshopStandings';

/**
 * Whether this player drew first blood, going by the solver list a challenge
 * keeps. Solvers recorded before first blood was flagged fall back to the
 * earliest solve, the same reading the solvers endpoints give.
 */
export const drewFirstBlood = (solvers: any[] | undefined, userId: string): boolean => {
  if (!solvers?.length) return false;
  const first = solvers.find((s: any) => s.isFirstBlood)
    || solvers.reduce((a: any, b: any) => (new Date(a.solvedAt).getTime() <= new Date(b.solvedAt).getTime() ? a : b));
  return String(first.odId) === userId;
};

/** One competition or event on a player's profile. */
export interface CompetitionRecordEntry {
  id: string;
  kind: 'workshop' | 'event';
  name: string;
  status: 'pending' | 'active' | 'ended';
  startTime: Date | null;
  endTime: Date | null;
  hasTimeLimit: boolean;
  host: { code: string; name: string };
  /** Placing among `field` players (workshop) or teams (event). Null without one. */
  rank: number | null;
  field: number | null;
  points: number | null;
  /** The player's solves in a workshop, the team's in an event. */
  solved: number | null;
  totalChallenges: number | null;
  /** First bloods this player drew themselves. */
  firstBloods: number | null;
  team: string | null;
  /** Events only: the flags this player captured for the team. */
  ownSolves: number | null;
  resultsPublished: boolean;
  certificateCode: string | null;
}

const byStartDesc = (a: CompetitionRecordEntry, b: CompetitionRecordEntry) =>
  (b.startTime ? new Date(b.startTime).getTime() : 0) - (a.startTime ? new Date(a.startTime).getTime() : 0);

/**
 * A player's competition history, for their profile: every workshop they
 * scored in, every event they registered for, and the certificates they hold.
 *
 * Pass `viewer` when someone else is looking. They then see only the part of
 * the record they could open themselves: workshops open to their university and
 * events their university took part in. The player's own view is unfiltered.
 *
 * Event placings appear only once an event has ended, and come from the
 * standings players see, so a frozen scoreboard stays frozen here too. While an
 * event runs, the entry says only that the player is registered and for which
 * team.
 */
export async function competitionRecord(target: any, viewer?: IJWTPayload) {
  const targetId = String(target._id);
  const viewerCode = (viewer?.universityCode || '').toUpperCase();
  const visible = (c: any) =>
    !viewer || viewer.role === 'super-admin' ||
    (c.type === 'event' ? eventVisible(c, viewer) : getCompetitionUniversityCodes(c).includes(viewerCode));

  // Workshops count a player once they have a solve or a bonus in one, and a
  // solve on a practice-range copy of a workshop challenge counts toward it.
  const solvedIds = [...new Set<string>((target.solvedChallengesDetails || [])
    .map((s: any) => String(s.challengeId))
    .filter((id: string) => isValidObjectId(id)))]
    .map(id => new mongoose.Types.ObjectId(id));
  const copies = solvedIds.length
    ? await Challenge.find({ fromCompetition: true, _id: { $in: solvedIds } }).select('competitionId').lean()
    : [];
  const linkedIds = [
    ...copies.map((c: any) => c.competitionId),
    ...(target.competitionBonusPoints || []).map((b: any) => b.competitionId),
  ].filter((id: unknown) => typeof id === 'string' && isValidObjectId(id));

  const [workshops, events, certificates] = await Promise.all([
    Competition.find({
      type: { $ne: 'event' },
      $or: [{ 'challenges._id': { $in: solvedIds } }, { _id: { $in: linkedIds } }],
    }).lean(),
    Competition.find({
      type: 'event',
      $or: [
        { 'eventState.registrations.userId': targetId },
        { 'eventState.solves.userId': targetId },
        { 'eventState.teams.lockedMembers': targetId },
      ],
    }).lean(),
    Certificate.find({ userId: targetId, revokedAt: null }).sort({ issuedAt: -1 }).lean(),
  ]);
  const shownWorkshops = workshops.filter(visible);
  const shownEvents = events.filter(visible);

  // Standings need every player of each workshop's universities, loaded once.
  const workshopCodes = [...new Set(shownWorkshops.flatMap(getCompetitionUniversityCodes))];
  const [players, workshopCopies, universities] = await Promise.all([
    workshopCodes.length
      ? User.find({ universityCode: { $in: workshopCodes }, isBanned: { $ne: true } })
        .select('username universityCode solvedChallengesDetails competitionBonusPoints competitionPenalties unlockedHints')
        .lean()
      : [],
    shownWorkshops.length
      ? Challenge.find({ fromCompetition: true, competitionId: { $in: shownWorkshops.map(w => String(w._id)) } })
        .select('competitionId')
        .lean()
      : [],
    University.find({ code: { $in: [...shownWorkshops, ...shownEvents].map((c: any) => c.universityCode) } })
      .select('code name')
      .lean(),
  ]);
  const host = (code: string) => ({ code, name: universities.find((u: any) => u.code === code)?.name || code });
  const certificateFor = new Map<string, string>(certificates.map((c: any) => [String(c.competitionId), c.code]));

  const workshopEntries = shownWorkshops.map((c: any): CompetitionRecordEntry => {
    const id = String(c._id);
    const codes = getCompetitionUniversityCodes(c);
    const copyIds = new Set<string>(workshopCopies.filter((w: any) => w.competitionId === id).map((w: any) => String(w._id)));
    const standings = workshopStandings(c, players.filter((p: any) => codes.includes(p.universityCode)), copyIds);
    const index = standings.findIndex(s => String(s.user._id) === targetId);
    const row = index >= 0 ? standings[index] : null;
    return {
      id, kind: 'workshop', name: c.name, status: c.status,
      startTime: c.startTime || null, endTime: c.endTime || null, hasTimeLimit: c.hasTimeLimit !== false,
      host: host(c.universityCode),
      rank: row ? index + 1 : null,
      field: standings.length,
      points: row ? row.points : null,
      solved: row ? row.solvedChallenges : null,
      totalChallenges: (c.challenges || []).length,
      firstBloods: (c.challenges || []).filter((ch: any) => drewFirstBlood(ch.solvers, targetId)).length,
      team: null, ownSolves: null, resultsPublished: false, certificateCode: null,
    };
  });

  const eventEntries = shownEvents.map((c: any): CompetitionRecordEntry => {
    const id = String(c._id);
    // A player who left a team after it scored is still on record as having played for it.
    const team: EventTeam | undefined = eventTeamFor(c, targetId)
      || c.eventState?.teams?.find((t: EventTeam) => t.lockedMembers?.includes(targetId));
    const entry: CompetitionRecordEntry = {
      id, kind: 'event', name: c.name, status: c.status,
      startTime: c.startTime || null, endTime: c.endTime || null, hasTimeLimit: c.hasTimeLimit !== false,
      host: host(c.universityCode),
      rank: null, field: null, points: null, solved: null, totalChallenges: null, firstBloods: null,
      team: team?.name || null, ownSolves: null,
      resultsPublished: !!c.resultsPublishedAt,
      certificateCode: certificateFor.get(id) || null,
    };
    if (c.status !== 'ended') return entry;

    const cutoff = freezeCutoff(c);
    const board = eventLeaderboard(c, false, { frozenAt: cutoff }).leaderboard;
    const index = team ? board.findIndex((row: any) => row._id === team.id) : -1;
    const own = uniqueSolves(cutoff ? frozenView(c, cutoff) : c).filter(s => s.userId === targetId);
    const endedAt = c.endTime ? new Date(c.endTime).getTime() : Date.now();
    return {
      ...entry,
      rank: index >= 0 ? index + 1 : null,
      field: board.length,
      points: index >= 0 ? board[index].points : null,
      solved: index >= 0 ? board[index].solvedChallenges : null,
      totalChallenges: c.challenges.filter((ch: any) => isReleased(ch, endedAt)).length,
      firstBloods: own.filter(s => s.firstBlood).length,
      ownSolves: own.length,
    };
  });

  const shownEventIds = new Set(shownEvents.map((c: any) => String(c._id)));
  return {
    competitions: [...workshopEntries, ...eventEntries].sort(byStartDesc),
    certificates: certificates
      .filter((c: any) => !viewer || shownEventIds.has(String(c.competitionId)))
      .map(publicCertificate),
  };
}
