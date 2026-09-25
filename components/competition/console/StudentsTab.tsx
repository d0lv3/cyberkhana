import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, Search, Users } from 'lucide-react';
import { rankBadge } from './OverviewTab';
import { ConsoleButton, EmptyState, Panel, formatAgo, inputClass } from './ui';

/** Workshop progress: one row per student, expanding to what they solved and when. */
const StudentsTab: React.FC<{
  competition: any;
  rows: any[];
  now: number;
  onProfile: (userId: string) => void;
}> = ({ competition: c, rows, now, onProfile }) => {
  const [search, setSearch] = useState(''), [open, setOpen] = useState<string | null>(null);
  const total = c.challenges.length;
  const title = (id: string) => c.challenges.find((ch: any) => String(ch._id) === String(id));
  const filtered = rows
    .map((row, index) => ({ ...row, rank: index + 1 }))
    .filter(row => `${row.username} ${row.fullName || ''}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <Panel title={`Students · ${rows.length}`} icon={<Users size={16} />} bodyClassName="">
      <div className="border-b border-edge px-4 py-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students" aria-label="Search students" className={`${inputClass} pl-9`} />
        </div>
      </div>
      {filtered.length ? (
        <ul className="divide-y divide-edge">
          {filtered.map(row => {
            const expanded = open === String(row._id);
            const pct = total ? Math.round((row.solvedChallenges / total) * 100) : 0;
            const solves = [...(row.solvedDetails || [])].sort((a, b) => Date.parse(b.solvedAt) - Date.parse(a.solvedAt));
            return (
              <li key={row._id}>
                <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : String(row._id))}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-edge bg-inset">{rankBadge(row.rank)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-fg">{row.username}</span>
                    <span className="block truncate text-xs text-faint">{row.fullName && row.fullName !== row.username ? `${row.fullName} · ` : ''}{row.universityName || row.universityCode}</span>
                  </span>
                  <span className="hidden w-36 sm:block">
                    <span className="mb-1 flex justify-between text-xs"><span className="text-muted">{row.solvedChallenges}/{total}</span><span className="text-brand">{pct}%</span></span>
                    <span className="block h-1 overflow-hidden rounded-full bg-inset"><span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></span>
                  </span>
                  <span className="hidden w-20 text-right text-xs text-faint md:block">{formatAgo(row.lastSolveTime, now)}</span>
                  <span className="w-16 text-right font-bold tabular-nums text-fg">{row.points}</span>
                  <ChevronRight size={16} className={`flex-shrink-0 text-faint transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>
                {expanded && (
                  <div className="border-t border-edge bg-inset/50 px-4 py-3">
                    {solves.length ? (
                      <ul className="space-y-1.5">
                        {solves.map((s: any, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 size={14} className="flex-shrink-0 text-brand" />
                            <span className="min-w-0 flex-1 truncate text-fg-soft">{title(s.challengeId)?.title || 'Challenge'}</span>
                            <span className="text-xs font-semibold text-brand">+{s.points}</span>
                            <span className="w-16 text-right text-xs text-faint">{formatAgo(s.solvedAt, now)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-faint">No solves recorded yet.</p>}
                    <div className="mt-3 flex justify-end">
                      <ConsoleButton size="sm" onClick={() => onProfile(String(row._id))}>View profile</ConsoleButton>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={<Users size={20} />} title={rows.length ? 'No students match' : 'No students on the board yet'}>
          {rows.length ? 'Try another name.' : 'Students appear here after their first solve.'}
        </EmptyState>
      )}
    </Panel>
  );
};

export default StudentsTab;
