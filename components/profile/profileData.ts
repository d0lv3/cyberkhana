import type { CertificateData } from '../certificates/CertificateTemplate';

/* ── The profile, as the page draws it ──
 * Your own profile (/users/me) and someone else's (/users/profile/:id) come
 * back in slightly different shapes; both are read into this one, so every
 * section renders the same way whoever is looking. Everything the page shows
 * is derived from here, the achievements included, so nothing depends on what
 * one browser happens to remember.
 */

export interface ProfileSolve {
  id: string;
  title: string;
  category: string;
  difficulty: string | null;
  points: number;
  solvedAt: Date | null;
  firstBlood: boolean;
  /** False once the challenge is taken off the range. It still counts as a capture, not as coverage. */
  published: boolean;
}

export interface ProfileData {
  id: string;
  username: string;
  fullName: string;
  displayName: string;
  /** What to call them: full name, then display name, then username, as in the header. */
  name: string;
  profileIcon?: string;
  universityCode: string;
  universityName: string;
  joinedAt: Date | null;
  points: number;
  rank: number | null;
  totalUsers: number | null;
  /** Published practice challenges, in total and per category. */
  totalChallenges: number;
  categoryTotals: Record<string, number>;
  /** Practice solves, newest first. */
  solves: ProfileSolve[];
}

export interface RecordEntry {
  id: string;
  kind: 'workshop' | 'event';
  name: string;
  status: 'pending' | 'active' | 'ended';
  startTime: string | null;
  endTime: string | null;
  hasTimeLimit: boolean;
  host: { code: string; name: string };
  rank: number | null;
  /** Players (workshop) or teams (event) in the standings. */
  field: number | null;
  points: number | null;
  solved: number | null;
  totalChallenges: number | null;
  firstBloods: number | null;
  team: string | null;
  ownSolves: number | null;
  resultsPublished: boolean;
  certificateCode: string | null;
}

export interface CompetitionRecord {
  competitions: RecordEntry[];
  certificates: CertificateData[];
}

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const nameOf = (fullName: string, displayName: string, username: string) =>
  fullName || displayName || username || 'Operator';

export const toProfileData = (raw: any): ProfileData => {
  const username = raw?.username || '';
  const fullName = raw?.fullName || '';
  const displayName = raw?.displayName || '';
  return {
    id: String(raw?._id || raw?.id || ''),
    username,
    fullName,
    displayName,
    name: nameOf(fullName, displayName, username),
    profileIcon: raw?.profileIcon,
    universityCode: (raw?.universityCode || '').toUpperCase(),
    universityName: raw?.universityName || raw?.universityCode || '',
    joinedAt: toDate(raw?.createdAt),
    points: Number(raw?.points ?? raw?.regularPoints ?? raw?.totalPoints ?? 0),
    rank: raw?.rank || null,
    totalUsers: raw?.totalUsers || null,
    totalChallenges: Number(raw?.totalChallenges || 0),
    categoryTotals: raw?.categoryTotals || {},
    solves: (raw?.regularSolvedChallenges || []).map((s: any) => ({
      id: String(s.challengeId || s._id),
      title: s.title || 'Unknown challenge',
      category: s.category || 'Miscellaneous',
      difficulty: s.difficulty || null,
      points: Number(s.points || 0),
      solvedAt: toDate(s.solvedAt),
      firstBlood: !!s.firstBlood,
      published: s.published !== false,
    })),
  };
};

export const toCompetitionRecord = (raw: any): CompetitionRecord => ({
  competitions: Array.isArray(raw?.competitions) ? raw.competitions : [],
  certificates: Array.isArray(raw?.certificates) ? raw.certificates : [],
});

/* ── Days ──
 * Activity is counted in the viewer's own calendar days. A day's index comes
 * from its local date through UTC, so a daylight-saving change can never make
 * two consecutive days look 23 or 25 hours apart. */

export const dayIndex = (date: Date) =>
  Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);

/** The local date a day index stands for. */
export const dayDate = (index: number) => {
  const utc = new Date(index * 86400000);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
};

/** Captures per day, keyed by day index. */
export const capturesByDay = (solves: ProfileSolve[]) => {
  const days = new Map<number, number>();
  for (const solve of solves) {
    if (!solve.solvedAt) continue;
    const day = dayIndex(solve.solvedAt);
    days.set(day, (days.get(day) || 0) + 1);
  }
  return days;
};

export interface Streaks {
  /** Days in a row up to today. Still alive until a day passes with no capture. */
  current: number;
  best: number;
  /** When a run first reached each length: the first capture on that day. */
  reachedAt: Map<number, Date>;
}

export const streaksOf = (solves: ProfileSolve[], now = new Date()): Streaks => {
  const firstOfDay = new Map<number, Date>();
  for (const solve of solves) {
    if (!solve.solvedAt) continue;
    const day = dayIndex(solve.solvedAt);
    const earliest = firstOfDay.get(day);
    if (!earliest || solve.solvedAt < earliest) firstOfDay.set(day, solve.solvedAt);
  }

  const days = [...firstOfDay.keys()].sort((a, b) => a - b);
  const reachedAt = new Map<number, Date>();
  let run = 0;
  let best = 0;
  days.forEach((day, i) => {
    run = i > 0 && day === days[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    if (!reachedAt.has(run)) reachedAt.set(run, firstOfDay.get(day)!);
  });

  const last = days[days.length - 1];
  return { current: last !== undefined && last >= dayIndex(now) - 1 ? run : 0, best, reachedAt };
};

/* ── Disciplines ── */

export interface Discipline {
  category: string;
  /** Solves of challenges still on the range. */
  solved: number;
  total: number;
}

export const coverage = (d: Discipline) => (d.total > 0 ? d.solved / d.total : 0);

/** Every category on the range, with how much of it has been cleared, strongest first. */
export const disciplinesOf = (data: ProfileData): Discipline[] => {
  const solved = new Map<string, number>();
  for (const solve of data.solves) {
    if (solve.published) solved.set(solve.category, (solved.get(solve.category) || 0) + 1);
  }
  return Object.entries(data.categoryTotals)
    .filter(([, total]) => total > 0)
    .map(([category, total]) => ({ category, total, solved: Math.min(solved.get(category) || 0, total) }))
    .sort((a, b) => coverage(b) - coverage(a) || b.solved - a.solved || b.total - a.total || a.category.localeCompare(b.category));
};

/** Where most of their captures are. Ties go to the discipline they reached first. */
export const focusOf = (solves: ProfileSolve[]): string | null => {
  const counts = new Map<string, number>();
  for (const solve of [...solves].reverse()) counts.set(solve.category, (counts.get(solve.category) || 0) + 1);
  let focus: string | null = null;
  for (const [category, count] of counts) if (!focus || count > counts.get(focus)!) focus = category;
  return focus;
};

/* ── Formatting ── */

export const formatDate = (date: Date | string | null | undefined, withYear = true) => {
  const d = typeof date === 'string' ? toDate(date) : date;
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
};

/** "Just now", "5 min ago", "Yesterday", then a date. */
export const timeAgo = (date: Date | null, now = new Date()) => {
  if (!date) return '';
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24 && dayIndex(date) === dayIndex(now)) return `${hours} h ago`;
  const days = dayIndex(now) - dayIndex(date);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(date, date.getFullYear() !== now.getFullYear());
};

export const ordinal = (n: number) => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
};

export const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
