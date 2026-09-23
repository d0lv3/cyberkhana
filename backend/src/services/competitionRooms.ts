import { isValidObjectId } from 'mongoose';
import Competition from '../models/Competition';
import User from '../models/User';
import { eventAccess } from './eventCompetition';

/** Event room admission is checked on the server, including after a racing removal. */
export async function joinCompetitionRoom(socket: any, competitionId: unknown) {
  if (typeof competitionId !== 'string' || !isValidObjectId(competitionId)) return;
  try {
    const competition = await Competition.findById(competitionId).lean();
    if (!competition) return;
    if (competition.type === 'event') {
      const actor = socket.user.role === 'super-admin' ? null : await User.findById(socket.user.userId).select('isBanned role universityCode').lean();
      if ((socket.user.role !== 'super-admin' && (!actor || actor.isBanned || actor.role !== socket.user.role || actor.universityCode !== socket.user.universityCode)) || !eventAccess(competition, socket.user)) return;
    }
    await socket.join(`competition:${competitionId}`);
    if (competition.type === 'event') {
      const fresh = await Competition.findById(competitionId).lean();
      if (!fresh || !eventAccess(fresh, socket.user)) await socket.leave(`competition:${competitionId}`);
    }
  } catch { await socket.leave(`competition:${competitionId}`); }
}
