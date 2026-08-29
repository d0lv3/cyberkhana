import React from 'react';

/* ── Built-in avatars ──
 * The same thirteen drawings the Academy offers, so a member who picks
 * "Phantom" there recognises themselves here. Each one is drawn on the same
 * 64×64 grid so a row of them lines up: a dark plate, a soft accent bloom,
 * then line art in `currentColor` — the wrapper sets the colour, so the art
 * itself never repeats a hex. Strokes are heavy enough (1.6–2.4) to survive
 * the 28px leaderboard tile, and every glyph is silhouette-first, so it still
 * reads once the detail stops resolving.
 *
 * Stored on the user as `profileIcon = 'avatar:<id>'` (AVATAR_SCHEME), which
 * keeps them distinguishable from the legacy keys ('hacker', 'default', …)
 * that older accounts still carry.
 */

export const AVATAR_SCHEME = 'avatar:';

export interface AvatarPreset {
  id: string;
  label: string;
  accent: string;
  art: React.ReactNode;
}

/** Shared geometry so the set reads as one family rather than thirteen drawings. */
const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const THIN = { ...S, strokeWidth: 1.6 } as const;

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'operator',
    label: 'Operator',
    accent: '#9fef00',
    art: (
      <>
        <path
          d="M32 13c-10.5 0-18 7.5-18 18v5.5l-5 3.5V52h46V40l-5-3.5V31c0-10.5-7.5-18-18-18Z"
          {...S}
        />
        {/* The face is a void, not accent art — a flat dark fill is what lets
            the two eye slits read at 28px. */}
        <path
          d="M20.5 31.5c0-6.6 5.2-11.5 11.5-11.5s11.5 4.9 11.5 11.5v6c0 4.4-5.1 7.5-11.5 7.5s-11.5-3.1-11.5-7.5Z"
          fill="#0b1220"
        />
        <path d="M25 34h4.5M34.5 34H39" {...S} strokeWidth={3.4} />
      </>
    ),
  },
  {
    id: 'sentinel',
    label: 'Sentinel',
    accent: '#60a5fa',
    art: (
      <>
        <path d="M32 9l19 6.5v13.8C51 42 43.4 51.2 32 55.5 20.6 51.2 13 42 13 29.3V15.5Z" {...S} />
        <circle cx="32" cy="28" r="5" {...S} />
        <path d="M32 33v7" {...S} />
      </>
    ),
  },
  {
    id: 'terminal',
    label: 'Shell',
    accent: '#00e5a0',
    art: (
      <>
        <rect x="9" y="14" width="46" height="36" rx="5" {...S} />
        <path d="M9 24h46" {...THIN} />
        <circle cx="15.5" cy="19" r="1.6" fill="currentColor" />
        <circle cx="21" cy="19" r="1.6" fill="currentColor" />
        <circle cx="26.5" cy="19" r="1.6" fill="currentColor" />
        <path d="M17 32l6 5.5-6 5.5" {...S} />
        <path d="M30 43.5h14" {...S} />
      </>
    ),
  },
  {
    id: 'bughunter',
    label: 'Bug Hunter',
    accent: '#f3a43a',
    art: (
      <>
        <path d="M26 15l-4-5M38 15l4-5" {...S} />
        <rect x="21" y="18" width="22" height="32" rx="11" {...S} />
        <path d="M32 20v30" {...THIN} />
        <path d="M21 28l-8-4M21 36h-9M21 44l-8 5M43 28l8-4M43 36h9M43 44l8 5" {...S} />
      </>
    ),
  },
  {
    id: 'biometric',
    label: 'Biometric',
    accent: '#22d3ee',
    art: (
      <>
        <path d="M11 32a21 21 0 0 1 42 0" {...S} />
        <path d="M17.5 36.5a14.5 14.5 0 0 1 29 0c0 5-1 10-2.5 14" {...S} />
        <path d="M24.5 36.5a7.5 7.5 0 0 1 15 0c0 7-1 13-3 18" {...S} />
        <path d="M32 34v16" {...S} />
        <path d="M20 47c1.5-3.5 2.2-7 2.2-10.5" {...S} />
      </>
    ),
  },
  {
    id: 'cipher',
    label: 'Cipher',
    accent: '#fbbf24',
    art: (
      <>
        {/* Bow, shaft, then teeth square to the shaft — a diagonal shaft with
            diagonal teeth reads as a magnifying glass, not a key. */}
        <circle cx="21" cy="32" r="10.5" {...S} />
        <circle cx="21" cy="32" r="3.4" fill="currentColor" />
        <path d="M31.5 32H53" {...S} />
        <path d="M44 32v7.5M51 32v10" {...S} />
      </>
    ),
  },
  {
    id: 'phantom',
    label: 'Phantom',
    accent: '#a78bfa',
    art: (
      <>
        <path
          d="M15 52V29a17 17 0 0 1 34 0v23l-5.7-4.5L37.7 52 32 47.5 26.3 52l-5.6-4.5Z"
          {...S}
        />
        <circle cx="25.5" cy="30" r="2.8" fill="currentColor" />
        <circle cx="38.5" cy="30" r="2.8" fill="currentColor" />
      </>
    ),
  },
  {
    id: 'recon',
    label: 'Recon',
    accent: '#2dd4bf',
    art: (
      <>
        <circle cx="32" cy="32" r="22" {...S} />
        <circle cx="32" cy="32" r="13" {...THIN} />
        <circle cx="32" cy="32" r="4.5" {...THIN} />
        <path d="M32 32L47.6 16.4A22 22 0 0 1 32 54Z" fill="currentColor" opacity="0.18" />
        <path d="M32 32l15.6-15.6" {...S} />
        <circle cx="41" cy="42" r="2.6" fill="currentColor" />
      </>
    ),
  },
  {
    id: 'vault',
    label: 'Vault',
    accent: '#818cf8',
    art: (
      <>
        <path d="M21 27v-5a11 11 0 0 1 22 0v5" {...S} />
        <rect x="13" y="27" width="38" height="26" rx="5" {...S} />
        <circle cx="32" cy="38" r="4" {...S} />
        <path d="M32 42v5" {...S} />
        <path d="M19 33h-4M19 47h-4M45 33h4M45 47h4" {...THIN} />
      </>
    ),
  },
  {
    id: 'firewall',
    label: 'Firewall',
    accent: '#fb7185',
    art: (
      <>
        <path d="M10 34h44M10 43h44M10 52h44" {...THIN} />
        <path d="M23 34v9M41 34v9M32 43v9M14 43v9M50 43v9" {...THIN} />
        <path
          d="M32 8c1.5 7 8 9.5 8 16a8 8 0 0 1-16 0c0-3 1.5-4.8 3-7 .8 2.2 2 3 3.5 3.5-1.5-5 1.5-9 1.5-12.5Z"
          {...S}
        />
      </>
    ),
  },
  {
    id: 'redteam',
    label: 'Red Team',
    accent: '#f43f5e',
    art: (
      <>
        <path d="M16 32a16 16 0 0 1 32 0v8.5c0 2.2-1.8 4-4 4H20c-2.2 0-4-1.8-4-4Z" {...S} />
        <path d="M23 44.5v5.5c0 1.7 1.3 3 3 3h12c1.7 0 3-1.3 3-3v-5.5" {...S} />
        <circle cx="25" cy="32.5" r="4.2" fill="currentColor" />
        <circle cx="39" cy="32.5" r="4.2" fill="currentColor" />
        <path d="M32 36.5v4M28 47.5v5M36 47.5v5" {...THIN} />
      </>
    ),
  },
  {
    id: 'mesh',
    label: 'Mesh',
    accent: '#38bdf8',
    art: (
      <>
        <circle cx="32" cy="32" r="6" {...S} />
        <circle cx="32" cy="11" r="4.5" {...S} />
        <circle cx="32" cy="53" r="4.5" {...S} />
        <circle cx="14" cy="21" r="4.5" {...S} />
        <circle cx="50" cy="21" r="4.5" {...S} />
        <circle cx="14" cy="43" r="4.5" {...S} />
        <circle cx="50" cy="43" r="4.5" {...S} />
        <path d="M32 15.5v10.5M32 38v10.5" {...THIN} />
        <path d="M18 23l8.8 6M46 23l-8.8 6M18 41l8.8-6M46 41l-8.8-6" {...THIN} />
      </>
    ),
  },
  {
    id: 'knight',
    label: 'Knight',
    /* Pearl rather than another saturated hue: the set had twelve of those, and
       a chess piece is the one glyph here whose own colour is ivory. */
    accent: '#cbd5e1',
    art: (
      <>
        {/* Head, neck and base as one closed silhouette — a knight is the most
            intricate outline in the set, and as pure line art it turned to mush
            at 28px. The wash inside is what carries it once the strokes stop
            resolving, the same trick the recon sweep uses. */}
        <path
          d="M36 6 39.6 12.4C43.6 15.4 46.2 20.6 46.6 26.4 47.3 34 45.4 41 42.4 46
             L45.5 46 48 55 16 55 18.5 46 21.6 46C24.4 42.4 25.1 39.6 25 37
             L17 37C13.4 37 12.2 33.6 14.8 31.4L23 27.5C22.6 22.4 24.8 17.6 28.6 14.6
             30.4 13 32.4 12 34.5 11.6Z"
          {...S}
          fill="currentColor"
          fillOpacity={0.22}
        />
        <circle cx="30.5" cy="20.5" r="2" fill="currentColor" />
        <circle cx="18" cy="32.6" r="1.1" fill="currentColor" />
      </>
    ),
  },
];

const PRESET_BY_ID = new Map(AVATAR_PRESETS.map((p) => [p.id, p]));

/**
 * `avatar:sentinel` → the sentinel preset. A bare id is accepted too, because
 * `profileIcon` predates the scheme and older rows hold plain keys. Anything
 * else (a photo URL, the legacy 'default'/'hacker' keys, nothing at all) →
 * undefined, and the caller falls back to the initial.
 */
export function presetFor(profileIcon?: string | null): AvatarPreset | undefined {
  if (!profileIcon) return undefined;
  const id = profileIcon.startsWith(AVATAR_SCHEME)
    ? profileIcon.slice(AVATAR_SCHEME.length)
    : profileIcon;
  return PRESET_BY_ID.get(id);
}

export const avatarValue = (id: string) => `${AVATAR_SCHEME}${id}`;

/** One preset, drawn. Callers own the frame (size, radius, border). */
const CyberAvatar: React.FC<{ preset: AvatarPreset; className?: string; title?: string }> = ({
  preset,
  className = '',
  title,
}) => (
  <svg
    viewBox="0 0 64 64"
    role="img"
    aria-label={title ?? preset.label}
    className={className}
    style={{ color: preset.accent }}
  >
    <rect width="64" height="64" fill="#0b1220" />
    <circle cx="32" cy="30" r="26" fill="currentColor" opacity="0.13" />
    {preset.art}
  </svg>
);

export default CyberAvatar;
