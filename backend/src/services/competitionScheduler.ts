import Competition from '../models/Competition';
import { getIO, SocketEvents } from './socketService';
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
  }).select('_id name universityCode universityCodes endTime type eventState.invitations');

  for (const competition of expired) {
    const id = (competition._id as any).toString();

    // Re-assert the guard in the update so two overlapping sweeps, or a sweep
    // racing an admin pressing End, cannot both claim the transition.
    const result = await Competition.updateOne(
      { _id: competition._id, status: 'active' },
      { $set: { status: 'ended' } }
    );

    if (result.modifiedCount === 0) continue;

    const codes = competition.type === 'event' ? (competition.eventState?.invitations || []).filter(i => i.status === 'accepted').map(i => i.universityCode) : Array.from(
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
      if (competition.type === 'event') getIO().to(`competition:${id}`).emit('eventChanged', { competitionId: id });
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

/**
 * Opens events whose host scheduled an automatic start, as a CTF opens at its
 * published time without anyone at the console. An event with no challenge
 * released at the start stays pending: opening an empty board would only start
 * the clock.
 *
 * The update bumps `eventRevision` along with the status guard, so an event
 * mutation racing this transition retries against the started event.
 */
/** A challenge on the board at the start, rather than one held back for a later wave. */
const releasedBy = (now: Date) => ({ $or: [{ releaseAt: null }, { releaseAt: { $lte: now } }] });

export const startScheduledEvents = async (): Promise<number> => {
  const now = new Date();

  const due = await Competition.find({
    type: 'event',
    status: 'pending',
    autoStart: true,
    startTime: { $ne: null, $lte: now },
    challenges: { $elemMatch: releasedBy(now) }
  }).select('_id name startTime endTime duration hasTimeLimit eventState.invitations');

  let started = 0;
  for (const event of due) {
    const id = (event._id as any).toString();
    // A timer event runs its duration from the published start, not from the sweep.
    const endTime = event.hasTimeLimit !== false && !event.endTime && event.duration
      ? new Date(new Date(event.startTime).getTime() + event.duration * 60000)
      : undefined;

    const result = await Competition.updateOne(
      // Re-checked here too: a host could remove the last challenge between the read and this write.
      { _id: event._id, status: 'pending', autoStart: true, challenges: { $elemMatch: releasedBy(now) } },
      { $set: { status: 'active', ...(endTime ? { endTime } : {}) }, $inc: { eventRevision: 1 } }
    );
    if (result.modifiedCount === 0) continue;
    started++;

    logger.info('competition.auto_started', { competitionId: id, name: event.name, startTime: event.startTime });

    try {
      const codes = (event.eventState?.invitations || []).filter(i => i.status === 'accepted').map(i => i.universityCode);
      getIO().to(`competition:${id}`).emit('eventChanged', { competitionId: id });
      SocketEvents.emitCompetitionUpdate(codes, { competitionId: id, type: 'started', message: `Competition "${event.name}" has started` });
    } catch (error) {
      logger.error('competition.auto_start.emit_failed', { competitionId: id, error });
    }
  }

  return started;
};

export const startCompetitionScheduler = () => {
  if (timer) return;

  // Start before closing, so an event whose whole window passed while the
  // server was down still opens and then closes in order.
  const sweep = () => {
    startScheduledEvents()
      .then(() => closeExpiredCompetitions())
      .catch((error) => {
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
