import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Flag, Search, Trophy } from 'lucide-react';
import Avatar from '../ui/Avatar';
import CyberAvatar, { presetFor } from '../ui/CyberAvatar';

export interface UnifiedLeaderboardEntry {
  id: string;
  username: string;
  player: string;
  playerTag?: string;
  points: number | string;
  flagsPwned: number | string;
  /** `avatar:<id>` from the member's profile, when they picked one. */
  profileIcon?: string;
  isCurrentUser?: boolean;
}

interface UnifiedLeaderboardProps {
  title: string;
  subtitle?: string;
  entries: UnifiedLeaderboardEntry[];
  totalFlags: number;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onSelectEntry?: (entry: UnifiedLeaderboardEntry, rank: number) => void;
}

/* Podium tiers. The three finishing places are the only thing on this page
   that colour encodes, so nothing else here is tinted. */
const TIERS: Record<1 | 2 | 3, { label: string; accent: string }> = {
  1: { label: 'Gold', accent: '#f3c84b' },
  2: { label: 'Silver', accent: '#c0cadf' },
  3: { label: 'Bronze', accent: '#d6a55a' },
};

/** Shield/pentagon silhouette the podium cards are cut to. */
const SHIELD = 'polygon(4% 0%,96% 0%,100% 8%,100% 84%,50% 100%,0% 84%,0% 8%)';

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

/* Warm rising sparks for the #1 card only. */
const fireParticles = [
  { left: '16%', bottom: 24, delay: 0.0, duration: 1.2, size: 'w-1.5 h-1.5' },
  { left: '30%', bottom: 18, delay: 0.18, duration: 1.35, size: 'w-2 h-2' },
  { left: '46%', bottom: 22, delay: 0.32, duration: 1.15, size: 'w-1 h-1' },
  { left: '60%', bottom: 20, delay: 0.46, duration: 1.25, size: 'w-2 h-2' },
  { left: '74%', bottom: 26, delay: 0.6, duration: 1.4, size: 'w-1.5 h-1.5' },
  { left: '84%', bottom: 18, delay: 0.74, duration: 1.1, size: 'w-1 h-1' },
];

const PodiumCard: React.FC<{
  rank: number;
  entry: UnifiedLeaderboardEntry;
  highlight?: boolean;
  onSelect?: () => void;
}> = ({ rank, entry, highlight, onSelect }) => {
  const tier = TIERS[rank as 1 | 2 | 3] ?? TIERS[3];
  const height = highlight ? 'h-[18rem] md:h-[20rem]' : 'h-[15.5rem] md:h-[17rem]';
  const points = toNumber(entry.points);
  const preset = presetFor(entry.profileIcon);
  const isMe = !!entry.isCurrentUser;

  return (
    <div className="relative pt-6">
      {rank === 1 && (
        <Crown
          size={26}
          className="absolute left-1/2 -translate-x-1/2 top-0 z-30"
          style={{ color: tier.accent }}
          fill={tier.accent}
        />
      )}

      {rank === 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-8 bottom-0 z-20 overflow-hidden">
          {fireParticles.map((p, i) => (
            <motion.span
              key={i}
              className={`absolute ${p.size} rounded-full bg-gradient-to-t from-[#f59e0b] via-[#fde68a] to-brand-neon`}
              style={{ left: p.left, bottom: p.bottom }}
              animate={{
                opacity: [0, 0.95, 0],
                y: [0, -22, -40],
                x: [0, i % 2 === 0 ? 6 : -6, 0],
                scale: [0.7, 1.15, 0.5],
              }}
              transition={{ duration: p.duration, repeat: Infinity, ease: 'easeOut', delay: p.delay }}
            />
          ))}
        </div>
      )}

      {/* Rank badge */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-3 z-30 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black shadow-sm"
        style={{ backgroundColor: tier.accent, color: '#11161f' }}
      >
        {rank}
      </div>

      {/* Soft glow behind the card in the tier colour */}
      <div
        className="pointer-events-none absolute inset-x-6 top-10 bottom-2 rounded-full blur-2xl opacity-25"
        style={{ backgroundColor: tier.accent }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: highlight ? 0 : 0.1 }}
        onClick={onSelect}
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onKeyDown={(e) => {
          if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onSelect();
          }
        }}
        className={`relative w-full ${height} drop-shadow-[0_10px_28px_rgba(0,0,0,0.4)] ${
          onSelect ? 'cursor-pointer' : ''
        }`}
      >
        <div className="absolute inset-0" style={{ clipPath: SHIELD, backgroundColor: tier.accent, opacity: 0.85 }} />
        {/* "You" ring sits just inside the frame */}
        {isMe && <div className="absolute inset-[1px]" style={{ clipPath: SHIELD, backgroundColor: '#00a859' }} />}

        <div className="absolute inset-[2px] overflow-hidden bg-panel" style={{ clipPath: SHIELD }}>
          <div className="relative z-10 h-full w-full min-w-0 flex flex-col items-center justify-center px-3 sm:px-4 text-center">
            <div
              className="rounded-full bg-inset flex items-center justify-center overflow-hidden"
              style={{
                width: highlight ? 84 : 64,
                height: highlight ? 84 : 64,
                border: `2px solid ${tier.accent}`,
              }}
            >
              {preset ? (
                <CyberAvatar preset={preset} className="w-full h-full" title={entry.player} />
              ) : (
                <span className="text-2xl font-black text-brand-neon">
                  {entry.player.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <p className="mt-3 font-bold text-fg truncate max-w-full" title={entry.player}>
              {entry.player}
            </p>
            {isMe && <span className="mt-0.5 text-[11px] font-bold text-brand">You</span>}

            {entry.playerTag ? (
              <span className="mt-2 inline-flex max-w-full items-center rounded-full border border-edge-light bg-inset px-2.5 py-1 text-[11px] font-semibold text-muted">
                <span className="truncate" title={entry.playerTag}>
                  {entry.playerTag}
                </span>
              </span>
            ) : null}

            <p className="mt-2 text-lg font-black" style={{ color: tier.accent }} dir="ltr">
              {points.toLocaleString('en-US')}
              <span className="ms-1 text-[11px] font-semibold text-muted">pts</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* One grid template for the header and every row, so the columns line up
   without a <table> that can't be made to reflow on a phone. */
const ROW_GRID = 'grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3.5rem_1fr_7rem_auto] gap-3 items-center';

const UnifiedLeaderboard: React.FC<UnifiedLeaderboardProps> = ({
  title,
  subtitle,
  entries,
  totalFlags,
  loading = false,
  error,
  onRetry,
  onSelectEntry,
}) => {
  const [search, setSearch] = useState('');

  const ranked = useMemo(
    () =>
      [...entries]
        .map((e) => ({ ...e, points: toNumber(e.points), flagsPwned: toNumber(e.flagsPwned) }))
        .sort((a, b) => b.points - a.points || b.flagsPwned - a.flagsPwned)
        .map((e, i) => ({ ...e, rank: i + 1 })),
    [entries],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ranked;
    return ranked.filter(
      (item) => item.player.toLowerCase().includes(term) || item.username.toLowerCase().includes(term),
    );
  }, [ranked, search]);

  const podium = search ? [] : ranked.slice(0, 3);
  const rest = search ? filtered : filtered.slice(3);
  const me = ranked.find((e) => e.isCurrentUser) || null;
  const meVisible = !!me && (podium.some((e) => e.id === me.id) || rest.some((e) => e.id === me.id));

  const flagsTarget = totalFlags > 0 ? totalFlags : Math.max(...ranked.map((e) => e.flagsPwned), 1);
  const progressPct = me ? Math.min(100, Math.round((me.flagsPwned / flagsTarget) * 100)) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-2xl border border-edge bg-panel animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-56 rounded-2xl border border-edge bg-panel animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl border border-edge bg-panel animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
        <p>{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-sm underline underline-offset-2 hover:text-white">
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-fg-soft">
      {/* ── Header ── */}
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-inset px-3 py-1 text-xs font-semibold text-muted">
          <Trophy size={12} className="text-brand" />
          Player leaderboard
        </span>
        <h1 className="mt-3 text-3xl md:text-4xl font-black text-fg">{title}</h1>
        {subtitle ? <p className="mt-2 text-muted">{subtitle}</p> : null}
      </div>

      {/* ── Top three ── */}
      {podium.length > 0 && (
        <section className="overflow-visible">
          {/* Mobile shows 1 → 2 → 3; desktop reorders to 2 · 1 · 3 with #1 raised. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3 items-end max-w-3xl mx-auto">
            <div className="order-2 sm:order-1">
              {podium[1] && (
                <PodiumCard
                  rank={2}
                  entry={podium[1]}
                  onSelect={onSelectEntry ? () => onSelectEntry(podium[1], 2) : undefined}
                />
              )}
            </div>
            <div className="order-1 sm:order-2">
              {podium[0] && (
                <PodiumCard
                  rank={1}
                  entry={podium[0]}
                  highlight
                  onSelect={onSelectEntry ? () => onSelectEntry(podium[0], 1) : undefined}
                />
              )}
            </div>
            <div className="order-3 sm:order-3">
              {podium[2] && (
                <PodiumCard
                  rank={3}
                  entry={podium[2]}
                  onSelect={onSelectEntry ? () => onSelectEntry(podium[2], 3) : undefined}
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Your standing ──
          One strip instead of the two stacked cards that used to sit in a
          right-hand column: the same three numbers, on the axis the reader is
          already scanning. */}
      {me && (
        <div className="rounded-2xl border border-brand/25 bg-brand/[0.06] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                profileIcon={me.profileIcon}
                name={me.player}
                className="w-10 h-10 rounded-full"
                initialClassName="text-base"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg truncate">Your standing</p>
                <p className="text-xs text-muted">
                  Rank #{me.rank} of {ranked.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-end">
                <p className="text-xl font-black text-brand-neon leading-none" dir="ltr">
                  {me.points.toLocaleString('en-US')}
                </p>
                <p className="mt-1 text-xs text-muted">points</p>
              </div>
              <div className="text-end">
                <p className="text-xl font-black text-fg leading-none" dir="ltr">
                  {me.flagsPwned}
                  <span className="text-sm font-semibold text-muted">/{flagsTarget}</span>
                </p>
                <p className="mt-1 text-xs text-muted">flags captured</p>
              </div>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-inset">
            <div className="h-full bg-brand transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search player"
          aria-label="Search player"
          className="w-full rounded-lg border border-edge bg-inset py-2.5 ps-9 pe-3 text-sm text-fg placeholder:text-faint focus:border-brand/50 focus:outline-none"
        />
      </div>

      {/* ── The board ── */}
      {rest.length === 0 ? (
        <div className="rounded-2xl border border-edge bg-panel py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-edge bg-inset">
            <Trophy size={22} className="text-faint" />
          </div>
          <h3 className="text-base font-bold text-fg">
            {search ? 'No player matches that search' : 'Nobody on the board yet'}
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
            {search ? 'Try a different name or username.' : 'Capture a flag and you will be the first.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-edge bg-panel">
          <div className={`${ROW_GRID} border-b border-edge px-4 sm:px-5 py-3 text-xs font-semibold text-dim`}>
            <span>Rank</span>
            <span>Player</span>
            <span className="hidden sm:block">Flags</span>
            <span className="text-end">Points</span>
          </div>

          <div className="divide-y divide-edge/60">
            {rest.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.025, 0.4), duration: 0.3 }}
                onClick={() => onSelectEntry?.(entry, entry.rank)}
                role={onSelectEntry ? 'button' : undefined}
                tabIndex={onSelectEntry ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onSelectEntry && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectEntry(entry, entry.rank);
                  }
                }}
                className={`${ROW_GRID} px-4 sm:px-5 py-3 transition-colors ${
                  entry.isCurrentUser ? 'bg-brand/10' : 'hover:bg-surface-hover'
                } ${onSelectEntry ? 'cursor-pointer' : ''}`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-muted">
                  {entry.rank}
                </span>

                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    profileIcon={entry.profileIcon}
                    name={entry.player}
                    className="w-9 h-9 rounded-full"
                    initialClassName="text-sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg">
                      {entry.player}
                      {entry.isCurrentUser && (
                        <span className="ms-2 text-[11px] font-bold text-brand">You</span>
                      )}
                    </p>
                    {/* Flags rejoin the grid from sm up; on a phone they ride
                        under the name so the row stays three columns wide. */}
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-muted sm:hidden">
                      <span className="inline-flex items-center gap-1">
                        <Flag size={10} /> {entry.flagsPwned}/{flagsTarget}
                      </span>
                      {entry.playerTag && <span className="truncate">{entry.playerTag}</span>}
                    </p>
                    {entry.playerTag && (
                      <p className="mt-0.5 hidden truncate text-xs text-muted sm:block">{entry.playerTag}</p>
                    )}
                  </div>
                </div>

                <span className="hidden items-center gap-1.5 text-sm text-fg-soft sm:flex" dir="ltr">
                  <Flag size={12} className="text-faint" />
                  {entry.flagsPwned}
                  <span className="text-xs text-faint">/{flagsTarget}</span>
                </span>

                <span className="text-end text-sm font-black text-fg" dir="ltr">
                  {entry.points.toLocaleString('en-US')}
                  <span className="ms-1 text-xs font-semibold text-muted">pts</span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* The current player, when a search or the podium has pushed them out of
          the visible list entirely. */}
      {me && !meVisible && (
        <div className={`${ROW_GRID} rounded-2xl border border-brand/30 bg-brand/10 px-4 sm:px-5 py-3`}>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-brand">
            {me.rank}
          </span>
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              profileIcon={me.profileIcon}
              name={me.player}
              className="w-9 h-9 rounded-full"
              initialClassName="text-sm"
            />
            <p className="truncate text-sm font-semibold text-fg">{me.player}</p>
          </div>
          <span className="hidden text-sm text-fg-soft sm:block" dir="ltr">
            {me.flagsPwned}/{flagsTarget}
          </span>
          <span className="text-end text-sm font-black text-fg" dir="ltr">
            {me.points.toLocaleString('en-US')}
            <span className="ms-1 text-xs font-semibold text-muted">pts</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default UnifiedLeaderboard;
