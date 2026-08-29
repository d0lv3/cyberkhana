import React, { useId } from 'react';
import { Box, Shadow, iso, mix, shades, WHITE } from '../art/iso';

/* ── Competition cover art ──
 *
 * The cover image an event never has. Built from the same isometric kit as the
 * challenge category art so a competition card and a challenge row look like
 * they come from one product, and tinted by the event's own state: a live event
 * gets the neon podium, an upcoming one the amber starting blocks, a finished
 * one the muted trophy.
 */

export type CompetitionState = 'live' | 'upcoming' | 'ended';

export const STATE_ACCENT: Record<CompetitionState, string> = {
  live: '#9fef00',
  upcoming: '#f3a43a',
  ended: '#7d8aa5',
};

interface Props {
  state: CompetitionState;
  className?: string;
}

/** Podium blocks — 2nd, 1st, 3rd — with a trophy on the winner's step. */
const Podium: React.FC<{ accent: string; uid: string; state: CompetitionState }> = ({
  accent,
  uid,
  state,
}) => {
  const c = shades(accent);
  const win = state === 'live' ? 46 : 38;
  return (
    <g>
      <Shadow x={30} y={30} rx={62} ry={30} blur={`blur-${uid}`} />
      {/* silver / gold / bronze steps, all in the state's own hue so the card
          reads as one colour rather than three competing ones */}
      <Box x={-2} y={22} z={0} w={30} d={34} h={26} accent={accent} lift={-0.1} />
      <Box x={28} y={22} z={0} w={30} d={34} h={18} accent={accent} lift={-0.18} />
      <Box x={13} y={-8} z={0} w={30} d={30} h={win} accent={accent} lift={0.06} />

      {/* Trophy, drawn face-on in its own 2D space rather than extruded: a cup
          is a surface of revolution, and an isometric one reads as a bucket. */}
      <g transform={`translate(${iso(28, 7, win)[0]},${iso(28, 7, win)[1]})`}>
        <ellipse cx="0" cy="-1" rx="15" ry="7" fill={mix(accent, '#0a1020', 0.3)} />
        <rect x="-11" y="-6" width="22" height="5" rx="2" fill={c.top} />
        <rect x="-3.5" y="-17" width="7" height="12" fill={c.top} />
        {/* bowl */}
        <path d="M-15 -40 h30 v7 a15 15 0 0 1 -30 0 Z" fill={c.top} />
        <path d="M-15 -40 h30" stroke={mix(accent, WHITE, 0.8)} strokeWidth="2.4" strokeLinecap="round" />
        {/* handles */}
        <path
          d="M-15 -37 c-9 0 -11 11 -2.5 13"
          fill="none" stroke={c.top} strokeWidth="3" strokeLinecap="round"
        />
        <path
          d="M15 -37 c9 0 11 11 2.5 13"
          fill="none" stroke={c.top} strokeWidth="3" strokeLinecap="round"
        />
        {/* the "1" the winner's cup is actually for */}
        <path
          d="M-2.5 -32 L1 -34 v13"
          fill="none" stroke={mix(accent, '#0a1020', 0.55)} strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </g>

      {/* A live event gets sparks off the winner's step; a finished one does
          not, which is most of what tells the two covers apart at a glance. */}
      {state === 'live' && (
        <g fill={mix(accent, WHITE, 0.4)}>
          <circle cx={iso(13, -8, win + 46)[0]} cy={iso(13, -8, win + 46)[1]} r="3" opacity="0.85" />
          <circle cx={iso(43, 6, win + 34)[0]} cy={iso(43, 6, win + 34)[1]} r="2.2" opacity="0.6" />
          <circle cx={iso(6, 10, win + 26)[0]} cy={iso(6, 10, win + 26)[1]} r="1.8" opacity="0.5" />
          <circle cx={iso(48, -4, win + 12)[0]} cy={iso(48, -4, win + 12)[1]} r="2.6" opacity="0.7" />
        </g>
      )}
    </g>
  );
};

const CompetitionArt: React.FC<Props> = ({ state, className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const accent = STATE_ACCENT[state];

  return (
    <svg
      viewBox="-78 -86 156 144"
      className={className}
      role="img"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id={`blur-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <Podium accent={accent} uid={uid} state={state} />
    </svg>
  );
};

export default CompetitionArt;
