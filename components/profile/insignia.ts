import { Compass, Crosshair, Droplet, Flag, Flame, Moon, Skull, Trophy, Zap, type LucideIcon } from 'lucide-react';
import { categoryLabel } from '../challenges/ChallengeArt';
import { ProfileData, ProfileSolve, coverage, disciplinesOf, streaksOf } from './profileData';

/* ── Achievements ──
 * Each one is worked out from the solve history on every render, never stored
 * or awarded, so it is the same on every device and says exactly why it was
 * earned. That also dates it: the capture that crossed the line is the moment
 * it was earned. Nothing here grants points; the old panel promised rewards
 * that were never paid out.
 *
 * Standing is left out on purpose. A rank can fall again, and an achievement
 * that quietly disappears is worse than none; the profile header shows rank.
 */

/** Brand green is what an operator earns. Amber is first blood, as everywhere else in the product. */
export type InsigniaTone = 'brand' | 'blood';

export interface InsigniaState {
  id: string;
  name: string;
  glyph: LucideIcon;
  tone: InsigniaTone;
  /** 1 for a one-off feat. */
  tierCount: number;
  tiersEarned: number;
  /** The next thing to do, or the last one once every tier is earned. */
  goal: string;
  /** Toward the next tier. Null when there is no meaningful count to show. */
  progress: { value: number; target: number; label?: string } | null;
  /** When the latest tier was earned; null when locked or undatable. */
  earnedAt: Date | null;
  isNew: boolean;
}

const NEW_FOR_MS = 7 * 86400000;
const HARD = new Set(['Hard', 'Expert']);
const SPECIALIST_MIN = 3;
const BLITZ_COUNT = 3;
const BLITZ_WINDOW_MS = 60 * 60000;

interface TrackDef {
  id: string;
  name: string;
  glyph: LucideIcon;
  tone?: InsigniaTone;
  tiers: number[];
  goal: (target: number) => string;
}

export const evaluateInsignia = (data: ProfileData, now = new Date()): InsigniaState[] => {
  const isNew = (at: Date | null) => !!at && now.getTime() - at.getTime() < NEW_FOR_MS;
  const dated = data.solves
    .filter((s): s is ProfileSolve & { solvedAt: Date } => !!s.solvedAt)
    .sort((a, b) => a.solvedAt.getTime() - b.solvedAt.getTime());

  /* A tiered count: `value` against rising thresholds, dated by the solve that crossed each. */
  const track = (def: TrackDef, value: number, crossedAt: (threshold: number) => Date | null): InsigniaState => {
    const tiersEarned = def.tiers.filter(t => value >= t).length;
    const next = def.tiers[tiersEarned];
    const earnedAt = tiersEarned ? crossedAt(def.tiers[tiersEarned - 1]) : null;
    return {
      id: def.id, name: def.name, glyph: def.glyph, tone: def.tone ?? 'brand',
      tierCount: def.tiers.length, tiersEarned,
      goal: def.goal(next ?? def.tiers[def.tiers.length - 1]),
      // A bar toward "1" says nothing the goal does not.
      progress: next !== undefined && next > 1 ? { value: Math.min(value, next), target: next } : null,
      earnedAt, isNew: isNew(earnedAt),
    };
  };

  /* A one-off. */
  const feat = (
    def: Omit<TrackDef, 'tiers' | 'goal'> & { goal: string },
    earned: boolean,
    earnedAt: Date | null,
    progress: InsigniaState['progress'] = null,
  ): InsigniaState => ({
    id: def.id, name: def.name, glyph: def.glyph, tone: def.tone ?? 'brand',
    tierCount: 1, tiersEarned: earned ? 1 : 0, goal: def.goal,
    progress: earned ? null : progress,
    earnedAt: earned ? earnedAt : null, isNew: earned && isNew(earnedAt),
  });

  const nth = (solves: Array<{ solvedAt: Date }>) => (n: number) => solves[n - 1]?.solvedAt ?? null;

  // First bloods and hard solves.
  const bloods = dated.filter(s => s.firstBlood);
  const hard = dated.filter(s => s.difficulty && HARD.has(s.difficulty));
  const streak = streaksOf(data.solves, now);

  // Full spectrum: the solve that brought the last discipline in.
  const available = new Set(Object.entries(data.categoryTotals).filter(([, n]) => n > 0).map(([c]) => c));
  const touched = new Set(data.solves.map(s => s.category).filter(c => available.has(c)));
  let spectrumAt: Date | null = null;
  const seen = new Set<string>();
  for (const s of dated) {
    if (!available.has(s.category)) continue;
    seen.add(s.category);
    if (seen.size === available.size) { spectrumAt = s.solvedAt; break; }
  }

  // Specialist: a discipline of at least three challenges, all captured.
  const eligible = disciplinesOf(data).filter(d => d.total >= SPECIALIST_MIN);
  const cleared = eligible.filter(d => d.solved >= d.total);
  const clearedAt = cleared
    .map(d => dated.filter(s => s.published && s.category === d.category).pop()?.solvedAt ?? null)
    .filter((at): at is Date => !!at)
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  const closest = [...eligible].sort((a, b) => coverage(b) - coverage(a) || b.solved - a.solved)[0];

  // Range cleared.
  const onRange = data.solves.filter(s => s.published).length;
  const lastOnRange = dated.filter(s => s.published).pop()?.solvedAt ?? null;

  // Night shift: local time, since that is what "midnight" means to the player.
  const nightAt = dated.find(s => s.solvedAt.getHours() < 5)?.solvedAt ?? null;

  // Blitz: the most captures inside any one hour, and when three first fit.
  let burst = 0;
  let blitzAt: Date | null = null;
  for (let end = 0, start = 0; end < dated.length; end++) {
    while (dated[end].solvedAt.getTime() - dated[start].solvedAt.getTime() > BLITZ_WINDOW_MS) start++;
    burst = Math.max(burst, end - start + 1);
    if (!blitzAt && end - start + 1 >= BLITZ_COUNT) blitzAt = dated[end].solvedAt;
  }

  const states: InsigniaState[] = [
    track({ id: 'flags', name: 'Flag hunter', glyph: Flag, tiers: [1, 10, 25, 50, 100],
      goal: n => (n === 1 ? 'Capture your first flag' : `Capture ${n} flags`) },
    data.solves.length, nth(dated)),
    track({ id: 'first-blood', name: 'First blood', glyph: Droplet, tone: 'blood', tiers: [1, 3, 10],
      goal: n => (n === 1 ? 'Be the first to solve a challenge' : `Be first to solve ${n} challenges`) },
    data.solves.filter(s => s.firstBlood).length, nth(bloods)),
    track({ id: 'streak', name: 'Relentless', glyph: Flame, tiers: [3, 7, 14],
      goal: n => `Capture flags ${n} days in a row` },
    streak.best, n => streak.reachedAt.get(n) ?? null),
    track({ id: 'heavy-hitter', name: 'Heavy hitter', glyph: Skull, tiers: [1, 5, 10],
      goal: n => (n === 1 ? 'Solve a Hard or Expert challenge' : `Solve ${n} Hard or Expert challenges`) },
    data.solves.filter(s => s.difficulty && HARD.has(s.difficulty)).length, nth(hard)),
    feat({ id: 'full-spectrum', name: 'Full spectrum', glyph: Compass, goal: 'Capture a flag in every discipline' },
      available.size > 0 && touched.size >= available.size, spectrumAt,
      available.size > 1 ? { value: touched.size, target: available.size } : null),
    feat({ id: 'specialist', name: 'Specialist', glyph: Crosshair, goal: 'Clear every challenge in one discipline' },
      cleared.length > 0, clearedAt,
      closest ? { value: closest.solved, target: closest.total, label: categoryLabel(closest.category) } : null),
    feat({ id: 'range-cleared', name: 'Range cleared', glyph: Trophy, goal: 'Capture every flag on the range' },
      data.totalChallenges > 0 && onRange >= data.totalChallenges, lastOnRange,
      data.totalChallenges > 0 ? { value: Math.min(onRange, data.totalChallenges), target: data.totalChallenges } : null),
    feat({ id: 'night-shift', name: 'Night shift', glyph: Moon, goal: 'Capture a flag between midnight and 5 am' },
      !!nightAt, nightAt),
    feat({ id: 'blitz', name: 'Blitz', glyph: Zap, goal: `Capture ${BLITZ_COUNT} flags within an hour` },
      !!blitzAt, blitzAt, burst > 0 ? { value: Math.min(burst, BLITZ_COUNT), target: BLITZ_COUNT } : null),
  ];

  // Earned first, newest first; then what is closest to done.
  const ratio = (s: InsigniaState) => (s.progress ? s.progress.value / s.progress.target : 0);
  return states
    .map((state, order) => ({ state, order }))
    .sort((a, b) => {
      const ae = a.state.tiersEarned > 0, be = b.state.tiersEarned > 0;
      if (ae !== be) return ae ? -1 : 1;
      if (ae) return (b.state.earnedAt?.getTime() ?? 0) - (a.state.earnedAt?.getTime() ?? 0) || a.order - b.order;
      return ratio(b.state) - ratio(a.state) || a.order - b.order;
    })
    .map(({ state }) => state);
};

/** The locked achievement closest to done, for a "next up" nudge. */
export const nextUp = (states: InsigniaState[]) =>
  states
    .filter(s => s.tiersEarned < s.tierCount && s.progress && s.progress.value > 0)
    .sort((a, b) => b.progress!.value / b.progress!.target - a.progress!.value / a.progress!.target)[0] ?? null;

export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
