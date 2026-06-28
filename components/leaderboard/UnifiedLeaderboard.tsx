import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Search, Shield } from 'lucide-react';

export interface UnifiedLeaderboardEntry {
  id: string;
  username: string;
  player: string;
  playerTag?: string;
  points: number | string;
  flagsPwned: number | string;
  avatarUrl?: string;
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

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-4 h-4 text-[#9fef00]" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-[#c0cadf]" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-[#d6a55a]" />;
  return <span className="text-sm font-semibold text-[#9aa5bf]">{rank}</span>;
};

/* Podium framing by finishing position (gold / silver / bronze) — no tiers. */
const podiumAccent: Record<number, { frame: string; border: string }> = {
  1: { frame: 'bg-[#f3c84b]/75', border: 'border-[#f3c84b]/55' },
  2: { frame: 'bg-[#94a3b8]/75', border: 'border-[#64748b]/50' },
  3: { frame: 'bg-[#d6a55a]/70', border: 'border-[#d6a55a]/45' },
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const podiumFireParticles = [
  { left: '16%', bottom: 24, delay: 0.0, duration: 1.2, size: 'w-1.5 h-1.5', color: 'from-[#f59e0b] via-[#fde68a] to-[#9fef00]' },
  { left: '28%', bottom: 18, delay: 0.15, duration: 1.35, size: 'w-2 h-2', color: 'from-[#9fef00] via-[#fde68a] to-[#f59e0b]' },
  { left: '40%', bottom: 22, delay: 0.3, duration: 1.15, size: 'w-1 h-1', color: 'from-[#f59e0b] via-[#facc15] to-[#9fef00]' },
  { left: '56%', bottom: 20, delay: 0.45, duration: 1.25, size: 'w-2 h-2', color: 'from-[#facc15] via-[#9fef00] to-[#f59e0b]' },
  { left: '70%', bottom: 26, delay: 0.6, duration: 1.4, size: 'w-1.5 h-1.5', color: 'from-[#fbbf24] via-[#f59e0b] to-[#9fef00]' },
  { left: '82%', bottom: 18, delay: 0.75, duration: 1.1, size: 'w-1 h-1', color: 'from-[#9fef00] via-[#fde68a] to-[#f59e0b]' },
];

const podiumInnerParticles = [
  { left: '18%', top: '62%', delay: 0.1, duration: 1.2, size: 'w-1 h-1', color: 'from-[#f59e0b] to-[#9fef00]' },
  { left: '33%', top: '58%', delay: 0.25, duration: 1.35, size: 'w-1.5 h-1.5', color: 'from-[#9fef00] to-[#f59e0b]' },
  { left: '48%', top: '66%', delay: 0.4, duration: 1.15, size: 'w-1 h-1', color: 'from-[#facc15] to-[#9fef00]' },
  { left: '62%', top: '60%', delay: 0.55, duration: 1.3, size: 'w-1.5 h-1.5', color: 'from-[#9fef00] to-[#facc15]' },
  { left: '77%', top: '64%', delay: 0.7, duration: 1.2, size: 'w-1 h-1', color: 'from-[#fbbf24] to-[#9fef00]' },
];

const PodiumCard: React.FC<{
  rank: number;
  entry: UnifiedLeaderboardEntry;
  highlight?: boolean;
  onSelect?: () => void;
}> = ({ rank, entry, highlight, onSelect }) => {
  const accent = podiumAccent[rank] ?? podiumAccent[3];
  const baseHeight = highlight ? 'h-[17.5rem] md:h-[19rem]' : 'h-[15rem] md:h-[16.5rem]';
  const points = toNumber(entry.points);
  const shapePath = 'polygon(4% 0%,96% 0%,100% 8%,100% 84%,50% 100%,0% 84%,0% 8%)';

  return (
    <div className="relative pt-4">
      {rank === 1 && (
        <div className="pointer-events-none absolute inset-x-0 top-6 z-20">
          {podiumFireParticles.map((particle, index) => (
            <motion.span
              key={`fire-${index}`}
              className={`absolute ${particle.size} rounded-full bg-gradient-to-t ${particle.color}`}
              style={{ left: particle.left, bottom: particle.bottom }}
              animate={{
                opacity: [0, 0.95, 0],
                y: [0, -20, -38],
                x: [0, index % 2 === 0 ? 6 : -6, 0],
                scale: [0.7, 1.15, 0.5],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: 'easeOut',
                delay: particle.delay,
              }}
            />
          ))}
        </div>
      )}

      <div className="absolute left-1/2 -translate-x-1/2 top-0 z-30 px-3 py-1 rounded bg-[#f3a43a] text-[#1a2332] text-xs font-black shadow-sm">
        {rank}
      </div>

      <div
        className={`relative w-full ${baseHeight} ${onSelect ? 'cursor-pointer' : ''} drop-shadow-[0_10px_28px_rgba(0,0,0,0.38)]`}
        onClick={onSelect}
      >
        <div className={`absolute inset-0 ${accent.frame}`} style={{ clipPath: shapePath }} />

        <div className="absolute inset-[1.5px] overflow-hidden bg-[#1a2332]" style={{ clipPath: shapePath }}>
          {rank === 1 && (
            <div className="pointer-events-none absolute inset-0 z-10">
              {podiumInnerParticles.map((particle, index) => (
                <motion.span
                  key={`inner-fire-${index}`}
                  className={`absolute ${particle.size} rounded-full bg-gradient-to-t ${particle.color}`}
                  style={{ left: particle.left, top: particle.top }}
                  animate={{
                    opacity: [0, 0.85, 0],
                    y: [8, -8, -20],
                    scale: [0.6, 1.1, 0.5],
                  }}
                  transition={{
                    duration: particle.duration,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: particle.delay,
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative z-20 h-full flex flex-col items-center justify-center px-4 text-center">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border ${accent.border} bg-[#121a2a] flex items-center justify-center overflow-hidden`}>
              {entry.avatarUrl ? (
                <img src={entry.avatarUrl} alt={entry.player} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-[#9fef00]">{entry.player.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <p className="mt-3 font-bold text-[#e6edf8] truncate max-w-[180px]" title={entry.player}>
              {entry.player}
            </p>
            {entry.playerTag ? (
              <span className="mt-2 inline-flex max-w-full items-center rounded-full border border-[#3a4864] bg-[#121a2a] px-2.5 py-1 text-[11px] font-semibold text-[#9aa5bf]">
                <span className="truncate" title={entry.playerTag}>{entry.playerTag}</span>
              </span>
            ) : null}
            <p className="text-sm text-[#9aa5bf] mt-1">{points} pts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) => toNumber(b.points) - toNumber(a.points) || toNumber(b.flagsPwned) - toNumber(a.flagsPwned)
      ),
    [entries]
  );

  const normalizedEntries = useMemo(
    () =>
      sortedEntries.map((entry) => ({
        ...entry,
        points: toNumber(entry.points),
        flagsPwned: toNumber(entry.flagsPwned),
      })),
    [sortedEntries]
  );

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    return normalizedEntries.filter(
      (item) =>
        !term || item.player.toLowerCase().includes(term) || item.username.toLowerCase().includes(term)
    );
  }, [normalizedEntries, search]);

  const podium = normalizedEntries.slice(0, 3);
  const currentPlayer = normalizedEntries.find((entry) => entry.isCurrentUser) || null;

  const currentPlayerRank = currentPlayer
    ? normalizedEntries.findIndex((entry) => entry.id === currentPlayer.id) + 1
    : 0;

  const flagsTarget = totalFlags > 0 ? totalFlags : Math.max(...normalizedEntries.map((entry) => toNumber(entry.flagsPwned)), 1);
  const progressPct = currentPlayer ? Math.min(100, Math.round((currentPlayer.flagsPwned / flagsTarget) * 100)) : 0;

  if (loading) {
    return <div className="text-[#9aa5bf] text-sm">Loading leaderboard...</div>;
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
    <div className="relative text-[#d2d7e3]">
        <div className="mb-8">
          <div className="inline-flex items-center rounded border border-[#2a3346] bg-[#1a2332] px-4 py-1 text-xs text-[#9aa5bf] mb-4">
            Player Leaderboard
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#f3f6ff]">{title}</h1>
          {subtitle ? <p className="text-[#9aa5bf] mt-2">{subtitle}</p> : null}
        </div>

        {podium.length > 0 && (
          <section className="mb-8 pt-2 overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:order-1">{podium[1] ? <PodiumCard rank={2} entry={podium[1]} onSelect={onSelectEntry ? () => onSelectEntry(podium[1], 2) : undefined} /> : <div />}</div>
              <div className="md:order-2">{podium[0] ? <PodiumCard rank={1} entry={podium[0]} highlight onSelect={onSelectEntry ? () => onSelectEntry(podium[0], 1) : undefined} /> : <div />}</div>
              <div className="md:order-3">{podium[2] ? <PodiumCard rank={3} entry={podium[2]} onSelect={onSelectEntry ? () => onSelectEntry(podium[2], 3) : undefined} /> : <div />}</div>
            </div>
          </section>
        )}

        <section className="grid lg:grid-cols-[minmax(0,1fr)_260px] gap-5">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[#7d8aa5] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search player"
                  className="w-full bg-[#141c2b] border border-[#2a3346] rounded px-9 py-2 text-sm text-[#e2e8f6] placeholder:text-[#6e7a94] focus:outline-none focus:border-[#3a4864]"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#263248] bg-[#131b2a] overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="border-b border-[#263248] bg-[#111a29]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs tracking-wider text-[#8390ac]">RANK</th>
                    <th className="text-left px-4 py-3 text-xs tracking-wider text-[#8390ac]">PLAYER</th>
                    <th className="text-left px-4 py-3 text-xs tracking-wider text-[#8390ac]">POINTS</th>
                    <th className="text-left px-4 py-3 text-xs tracking-wider text-[#8390ac]">FLAGS PWNED</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => {
                    const rank = index + 1;
                    const isCurrent = !!entry.isCurrentUser;

                    return (
                      <tr
                        key={entry.id}
                        onClick={() => onSelectEntry?.(entry, rank)}
                        className={`border-b border-[#1f2a40] ${isCurrent ? 'bg-[#1c2a1a]' : 'hover:bg-[#182235]'} transition-colors ${onSelectEntry ? 'cursor-pointer' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">{rankIcon(rank)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#0e1522] border border-[#33405c] flex items-center justify-center text-[#9fef00] text-sm font-bold">
                              {entry.player.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="truncate max-w-[180px] font-semibold text-[#e5ecfb]" title={entry.player}>
                                {entry.player}
                              </span>
                              {entry.playerTag ? (
                                <span className="inline-flex max-w-[180px] items-center rounded-full border border-[#3a4864] bg-[#121a2a] px-2 py-0.5 text-[11px] font-semibold text-[#9aa5bf]">
                                  <span className="truncate" title={entry.playerTag}>{entry.playerTag}</span>
                                </span>
                              ) : null}
                              {isCurrent ? <span className="text-[11px] text-[#9fef00]">YOU</span> : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#dce5f9] font-semibold">{entry.points}</td>
                        <td className="px-4 py-3 text-[#dce5f9]">{entry.flagsPwned}/{flagsTarget}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-[#263248] bg-[#1a2332] p-4">
              <p className="text-xs tracking-wider text-[#8390ac]">OVERALL PROGRESS</p>
              <p className="text-3xl font-black text-[#f3f6ff] mt-2">{currentPlayer ? `${currentPlayer.flagsPwned}/${flagsTarget}` : '0/0'}</p>
              <p className="text-xs text-[#7d8aa5] mt-1">FLAGS PWNED</p>
              <div className="h-2 rounded bg-[#0f1624] border border-[#2a3346] mt-3 overflow-hidden">
                <div className="h-full bg-[#9fef00]" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="rounded-xl border border-[#263248] bg-[#1a2332] p-4 text-center">
              <p className="text-xs tracking-wider text-[#8390ac] mb-3">YOUR RANK</p>

              <div className="mx-auto w-28 h-28 border border-[#354562] bg-[#121a2a] flex items-center justify-center"
                style={{ clipPath: 'polygon(25% 6%,75% 6%,94% 25%,94% 75%,75% 94%,25% 94%,6% 75%,6% 25%)' }}>
                <Shield className="w-9 h-9 text-[#9fef00]" />
              </div>

              <p className="mt-3 text-2xl font-black text-[#f3f6ff]">
                {currentPlayerRank ? `#${currentPlayerRank}` : 'UNRANKED'}
              </p>
              <p className="text-xs text-[#7d8aa5] mt-1">{currentPlayer ? `${currentPlayer.points} pts` : ''}</p>
            </div>
          </aside>
        </section>
    </div>
  );
};

export default UnifiedLeaderboard;
