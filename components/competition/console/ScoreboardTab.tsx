import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search, ShieldOff, Trophy } from 'lucide-react';
import { eventService } from '../../../services/eventService';
import { rankBadge } from './OverviewTab';
import { Chip, ConsoleButton, EmptyState, Panel, Segmented, downloadCsv, fileSlug, formatDateTime, inputClass } from './ui';

const PAGE = 25;

const ScoreboardTab: React.FC<{
  competition: any;
  isEvent: boolean;
  teamRows: any[];
  onOpenTeam?: (name: string) => void;
}> = ({ competition: c, isEvent, teamRows, onOpenTeam }) => {
  const [mode, setMode] = useState<'team' | 'individual'>(isEvent ? 'team' : 'individual');
  const [playerRows, setPlayerRows] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Player standings are only fetched when asked for, and again whenever team scores move.
  useEffect(() => {
    if (!isEvent || mode !== 'individual') return;
    let live = true;
    eventService.leaderboard(c._id, 'individual')
      .then(result => { if (live) { setPlayerRows(result.leaderboard || []); setError(''); } })
      .catch(e => { if (live) setError(e.message || 'Could not load player standings'); });
    return () => { live = false; };
  }, [isEvent, mode, c._id, teamRows]);

  const rows = !isEvent || mode === 'team' ? teamRows : playerRows || [];
  const ranked = useMemo(() => rows.map((row, index) => ({ ...row, rank: index + 1 })), [rows]);
  const filtered = ranked.filter(row => `${row.name || row.username} ${row.fullName || ''} ${row.universityCode || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const visible = filtered.slice((page - 1) * PAGE, page * PAGE);
  const total = c.challenges.length;
  const disqualified = (c.teams || []).filter((t: any) => t.disqualified).length;
  const teamMode = isEvent && mode === 'team';

  useEffect(() => { setPage(1); }, [search, mode]);

  const exportCsv = () => {
    const header = teamMode
      ? ['Rank', 'Team', 'Points', 'Solved', 'Players', 'Last solve']
      : ['Rank', 'Player', 'University', 'Points', 'Solved', 'Last solve'];
    const lines = ranked.map(row => teamMode
      ? [row.rank, row.name, row.points, row.solvedChallenges, row.memberCount, row.lastSolveTime || '']
      : [row.rank, row.username, row.universityName || row.universityCode || '', row.points, row.solvedChallenges, row.lastSolveTime || '']);
    downloadCsv(`${fileSlug(c.name)}-${teamMode ? 'teams' : 'players'}.csv`, [header, ...lines]);
  };

  return (
    <Panel
      title={teamMode ? `Team standings · ${rows.length}` : `Player standings · ${rows.length}`}
      icon={<Trophy size={16} />}
      actions={
        <>
          {isEvent && (
            <Segmented label="Standings" value={mode} onChange={setMode} options={[{ value: 'team', label: 'Teams' }, { value: 'individual', label: 'Players' }]} />
          )}
          <ConsoleButton size="sm" icon={<Download size={14} />} onClick={exportCsv} disabled={!ranked.length}>Export CSV</ConsoleButton>
        </>
      }
      bodyClassName=""
    >
      <div className="flex flex-col gap-3 border-b border-edge px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={teamMode ? 'Search teams' : 'Search players'} aria-label="Search standings" className={`${inputClass} pl-9`} />
        </div>
        {teamMode && disqualified > 0 && (
          <Chip tone="bad"><ShieldOff size={12} /> {disqualified} disqualified team{disqualified === 1 ? '' : 's'} hidden from rankings</Chip>
        )}
        {isEvent && mode === 'individual' && (
          <p className="text-xs text-faint">Players are credited with the flags they captured; team-wide adjustments count only for teams.</p>
        )}
      </div>

      {error ? <p role="alert" className="px-4 py-6 text-sm text-danger">{error}</p>
        : !visible.length ? (
          <EmptyState icon={<Trophy size={20} />} title={search ? 'No matches' : 'The board is empty'}>
            {search ? 'Try a different name.' : 'Rankings appear once players start scoring.'}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-xs text-dim">
                  <th scope="col" className="w-16 px-4 py-2.5 font-medium">Rank</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{teamMode ? 'Team' : 'Player'}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{teamMode ? 'Players' : 'University'}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Solved</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Last solve</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {visible.map(row => (
                  <tr
                    key={row._id}
                    onClick={teamMode && onOpenTeam ? () => onOpenTeam(row.name) : undefined}
                    className={`transition-colors ${teamMode && onOpenTeam ? 'cursor-pointer hover:bg-surface-hover' : ''} ${row.rank <= 3 ? 'bg-brand-neon/[0.02]' : ''}`}
                  >
                    <td className="px-4 py-3"><span className="flex h-7 w-7 items-center justify-center rounded-md border border-edge bg-inset">{rankBadge(row.rank)}</span></td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-fg">{row.name || row.username}</span>
                      {!teamMode && row.fullName && row.fullName !== row.username && <span className="ml-2 text-xs text-faint">{row.fullName}</span>}
                    </td>
                    <td className="px-4 py-3 text-muted">{teamMode ? `${row.memberCount} / 4` : row.universityName || row.universityCode || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-fg-soft">{row.solvedChallenges}<span className="text-faint">/{total}</span></span>
                        <span className="hidden h-1 w-16 overflow-hidden rounded-full bg-inset sm:block">
                          <span className="block h-full rounded-full bg-brand" style={{ width: `${total ? (row.solvedChallenges / total) * 100 : 0}%` }} />
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-faint">{formatDateTime(row.lastSolveTime)}</td>
                    <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-fg">{row.points.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-edge px-4 py-3 text-xs text-dim">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <ConsoleButton size="sm" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(p => p - 1)} icon={<ChevronLeft size={14} />} />
            <ConsoleButton size="sm" aria-label="Next page" disabled={page === pages} onClick={() => setPage(p => p + 1)} icon={<ChevronRight size={14} />} />
          </div>
        </div>
      )}
    </Panel>
  );
};

export default ScoreboardTab;
