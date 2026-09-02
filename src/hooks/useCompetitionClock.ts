import { useEffect, useState } from 'react';

/**
 * A ticking clock for competition countdowns.
 *
 * The countdowns were plain functions called during render, with no interval
 * anywhere — so "1h 40m remaining" sat frozen for the whole event and a player
 * on the page was never locked out when the time ran out. The first thing they
 * learned was a rejected submission.
 *
 * Ticking every second is more than the "1h 40m" text needs, but it is what the
 * final minute needs, and one `Date.now()` per second costs nothing.
 */
export const useNow = (intervalMs = 1000): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
};

interface CompetitionLike {
  status?: string;
  endTime?: string | null;
  hasTimeLimit?: boolean;
}

/**
 * Whether a competition is over.
 *
 * `status` is asked first and is authoritative: the server sweeps expired
 * competitions to `ended`, so a player whose device clock is an hour out no
 * longer decides this for themselves. The time comparison stays as a fallback
 * for the gap between expiry and the next sweep.
 */
export const isCompetitionOver = (competition: CompetitionLike | null | undefined, now: number): boolean => {
  if (!competition) return false;
  if (competition.status === 'ended') return true;

  // An untimed competition only ends when an admin ends it.
  if (competition.hasTimeLimit === false) return false;
  if (!competition.endTime) return false;

  const end = new Date(competition.endTime).getTime();
  if (Number.isNaN(end)) return false;

  return now > end;
};

/** "2d 4h" / "3h 12m" / "45m" / "20s" — coarse until it matters, then precise. */
export const formatTimeRemaining = (
  endTime: string | null | undefined,
  now: number,
  hasTimeLimit?: boolean
): string => {
  if (hasTimeLimit === false || !endTime) return 'No time limit';

  const end = new Date(endTime).getTime();
  if (Number.isNaN(end)) return 'No time limit';

  const diff = end - now;
  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};
