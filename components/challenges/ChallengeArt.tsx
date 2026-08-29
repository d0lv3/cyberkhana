import React, { useId } from 'react';
import { Box, SHADE, Shadow, faceLeft, faceTop, iso, mix, shades, WHITE } from '../art/iso';

/* ── Category art ──
 *
 * One drawing per challenge category, replacing the raster mascots and the
 * photographic hero backdrops. Every scene is assembled from the shared
 * isometric kit in ../art/iso — real solids in a real projection, not a flat
 * icon with a drop shadow behind it.
 *
 * Each scene has to survive two sizes: a 44px row tile and a ~280px hero. The
 * silhouette carries the small end; anything that would turn to mush there is
 * wrapped in `{detailed && …}` and only drawn for the hero.
 */

export type ArtKind =
  | 'all'
  | 'web'
  | 'pwn'
  | 'crypto'
  | 'reversing'
  | 'forensics'
  | 'social'
  | 'misc';

/** Challenge.category → the art that represents it. */
export const ART_FOR_CATEGORY: Record<string, ArtKind> = {
  'Web Exploitation': 'web',
  'Binary Exploitation': 'pwn',
  Cryptography: 'crypto',
  'Reverse Engineering': 'reversing',
  Forensics: 'forensics',
  'Social Engineering': 'social',
  Miscellaneous: 'misc',
};

export const ART_ACCENT: Record<ArtKind, string> = {
  all: '#9fef00',
  web: '#60a5fa',
  pwn: '#f43f5e',
  crypto: '#f3a43a',
  reversing: '#a855f7',
  forensics: '#34d399',
  social: '#fbbf24',
  misc: '#9aa5bf',
};

/* ── scenes ───────────────────────────────────────────────────────────── */

interface SceneProps { accent: string; detailed: boolean; uid: string }

/** Every category, stacked — the "all challenges" tile. */
const AllScene: React.FC<SceneProps> = ({ detailed, uid }) => (
  <g>
    <Shadow x={26} y={26} rx={62} ry={30} blur={`blur-${uid}`} />
    <Box x={-4} y={-4} z={0} w={28} d={28} h={30} accent="#60a5fa" />
    <Box x={28} y={-4} z={0} w={28} d={28} h={18} accent="#a855f7" />
    <Box x={-4} y={28} z={0} w={28} d={28} h={22} accent="#f3a43a" />
    <Box x={28} y={28} z={0} w={28} d={28} h={44} accent="#9fef00" lift={0.06} />
    {detailed && (
      /* Flag in world space, not on the top face: drawn on the face it would
         lie flat like a sticker instead of standing up out of the block. */
      <g>
        <line
          x1={iso(42, 42, 44)[0]} y1={iso(42, 42, 44)[1]}
          x2={iso(42, 42, 78)[0]} y2={iso(42, 42, 78)[1]}
          stroke={mix('#9fef00', WHITE, 0.45)} strokeWidth="3" strokeLinecap="round"
        />
        <path
          d={`M${iso(42, 42, 78)[0]} ${iso(42, 42, 78)[1]}
              l22 6 l-22 8 Z`}
          fill="#9fef00"
        />
      </g>
    )}
  </g>
);

/** A browser pane on a plinth, with an injected payload lifting off it. */
const WebScene: React.FC<SceneProps> = ({ accent, detailed, uid }) => {
  const c = shades(accent);
  return (
    <g>
      <Shadow x={30} y={30} rx={60} ry={29} blur={`blur-${uid}`} />
      <Box x={0} y={0} z={0} w={60} d={60} h={7} accent={accent} lift={-0.1} />
      <Box x={2} y={44} z={7} w={56} d={7} h={44} accent={accent} lift={0.04} />
      {/* screen surface + chrome, drawn onto the pane's front face */}
      <g transform={faceLeft(2, 51, 51)}>
        <rect x="1.5" y="1.5" width="53" height="41" rx="3" fill="#0b1220" opacity="0.92" />
        <rect x="1.5" y="1.5" width="53" height="9" rx="3" fill={c.line} opacity="0.28" />
        <rect x="1.5" y="7" width="53" height="3.5" fill={c.line} opacity="0.28" />
        <circle cx="6.5" cy="6" r="1.5" fill="#f43f5e" />
        <circle cx="11.5" cy="6" r="1.5" fill="#f3a43a" />
        <circle cx="16.5" cy="6" r="1.5" fill={accent} />
        {detailed && (
          <>
            <rect x="22" y="3.4" width="30" height="5.2" rx="2.6" fill="#0b1220" opacity="0.75" />
            <rect x="24" y="5.4" width="15" height="1.4" rx="0.7" fill={c.line} opacity="0.6" />
            <g fill={accent}>
              <rect x="6" y="16" width="22" height="2.6" rx="1.3" opacity="0.9" />
              <rect x="6" y="22" width="34" height="2.6" rx="1.3" opacity="0.35" />
              <rect x="6" y="28" width="27" height="2.6" rx="1.3" opacity="0.35" />
              <rect x="6" y="34" width="17" height="2.6" rx="1.3" opacity="0.9" />
            </g>
          </>
        )}
      </g>
      {/* the payload: a slab breaking out of the pane */}
      <Box x={30} y={6} z={30} w={22} d={22} h={5} accent={accent} lift={0.12} />
      {detailed && (
        <g transform={faceTop(30, 6, 35)}>
          <g
            transform="translate(11,11)"
            fill="none"
            stroke="#0b1220"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M-6 -3 L-9.5 0 L-6 3" />
            <path d="M6 -3 L9.5 0 L6 3" />
            <path d="M1.6 -4.4 L-1.6 4.4" />
          </g>
        </g>
      )}
    </g>
  );
};

/** A memory stack with the top allocation running over its own bounds. */
const PwnScene: React.FC<SceneProps> = ({ accent, detailed, uid }) => {
  const c = shades(accent);
  return (
    <g>
      <Shadow x={28} y={28} rx={54} ry={26} blur={`blur-${uid}`} />
      <Box x={0} y={0} z={0} w={56} d={56} h={9} accent={accent} lift={-0.12} />
      <Box x={4} y={4} z={9} w={48} d={48} h={9} accent={accent} lift={-0.06} />
      <Box x={4} y={4} z={18} w={48} d={48} h={9} accent={accent} />
      {/* the overflowing frame: wider than the stack and shoved off-axis */}
      <Box x={-6} y={12} z={27} w={62} d={40} h={11} accent={accent} lift={0.12} />
      {detailed && (
        <>
          <g transform={faceTop(-6, 12, 38)}>
            {/* spilled bytes running off the near edge */}
            <g fill="#0b1220" opacity="0.55">
              <rect x="6" y="8" width="9" height="9" rx="1.5" />
              <rect x="19" y="8" width="9" height="9" rx="1.5" />
              <rect x="32" y="8" width="9" height="9" rx="1.5" />
              <rect x="45" y="8" width="9" height="9" rx="1.5" />
              <rect x="6" y="21" width="9" height="9" rx="1.5" />
              <rect x="19" y="21" width="9" height="9" rx="1.5" />
            </g>
            <g fill={c.line} opacity="0.85">
              <rect x="32" y="21" width="9" height="9" rx="1.5" />
              <rect x="45" y="21" width="9" height="9" rx="1.5" />
            </g>
          </g>
          {/* stray words tumbling past the end of the buffer */}
          <Box x={66} y={14} z={50} w={10} d={10} h={10} accent={accent} lift={0.18} edges={false} />
          <Box x={82} y={20} z={66} w={8} d={8} h={8} accent={accent} lift={0.24} edges={false} />
        </>
      )}
    </g>
  );
};

/** A padlock on a plinth, with cipher tiles orbiting it. */
const CryptoScene: React.FC<SceneProps> = ({ accent, detailed, uid }) => {
  const c = shades(accent);
  const shackle = (() => {
    const [ax, ay] = iso(16, 30, 40);
    const [bx, by] = iso(44, 30, 40);
    const [tx, ty] = iso(30, 30, 70);
    return `M${ax} ${ay} Q${tx} ${ty - 8} ${bx} ${by}`;
  })();
  return (
    <g>
      <Shadow x={30} y={30} rx={52} ry={25} blur={`blur-${uid}`} />
      <Box x={2} y={2} z={0} w={56} d={56} h={7} accent={accent} lift={-0.12} />
      <path d={shackle} fill="none" stroke={c.top} strokeWidth="8" strokeLinecap="round" opacity="0.95" />
      <path d={shackle} fill="none" stroke={mix(accent, WHITE, 0.62)} strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
      <Box x={10} y={12} z={7} w={40} d={36} h={30} accent={accent} lift={0.05} />
      {detailed && (
        <g transform={faceLeft(10, 48, 37)}>
          <circle cx="20" cy="14" r="5.4" fill="#0b1220" opacity="0.85" />
          <path d="M20 17 L17.6 25 L22.4 25 Z" fill="#0b1220" opacity="0.85" />
        </g>
      )}
      {detailed && (
        <>
          <Box x={62} y={-4} z={16} w={13} d={13} h={4} accent={accent} lift={0.16} edges={false} />
          <Box x={-16} y={40} z={28} w={11} d={11} h={4} accent={accent} lift={0.2} edges={false} />
        </>
      )}
    </g>
  );
};

/** A socketed die with pin rows and one layer being lifted off. */
const ReversingScene: React.FC<SceneProps> = ({ accent, detailed, uid }) => {
  const c = shades(accent);
  const pins = detailed ? [6, 16, 26, 36, 46] : [10, 26, 42];
  return (
    <g>
      <Shadow x={28} y={28} rx={54} ry={26} blur={`blur-${uid}`} />
      {/* pin rows on the two near edges */}
      {pins.map((p) => (
        <React.Fragment key={`pl-${p}`}>
          <Box x={p} y={58} z={2} w={5} d={9} h={3} accent={accent} lift={-0.2} edges={false} />
          <Box x={58} y={p} z={2} w={9} d={5} h={3} accent={accent} lift={-0.2} edges={false} />
        </React.Fragment>
      ))}
      <Box x={0} y={0} z={0} w={58} d={58} h={9} accent={accent} lift={-0.08} />
      {/* the die itself, floating clear of the package */}
      <Box x={11} y={11} z={26} w={36} d={36} h={8} accent={accent} lift={0.12} />
      {detailed && (
        <>
          {/* traces on the package, under the lifted die */}
          <g transform={faceTop(0, 0, 9)} stroke={c.line} strokeWidth="1.4" fill="none" opacity="0.5">
            <path d="M8 20 h14 v14 h16" />
            <path d="M8 38 h10 v-12" />
            <path d="M50 16 h-12 v22 h-8" />
            <path d="M50 44 h-16" />
          </g>
          <g transform={faceTop(11, 11, 34)}>
            <rect x="9" y="9" width="18" height="18" rx="2" fill="#0b1220" opacity="0.6" />
            <rect x="13.5" y="13.5" width="9" height="9" rx="1" fill={c.line} opacity="0.9" />
          </g>
          {/* the lift itself */}
          <g stroke={mix(accent, WHITE, 0.6)} strokeWidth="1.6" strokeDasharray="3 4" opacity="0.6">
            <line
              x1={iso(11, 11, 9)[0]} y1={iso(11, 11, 9)[1]}
              x2={iso(11, 11, 26)[0]} y2={iso(11, 11, 26)[1]}
            />
            <line
              x1={iso(47, 47, 9)[0]} y1={iso(47, 47, 9)[1]}
              x2={iso(47, 47, 26)[0]} y2={iso(47, 47, 26)[1]}
            />
          </g>
        </>
      )}
    </g>
  );
};

/** Stacked disk images with a lens hovering over the evidence. */
const ForensicsScene: React.FC<SceneProps> = ({ accent, detailed, uid }) => {
  const c = shades(accent);
  return (
    <g>
      <Shadow x={28} y={28} rx={54} ry={26} blur={`blur-${uid}`} />
      <Box x={0} y={0} z={0} w={56} d={56} h={7} accent={accent} lift={-0.14} />
      <Box x={3} y={3} z={9} w={50} d={50} h={6} accent={accent} lift={-0.06} opacity={0.94} />
      <Box x={6} y={6} z={17} w={44} d={44} h={6} accent={accent} lift={0.02} opacity={0.94} />
      {detailed && (
        <g transform={faceTop(6, 6, 23)} opacity="0.6">
          {/* platter tracks on the top layer */}
          <g fill="none" stroke="#0b1220" strokeWidth="1.4">
            <circle cx="22" cy="22" r="17" />
            <circle cx="22" cy="22" r="11" />
          </g>
          <circle cx="22" cy="22" r="3.4" fill="#0b1220" />
        </g>
      )}
      {/* the lens, tilted into the world on the top plane */}
      <g transform={faceTop(14, 14, 52)}>
        <circle cx="20" cy="20" r="19" fill={accent} opacity="0.16" />
        <circle cx="20" cy="20" r="19" fill="none" stroke={c.top} strokeWidth="5" />
        <circle cx="20" cy="20" r="19" fill="none" stroke={mix(accent, WHITE, 0.7)} strokeWidth="1.4" opacity="0.6" />
        <path d="M33 33 L47 47" stroke={c.top} strokeWidth="7" strokeLinecap="round" />
        {detailed && <path d="M10 14 a13 13 0 0 1 10 -6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />}
      </g>
    </g>
  );
};

/** An opened envelope with a hook coming out of it. */
const SocialScene: React.FC<SceneProps> = ({ accent, detailed, uid }) => {
  const c = shades(accent);
  return (
    <g>
      <Shadow x={28} y={28} rx={52} ry={25} blur={`blur-${uid}`} />
      <Box x={0} y={0} z={0} w={56} d={56} h={12} accent={accent} lift={-0.08} />
      {/* the flap, folded open across the top face */}
      <g transform={faceTop(0, 0, 12)}>
        <path d="M0 0 L28 22 L56 0 Z" fill={mix(accent, SHADE, 0.2)} />
        <path d="M0 0 L28 22 L56 0" fill="none" stroke={c.line} strokeWidth="1.2" opacity="0.55" />
      </g>
      {/* the lure: a letter card riding a hook out of the envelope */}
      <Box x={16} y={16} z={30} w={26} d={26} h={4} accent={accent} lift={0.16} />
      {detailed && (
        <g transform={faceTop(16, 16, 34)}>
          <g fill="#0b1220" opacity="0.55">
            <rect x="6" y="7" width="14" height="2.4" rx="1.2" />
            <rect x="6" y="12" width="10" height="2.4" rx="1.2" />
            <rect x="6" y="17" width="13" height="2.4" rx="1.2" />
          </g>
        </g>
      )}
      <path
        d={`M${iso(29, 29, 46)[0]} ${iso(29, 29, 46)[1]} L${iso(29, 29, 92)[0]} ${iso(29, 29, 92)[1]}`}
        stroke={mix(accent, WHITE, 0.5)}
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* The hook is the whole idea, so it is drawn at a size that still reads
          once the scene is a 44px tile. */}
      <g transform={`translate(${iso(29, 29, 46)[0]},${iso(29, 29, 46)[1]})`}>
        <path
          d="M0 -2 C0 12 -19 12 -19 0 C-19 -11 -7 -13 -5 -4"
          fill="none"
          stroke={c.top}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M0 -2 C0 12 -19 12 -19 0 C-19 -11 -7 -13 -5 -4"
          fill="none"
          stroke={mix(accent, WHITE, 0.75)}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>
    </g>
  );
};

/** Fallback: three plain solids of different heights. */
const MiscScene: React.FC<SceneProps> = ({ accent, uid }) => (
  <g>
    <Shadow x={28} y={28} rx={54} ry={26} blur={`blur-${uid}`} />
    <Box x={0} y={0} z={0} w={26} d={26} h={34} accent={accent} />
    <Box x={30} y={0} z={0} w={26} d={26} h={18} accent={accent} lift={-0.08} />
    <Box x={0} y={30} z={0} w={26} d={26} h={22} accent={accent} lift={-0.04} />
    <Box x={30} y={30} z={0} w={26} d={26} h={44} accent={accent} lift={0.06} />
  </g>
);

const SCENES: Record<ArtKind, React.FC<SceneProps>> = {
  all: AllScene,
  web: WebScene,
  pwn: PwnScene,
  crypto: CryptoScene,
  reversing: ReversingScene,
  forensics: ForensicsScene,
  social: SocialScene,
  misc: MiscScene,
};

/* ── component ────────────────────────────────────────────────────────── */

interface ChallengeArtProps {
  kind: ArtKind;
  className?: string;
  /** Off for the 44px row tile, where fine detail only muddies the shape. */
  detailed?: boolean;
  /** Radial bloom behind the solid. Wanted on the hero, not on a small tile. */
  glow?: boolean;
}

/** Look art up by the raw category string, falling back to the misc solid. */
export const artKindFor = (category?: string): ArtKind =>
  (category && ART_FOR_CATEGORY[category]) || 'misc';

/** The one colour that stands for a category, wherever it is named. */
export const categoryAccent = (category?: string): string => ART_ACCENT[artKindFor(category)];

const ChallengeArt: React.FC<ChallengeArtProps> = ({
  kind,
  className = '',
  detailed = true,
  glow = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const accent = ART_ACCENT[kind];
  const Scene = SCENES[kind];

  return (
    <svg
      viewBox="-74 -54 148 126"
      className={className}
      role="img"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id={`blur-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <radialGradient id={`bloom-${uid}`} cx="50%" cy="45%" r="52%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      {glow && <rect x="-74" y="-54" width="148" height="126" fill={`url(#bloom-${uid})`} />}
      {/* The world origin is the back corner of the ground plane, which is not
          the visual centre of a built scene; this drop lands them in the box. */}
      <g transform="translate(0, -3)">
        <Scene accent={accent} detailed={detailed} uid={uid} />
      </g>
    </svg>
  );
};

export default ChallengeArt;
