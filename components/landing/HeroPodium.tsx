import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flag } from 'lucide-react';

const MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace";

/**
 * Handles rather than universities, deliberately.
 *
 * A stage with real institution names on it reads as a claim about who has
 * signed up, whether or not it is meant to. Handles say capture-the-flag just
 * as clearly and promise nothing on anybody else's behalf.
 */
/**
 * Kept deliberately tight — under 200 points between neighbours.
 *
 * The first version of this board spread them from 4820 down to 2870, and a
 * solve worth a few hundred could never change the order: the stage sat
 * perfectly still while the numbers went up, which is the one thing it exists
 * not to do. At these gaps most solves move somebody.
 */
const START = [
  { handle: '0xhawk', score: 4820 },
  { handle: 'nullbyte', score: 4735 },
  { handle: 'r00tk1t', score: 4610 },
  { handle: 's4ndbox', score: 4455 },
  { handle: 'ghostshell', score: 4290 },
];

const FIRST_BLOODS = [
  { cat: 'web', name: 'broken-object-ref', pts: 350 },
  { cat: 'pwn', name: 'ret2libc-warmup', pts: 500 },
  { cat: 'crypto', name: 'padding-oracle', pts: 450 },
  { cat: 'rev', name: 'packed-elf', pts: 400 },
  { cat: 'forensics', name: 'carved-pcap', pts: 300 },
];

const SOLVE_MS = 2600;
const BLOOD_MS = 3600;

/** Podium block heights, tallest in the middle. */
const STEP = { 0: 116, 1: 84, 2: 62 } as const;

interface Row {
  handle: string;
  score: number;
}

/**
 * The standings as a stage rather than a list.
 *
 * A leaderboard drawn as rows is a table, and a table is something you read.
 * Three steps with someone standing on each is something you recognise before
 * you read anything — which is the whole job of the one visual in a hero.
 *
 * It keeps playing: a solve lands every couple of seconds, and when it changes
 * the order the blocks trade places and the spotlight follows whoever is now on
 * top. The two runners-up underneath are what make a climb legible — without
 * them somebody simply appears on the podium with nowhere to have come from.
 *
 * Driven by timers rather than animation frames, so a tab that is never painted
 * does not show a frozen stage.
 */
const HeroPodium = () => {
  const reduceMotion = useReducedMotion();
  const [rows, setRows] = useState<Row[]>(START);
  const [blood, setBlood] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setRows((prev) => {
        // One solve at a time: a stage where everything moves at once reads as
        // noise rather than as a competition.
        const i = Math.floor(Math.random() * prev.length);
        const bumped = prev.map((r, k) =>
          k === i ? { ...r, score: r.score + 50 * (2 + Math.floor(Math.random() * 9)) } : r
        );
        return [...bumped].sort((a, b) => b.score - a.score);
      });
    }, SOLVE_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setBlood((b) => (b + 1) % FIRST_BLOODS.length), BLOOD_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const fb = FIRST_BLOODS[blood];

  // Second, first, third — the arrangement everyone already knows, so the
  // tallest block lands in the middle rather than at one end.
  const order = [1, 0, 2].filter((i) => podium[i]);

  return (
    <div
      dir="ltr"
      className="w-full overflow-hidden rounded-2xl border border-edge bg-[#0b1019] shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-[#1a2332] bg-canvas px-3.5 py-2.5">
        <img
          src="/assets/brand/cyberkhana-mark-sq.png"
          alt=""
          aria-hidden
          className="h-4 w-auto"
        />
        <span className="text-[10px] font-semibold text-faintest" style={{ fontFamily: MONO }}>
          national-leaderboard
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[9px] font-bold text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          LIVE
        </span>
      </div>

      <div className="relative px-4 pb-4 pt-8">
        {/* The beam. It is anchored to the middle because the middle is where
            first place stands, so it follows the winner without being animated
            itself. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{
            background:
              'linear-gradient(to bottom, rgba(159,239,0,0.16), transparent 78%)',
            clipPath: 'polygon(38% 0%, 62% 0%, 78% 100%, 22% 100%)',
          }}
        />

        <div className="relative flex items-end justify-center gap-2 sm:gap-3">
          {order.map((idx) => {
            const r = podium[idx];
            const first = idx === 0;
            return (
              <motion.div
                key={r.handle}
                layout={!reduceMotion}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="flex w-1/3 max-w-[140px] flex-col items-center"
              >
                <span
                  className={`max-w-full truncate text-xs font-bold ${first ? 'text-fg' : 'text-fg-soft'}`}
                  style={{ fontFamily: MONO }}
                >
                  {r.handle}
                </span>
                <span
                  className={`mt-0.5 text-[11px] tabular-nums ${first ? 'text-brand-neon' : 'text-muted'}`}
                  style={{ fontFamily: MONO }}
                >
                  {r.score.toLocaleString('en-US')}
                </span>

                <motion.div
                  layout={!reduceMotion}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className={`mt-2 flex w-full items-start justify-center rounded-t-lg border-x border-t pt-2 ${
                    first
                      ? 'border-brand-neon/40 bg-brand-neon/[0.13]'
                      : 'border-edge bg-panel'
                  }`}
                  style={{ height: STEP[idx as 0 | 1 | 2] }}
                >
                  <span
                    className={`text-2xl font-black leading-none ${first ? 'text-brand-neon' : 'text-edge-light'}`}
                    style={{ fontFamily: MONO }}
                  >
                    {idx + 1}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* The stage floor the blocks stand on. */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-edge-light to-transparent" />

        <ul className="mt-3 space-y-1">
          {rest.map((r, i) => (
            <motion.li
              key={r.handle}
              layout={!reduceMotion}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="flex items-center gap-3 px-1 text-[11px]"
              style={{ fontFamily: MONO }}
            >
              <span className="w-4 text-faintest">{i + 4}</span>
              <span className="flex-1 truncate text-faint">{r.handle}</span>
              <span className="tabular-nums text-faint">{r.score.toLocaleString('en-US')}</span>
            </motion.li>
          ))}
        </ul>
      </div>

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

export default HeroPodium;
