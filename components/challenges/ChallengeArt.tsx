import React, { useId } from 'react';
import {
  Box, Cylinder, SHADE, Shadow, faceLeft, faceTop, facesViewer, iso, mix, rimPoint, shades, WHITE,
} from '../art/iso';

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

/** A cipher-rotor stack: three lettered wheels, one of them turned. */
const CryptoScene: React.FC<SceneProps> = ({ accent, detailed, uid }) => {
  const c = shades(accent);
  const R = 21;
  /* Each wheel is a ring of ticks. Only the front half of the rim is drawn —
     the back half is behind the solid — and one tick per wheel is lit. The lit
     ones do not line up, which is the whole idea: the wheels have been turned
     against each other, and that offset is what a substitution cipher is. */
  const wheels = [
    { z: 6, h: 15, offset: 0.0, litIndex: 3 },
    { z: 21, h: 15, offset: 0.42, litIndex: 5 },
    { z: 36, h: 15, offset: 0.9, litIndex: 2 },
  ];
  const TICKS = 12;

  return (
    <g>
      <Shadow x={30} y={30} rx={50} ry={24} blur={`blur-${uid}`} />
      <Box x={2} y={2} z={0} w={56} d={56} h={6} accent={accent} lift={-0.16} />

      {wheels.map((w, i) => (
        <g key={i}>
          <Cylinder cx={30} cy={30} z={w.z} r={R} h={w.h} accent={accent} lift={0.02 - i * 0.03} />
          {/* rim ticks, front half only */}
          <g>
            {Array.from({ length: TICKS }).map((_, k) => {
              const t = w.offset + (k / TICKS) * Math.PI * 2;
              if (!facesViewer(t)) return null;
              const [px, py] = rimPoint(30, 30, w.z + w.h * 0.5, R, t);
              const lit = k === w.litIndex;
              return (
                <rect
                  key={k}
                  x={px - 1.3}
                  y={py - (lit ? 5 : 3.5)}
                  width="2.6"
                  height={lit ? 10 : 7}
                  rx="1.3"
                  fill={lit ? '#ffffff' : '#0b1220'}
                  opacity={lit ? 0.95 : 0.5}
                />
              );
            })}
          </g>
        </g>
      ))}

      {/* Axle + groove. Without them the top wheel is a plain amber disc and the
          whole stack reads as coins; the concentric ring is what says the
          wheels turn about a shaft. */}
      <ellipse
        cx={iso(30, 30, 51)[0]}
        cy={iso(30, 30, 51)[1]}
        rx={R * 0.52 * 1.2247}
        ry={R * 0.52 * 0.7071}
        fill="none"
        stroke={mix(accent, SHADE, 0.45)}
        strokeWidth="1.6"
        opacity="0.8"
      />
      <Cylinder cx={30} cy={30} z={51} r={5} h={7} accent={accent} lift={0.16} />

      {detailed && (
        <>
          {/* The key, drawn face-on beside the stack: a key is a silhouette,
              and extruding one turns it into an unreadable stub. */}
          <g transform={`translate(${iso(66, 4, 20)[0]},${iso(66, 4, 20)[1]})`}>
            <circle cx="0" cy="0" r="9" fill="none" stroke={c.top} strokeWidth="4.5" />
            <circle cx="0" cy="0" r="3" fill={mix(accent, SHADE, 0.55)} />
            <path d="M0 9 L0 34" stroke={c.top} strokeWidth="4.5" strokeLinecap="round" />
            <path d="M0 24 L8 24 M0 31 L6 31" stroke={c.top} strokeWidth="3.4" strokeLinecap="round" />
          </g>
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

/* One fingerprint, drawn at whatever size the caller needs. Reused at two
   scales so the lens can genuinely magnify what is under it. */
const ridges = (k: number) => [
  `M${-15 * k} ${5 * k} a${15 * k} ${17 * k} 0 0 1 ${30 * k} 0`,
  `M${-11 * k} ${8 * k} a${11 * k} ${13 * k} 0 0 1 ${22 * k} 0`,
  `M${-7 * k} ${10 * k} a${7 * k} ${9 * k} 0 0 1 ${14 * k} 0`,
  `M${-3 * k} ${12 * k} a${3 * k} ${5 * k} 0 0 1 ${6 * k} 0`,
  `M${-15 * k} ${13 * k} a${15 * k} ${15 * k} 0 0 0 ${9 * k} ${8 * k}`,
  `M${15 * k} ${13 * k} a${15 * k} ${15 * k} 0 0 1 ${-9 * k} ${8 * k}`,
];

/** A print lifted off an evidence slab, and the lens that is reading it. */
const ForensicsScene: React.FC<SceneProps> = ({ accent, detailed, uid }) => {
  const c = shades(accent);
  const lens = { r: 25, cx: 32, cy: 26 };
  return (
    <g>
      <Shadow x={30} y={30} rx={54} ry={26} blur={`blur-${uid}`} />
      <Box x={0} y={0} z={0} w={60} d={60} h={7} accent={accent} lift={-0.16} />
      <Box x={4} y={4} z={7} w={52} d={52} h={5} accent={accent} lift={-0.02} />

      {/* The print itself, lying on the slab. */}
      <g transform={faceTop(4, 4, 12)}>
        <g
          transform="translate(26,26)"
          fill="none"
          stroke="#0b1220"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.72"
        >
          {ridges(1).map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {detailed && (
          <g stroke={c.line} strokeWidth="0.8" opacity="0.35" fill="none">
            <path d="M6 6 h10 M6 6 v10 M46 46 h-10 M46 46 v-10" />
          </g>
        )}
      </g>

      {/* The lens, floating clear of the slab. What shows through it is the
          same print at 1.9x — the magnification is the point, and drawing the
          glass empty made it read as a bangle. */}
      <g transform={faceTop(lens.cx - 20, lens.cy - 20, 46)}>
        <defs>
          <clipPath id={`lens-${uid}`}>
            <circle cx="20" cy="20" r={lens.r - 4} />
          </clipPath>
        </defs>

        <circle cx="20" cy="20" r={lens.r - 4} fill="#0b1220" opacity="0.92" />
        <g clipPath={`url(#lens-${uid})`}>
          <g
            transform="translate(20,17) scale(1.9)"
            fill="none"
            stroke={accent}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.95"
          >
            {ridges(1).map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          {detailed && (
            /* a diagonal glare, so the disc reads as glass rather than a hole */
            <path d="M-6 8 L24 -22 L34 -12 L4 18 Z" fill="#ffffff" opacity="0.07" />
          )}
        </g>

        {/* barrel */}
        <circle cx="20" cy="20" r={lens.r - 4} fill="none" stroke={c.top} strokeWidth="5" />
        <circle cx="20" cy="20" r={lens.r - 1.2} fill="none" stroke={mix(accent, WHITE, 0.7)} strokeWidth="1.2" opacity="0.55" />
      </g>

      {/* Grip, in screen space rather than on the top plane: a 45deg line drawn
          into the plane projects to a near-vertical stub that reads as a stem
          holding the lens up, not as something you hold. */}
      {(() => {
        const [lx, ly] = iso(lens.cx, lens.cy, 46);
        const k = (lens.r - 4) * 0.72;
        return (
          <g strokeLinecap="round">
            <path d={`M${lx + k} ${ly + k} L${lx + k * 2.4} ${ly + k * 2.4}`} stroke={c.top} strokeWidth="8" />
            <path
              d={`M${lx + k * 1.35} ${ly + k * 1.35} L${lx + k * 2.2} ${ly + k * 2.2}`}
              stroke={mix(accent, SHADE, 0.4)}
              strokeWidth="3.2"
            />
          </g>
        );
      })()}
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
