import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flag, Trophy } from 'lucide-react';

const MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace";

/**
 * Handles rather than universities, deliberately.
 *
 * A board of real institution names on a marketing page reads as a claim about
 * who has signed up, whether or not it is meant to. Handles say "capture the
 * flag" just as clearly and promise nothing on anybody else's behalf.
 */
const START = [
  { handle: '0xhawk', score: 4820 },
  { handle: 'nullbyte', score: 4655 },
  { handle: 'r00tk1t', score: 3910 },
  { handle: 's4ndbox', score: 3140 },
  { handle: 'ghostshell', score: 2870 },
];

const FIRST_BLOODS = [
  { cat: 'web', name: 'broken-object-ref', pts: 350 },
  { cat: 'pwn', name: 'ret2libc-warmup', pts: 500 },
  { cat: 'crypto', name: 'padding-oracle', pts: 450 },
  { cat: 'rev', name: 'packed-elf', pts: 400 },
  { cat: 'forensics', name: 'carved-pcap', pts: 300 },
];

const SOLVE_MS = 2400;
const BLOOD_MS = 3600;

interface Row {
  handle: string;
  score: number;
  /** Places gained on the last shuffle, for the rise indicator. */
  delta: number;
}

/**
 * A scoreboard, quietly playing.
 *
 * The hero needs one thing that could only belong to this product, and for a
 * capture-the-flag platform that is the board: scores climbing, someone
 * overtaking someone, first blood going to whoever got there first. It carries
 * the idea faster than a screenshot of the dashboard would, and unlike a
 * screenshot it stays true when the dashboard changes.
 *
 * Driven by timers rather than animation frames. A hero that a background tab
 * never paints would otherwise show a frozen board.
 */
const HeroScoreboard = () => {
  const reduceMotion = useReducedMotion();
  const [rows, setRows] = useState<Row[]>(() =>
    START.map((r) => ({ ...r, delta: 0 }))
  );
  const [blood, setBlood] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setRows((prev) => {
        const before = prev.map((r) => r.handle);
        // One solve at a time: a board where everything moves at once reads as
        // noise rather than as a competition.
        const i = Math.floor(Math.random() * prev.length);
        const bumped = prev.map((r, k) =>
          k === i ? { ...r, score: r.score + 50 * (1 + Math.floor(Math.random() * 8)) } : r
        );
        const sorted = [...bumped].sort((a, b) => b.score - a.score);
        return sorted.map((r) => ({
          ...r,
          delta: before.indexOf(r.handle) - sorted.findIndex((x) => x.handle === r.handle),
        }));
      });
    }, SOLVE_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setBlood((b) => (b + 1) % FIRST_BLOODS.length), BLOOD_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const fb = FIRST_BLOODS[blood];

  return (
    <div
      dir="ltr"
      className="w-full overflow-hidden rounded-2xl border border-edge bg-[#0b1019] shadow-2xl"
    >
      <div className="flex items-center gap-1.5 border-b border-[#1a2332] bg-canvas px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#2c3a54]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#2c3a54]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#2c3a54]" />
        <span className="ml-2 text-[10px] font-semibold text-faintest" style={{ fontFamily: MONO }}>
          national-leaderboard
        </span>
        <Trophy className="ml-auto h-3.5 w-3.5 text-brand-neon/70" aria-hidden />
      </div>

      <ul className="divide-y divide-[#141c2b]">
        {rows.map((r, i) => (
          <motion.li
            layout={!reduceMotion}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            key={r.handle}
            className="flex items-center gap-3 px-4 py-3"
          >
            <span
              className={`w-6 text-sm font-bold ${i === 0 ? 'text-brand-neon' : 'text-faintest'}`}
              style={{ fontFamily: MONO }}
            >
              {i + 1}
            </span>

            <span className="flex-1 truncate text-sm text-fg-soft" style={{ fontFamily: MONO }}>
              {r.handle}
            </span>

            {/* Only shown for someone who actually gained a place, so the board
                explains its own reordering as it happens. */}
            {r.delta > 0 && (
              <span className="text-[10px] font-bold text-brand">▲{r.delta}</span>
            )}

            <span
              className={`w-16 text-end text-sm tabular-nums ${i === 0 ? 'text-fg' : 'text-muted'}`}
              style={{ fontFamily: MONO }}
            >
              {r.score.toLocaleString('en-US')}
            </span>
          </motion.li>
        ))}
      </ul>

      <div className="flex items-center gap-2 border-t border-[#1a2332] bg-canvas px-4 py-2.5">
        <Flag className="h-3.5 w-3.5 flex-shrink-0 text-danger" aria-hidden />
        <motion.span
          key={fb.name}
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="truncate text-[10px] text-faint"
          style={{ fontFamily: MONO }}
        >
          <span className="text-danger">first blood</span>
          {`  ${fb.cat}/${fb.name}  +${fb.pts}`}
        </motion.span>
      </div>
    </div>
  );
};

export default HeroScoreboard;
