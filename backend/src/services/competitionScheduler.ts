import Competition from '../models/Competition';
import { SocketEvents } from './socketService';
import { logger } from '../utils/logger';

/**
 * Closes competitions whose end time has passed.
 *
 * Nothing used to do this. A competition stayed `active` in the database until
 * an admin remembered to press End, and whether a player saw it as finished was
 * decided entirely by their own device clock — so a machine an hour off ended
 * someone's competition an hour early, or kept it open an hour late.
 *
 * With this running, `status` is the authoritative answer and the clock on the
 * player's laptop stops mattering. Ending is one-way and idempotent: the query
 * only ever matches a competition that is still active and genuinely past its
 * end time, so a repeated sweep is a no-op.
 */

const SWEEP_INTERVAL_MS = 30_000;

let timer: NodeJS.Timeout | null = null;

export const closeExpiredCompetitions = async (): Promise<number> => {
  const now = new Date();

  const expired = await Competition.find({
    status: 'active',
    hasTimeLimit: { $ne: false },
    endTime: { $ne: null, $lte: now }
  }).select('_id name universityCode universityCodes endTime');

  for (const competition of expired) {
    const id = (competition._id as any).toString();

    // Re-assert the guard in the update so two overlapping sweeps, or a sweep
    // racing an admin pressing End, cannot both claim the transition.
    const result = await Competition.updateOne(
      { _id: competition._id, status: 'active' },
      { $set: { status: 'ended' } }
    );

    if (result.modifiedCount === 0) continue;

    const codes = Array.from(
      new Set(
        [competition.universityCode, ...((competition as any).universityCodes || [])]
          .filter(Boolean)
          .map((code: string) => code.trim().toUpperCase())
      )
    );

    logger.info('competition.auto_ended', {
      competitionId: id,
      name: competition.name,
      endTime: competition.endTime
    });

    try {
      SocketEvents.emitCompetitionUpdate(codes, {
        competitionId: id,
        type: 'ended',
        message: `Competition "${competition.name}" has ended`
      });
    } catch (error) {
      // A socket failure must not stop the sweep — the status change is what matters.
      logger.error('competition.auto_end.emit_failed', { competitionId: id, error });
    }
  }

  return expired.length;
};

export const startCompetitionScheduler = () => {
  if (timer) return;

  const sweep = () => {
    closeExpiredCompetitions().catch((error) => {
      logger.error('competition.scheduler.sweep_failed', { error });
    });
  };

  sweep();
  timer = setInterval(sweep, SWEEP_INTERVAL_MS);
  timer.unref?.();

  logger.info('competition.scheduler.started', { intervalMs: SWEEP_INTERVAL_MS });
};

export const stopCompetitionScheduler = () => {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
};
