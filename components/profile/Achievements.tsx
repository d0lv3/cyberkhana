import React, { useId } from 'react';
import { Award } from 'lucide-react';
import { InsigniaState, InsigniaTone, ROMAN, nextUp } from './insignia';
import { formatDate } from './profileData';

/* ── Insignia ──
 * A struck hexagon: a dark plate washed in the tone, a rim, an inner rim, and
 * the glyph, with one pip per tier along the foot. A locked insignia keeps
 * its shape in the edge colours, so the whole set reads as one collection
 * with gaps in it rather than as a grid of padlocks. */

const HEX = 'M32 3.5 56.68 17.75 56.68 46.25 32 60.5 7.32 46.25 7.32 17.75Z';
const HEX_INNER = 'M32 9.5 51.49 20.75 51.49 43.25 32 54.5 12.51 43.25 12.51 20.75Z';
const SHEEN = 'M32 3.5 56.68 17.75 56.68 32 7.32 32 7.32 17.75Z';

const TONES: Record<InsigniaTone, { rim: string; glyph: string; card: string; bar: string }> = {
  brand: { rim: '#00a859', glyph: '#9fef00', card: 'border-brand/25 bg-brand/[0.05]', bar: 'bg-brand' },
  blood: { rim: '#f3a43a', glyph: '#fcd28f', card: 'border-amber/25 bg-amber/[0.05]', bar: 'bg-amber' },
};

const LOCKED = { plate: '#0e1522', rim: '#2a3346', inner: '#263248', glyph: '#8592ad', pip: '#354562' };

export const InsigniaEmblem: React.FC<{ state: InsigniaState; size?: number; className?: string }> = ({
  state,
  size = 64,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const earned = state.tiersEarned > 0;
  const tone = TONES[state.tone];
  const Glyph = state.glyph;
  // Pips turn to specks below ~48px, so the small size carries the glyph alone.
  const pips = state.tierCount > 1 && size >= 48;
  const pipX = (i: number) => 32 + (i - (state.tierCount - 1) / 2) * 6.5;

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id={`plate-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone.rim} stopOpacity="0.36" />
          <stop offset="1" stopColor={tone.rim} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={HEX} fill={earned ? '#0b1220' : LOCKED.plate} />
      {earned && <path d={HEX} fill={`url(#plate-${uid})`} />}
      {earned && <path d={SHEEN} fill="#ffffff" opacity="0.05" />}
      <path d={HEX} fill="none" stroke={earned ? tone.rim : LOCKED.rim} strokeWidth="2" strokeLinejoin="round" />
      <path
        d={HEX_INNER}
        fill="none"
        stroke={earned ? tone.rim : LOCKED.inner}
        strokeOpacity={earned ? 0.4 : 1}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* A nested <svg>, placed in the emblem's own 64-unit space. */}
      <Glyph
        x={20}
        y={pips ? 15 : 20}
        size={24}
        strokeWidth={2}
        color={earned ? tone.glyph : LOCKED.glyph}
        opacity={earned ? 1 : 0.6}
      />
      {pips &&
        Array.from({ length: state.tierCount }, (_, i) => {
          const x = pipX(i);
          const lit = i < state.tiersEarned;
          return (
            <path
              key={i}
              d={`M${x} 42.8 ${x + 2.4} 45.2 ${x} 47.6 ${x - 2.4} 45.2Z`}
              fill={lit ? tone.glyph : 'none'}
              stroke={lit ? tone.glyph : earned ? tone.rim : LOCKED.pip}
              strokeOpacity={lit ? 1 : 0.7}
              strokeWidth="1"
            />
          );
        })}
    </svg>
  );
};

const ProgressBar: React.FC<{ value: number; target: number; tone: InsigniaTone; label?: string }> = ({
  value,
  target,
  tone,
  label,
}) => (
  <div className="mt-2.5 flex items-center gap-2.5">
    <div
      className="h-1.5 flex-1 overflow-hidden rounded-full bg-inset"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={value}
      aria-label={label ? `${label}: ${value} of ${target}` : `${value} of ${target}`}
    >
      <div className={`h-full rounded-full ${TONES[tone].bar}`} style={{ width: `${Math.round((value / target) * 100)}%` }} />
    </div>
    <span className="shrink-0 text-[11px] font-semibold text-dim tabular-nums" dir="ltr">
      {label && <span className="me-1 font-medium text-faint">{label}</span>}
      {value}/{target}
    </span>
  </div>
);

const InsigniaCard: React.FC<{ state: InsigniaState }> = ({ state }) => {
  const earned = state.tiersEarned > 0;
  const tiered = state.tierCount > 1;
  const maxed = state.tiersEarned === state.tierCount;

  return (
    <li
      className={`flex min-w-0 gap-4 rounded-xl border p-4 transition-colors ${
        earned ? TONES[state.tone].card : 'border-edge bg-panel'
      }`}
    >
      <InsigniaEmblem state={state} size={64} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <h3 className={`truncate text-sm font-bold ${earned ? 'text-fg' : 'text-fg-soft'}`}>{state.name}</h3>
          {tiered && earned && (
            <span className="shrink-0 rounded border border-edge-light px-1 font-mono text-[10px] font-semibold text-muted">
              {ROMAN[state.tiersEarned - 1]}
            </span>
          )}
          {state.isNew && (
            <span className="ms-auto shrink-0 rounded-full bg-brand-neon/15 px-2 py-0.5 text-[10px] font-bold text-brand-neon">
              New
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{state.goal}</p>
        {state.progress && !maxed && (
          <ProgressBar {...state.progress} tone={state.tone} />
        )}
        {earned && (
          <p className="mt-2 text-[11px] text-faint">
            {tiered ? (maxed ? 'Every tier earned' : `Tier ${ROMAN[state.tiersEarned - 1]} earned`) : 'Earned'}
            {state.earnedAt && ` ${formatDate(state.earnedAt)}`}
          </p>
        )}
        {!earned && !state.progress && <p className="mt-2 text-[11px] text-faint">Not yet earned</p>}
      </div>
    </li>
  );
};

export const AchievementsPanel: React.FC<{ states: InsigniaState[]; own: boolean }> = ({ states, own }) => {
  const earned = states.filter(s => s.tiersEarned > 0).length;
  const tiers = states.reduce((n, s) => n + s.tiersEarned, 0);
  const totalTiers = states.reduce((n, s) => n + s.tierCount, 0);
  const next = own ? nextUp(states) : null;

  return (
    <section aria-labelledby="achievements-heading" className="space-y-4">
      <div className="flex flex-col gap-5 rounded-2xl border border-edge bg-panel p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h2 id="achievements-heading" className="flex items-center gap-2 text-lg font-black text-fg">
            <Award size={18} className="text-muted" />
            Achievements
          </h2>
          <p className="mt-1 text-sm text-muted">
            {own ? 'Earned from your capture history, and they stay earned.' : 'Earned from their capture history.'}
          </p>
          {next && (
            <p className="mt-3 text-xs text-fg-soft">
              <span className="font-semibold text-brand">Next up:</span> {next.name}, {next.goal.charAt(0).toLowerCase() + next.goal.slice(1)}
              <span className="text-faint" dir="ltr"> ({next.progress!.value}/{next.progress!.target})</span>
            </p>
          )}
        </div>
        <div className="shrink-0 sm:w-44">
          <p className="text-3xl font-black leading-none text-fg" dir="ltr">
            {earned}
            <span className="text-lg font-bold text-faint">/{states.length}</span>
          </p>
          <p className="mt-1.5 text-xs text-muted">earned · {tiers} of {totalTiers} tiers</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-inset">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.round((tiers / totalTiers) * 100)}%` }} />
          </div>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {states.map(state => (
          <InsigniaCard key={state.id} state={state} />
        ))}
      </ul>
    </section>
  );
};
