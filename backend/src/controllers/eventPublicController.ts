import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import rateLimit from 'express-rate-limit';
import Competition from '../models/Competition';
import Certificate from '../models/Certificate';
import University from '../models/University';
import { EventTeam, Registration, eventLeaderboard, isReleased, scoringContext } from '../services/eventCompetition';
import { publicCertificate } from '../services/eventCertificates';

/**
 * The two event pages anyone can open without signing in: a published results page and
 * certificate verification. Both answer from an explicit allowlist of fields. Nothing here
 * includes flags, invite codes, player names on the scoreboard, or internal ids beyond the
 * event's own.
 */

export const publicPageLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Try again in a minute.' },
});

export const getPublicResults = async (req: Request, res: Response) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(404).json({ error: 'These results are not published' });
    const c: any = await Competition.findOne({ _id: req.params.id, type: 'event', status: 'ended', resultsPublishedAt: { $ne: null } }).lean();
    if (!c) return res.status(404).json({ error: 'These results are not published' });

    const board = eventLeaderboard(c);
    const ctx = scoringContext(c);
    const accepted: string[] = c.eventState.invitations.filter((i: any) => i.status === 'accepted').map((i: any) => i.universityCode);
    const universities = await University.find({ code: { $in: accepted } }).select('code name').lean();
    const universityName = (code: string) => universities.find(u => u.code === code)?.name || code;
    const registrationOf = (userId: string) => c.eventState.registrations.find((r: Registration) => r.userId === userId);
    // Which universities a team represented, from the players it had, including any who left after scoring.
    const teamUniversities = (teamId: string) => {
      const team: EventTeam = c.eventState.teams.find((t: EventTeam) => t.id === teamId);
      const codes = [...new Set([...team.members, ...(team.lockedMembers || [])].map(id => registrationOf(id)?.universityCode).filter(Boolean))] as string[];
      return codes.map(code => ({ code, name: universityName(code) }));
    };
    const endedAt = c.endTime ? new Date(c.endTime).getTime() : Date.now();
    const played = c.challenges.filter((ch: any) => isReleased(ch, endedAt));

    return res.json({
      _id: String(c._id),
      name: c.name,
      description: c.description || '',
      host: { code: c.universityCode, name: universityName(c.universityCode) },
      universities: accepted.map(code => ({ code, name: universityName(code) })),
      startTime: c.startTime || null,
      endTime: c.endTime || null,
      publishedAt: c.resultsPublishedAt,
      stats: { teams: board.leaderboard.length, challenges: played.length, solves: ctx.solves.length },
      standings: board.leaderboard.map((row: any, index: number) => ({
        rank: index + 1, name: row.name, points: row.points, solved: row.solvedChallenges,
        players: row.memberCount, universities: teamUniversities(row._id), lastSolveTime: row.lastSolveTime,
      })),
      timeline: board.timeline,
      challenges: played.map((ch: any) => {
        const id = String(ch._id);
        const blood = ctx.solves.find(s => s.challengeId === id && s.firstBlood);
        return {
          title: ch.title, category: ch.category, difficulty: ch.difficulty || null,
          points: ctx.values.get(id), solves: ctx.counts.get(id) || 0,
          firstBlood: blood ? c.eventState.teams.find((t: EventTeam) => t.id === blood.teamId)?.name || null : null,
        };
      }),
    });
  } catch (error) {
    console.error('Public results failed:', error);
    return res.status(500).json({ error: 'Could not load results' });
  }
};

export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const code = String(req.params.code || '').toLowerCase();
    if (!/^[a-f\d]{32}$/.test(code)) return res.status(404).json({ error: 'Certificate not found' });
    const certificate = await Certificate.findOne({ code }).lean();
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });
    return res.json(publicCertificate(certificate));
  } catch (error) {
    console.error('Certificate verification failed:', error);
    return res.status(500).json({ error: 'Could not verify the certificate' });
  }
};
