import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, Circle, Crown, Droplet, Layers, LineChart, Medal, Trophy } from 'lucide-react';
import { categoryAccent } from '../../challenges/ChallengeArt';
import ScoreTimeline, { TimelineSeries } from './ScoreTimeline';
import { Chip, EmptyState, Panel, formatAgo, formatDateTime } from './ui';
import type { ConsoleTab } from './tabs';

export const rankBadge = (rank: number) => {
  if (rank === 1) return <Crown size={15} className="text-brand-neon" aria-label="First place" />;
  if (rank === 2) return <Medal size={15} className="text-[#cbd5e1]" aria-label="Second place" />;
  if (rank === 3) return <Medal size={15} className="text-[#d6a55a]" aria-label="Third place" />;
  return <span className="text-xs font-bold tabular-nums text-dim">{rank}</span>;
};

interface ReadinessItem { ok: boolean; warn?: boolean; label: string; detail: string; tab?: ConsoleTab }

/** What a host has to get right before the doors open, in the order they usually do it. */
const readiness = (c: any): ReadinessItem[] => {
  const invitations = c.invitations || [];
  const pendingUniversities = invitations.filter((i: any) => i.status === 'pending').length;
  const teams = (c.teams || []).filter((t: any) => t.members.length).length;
  const overdue = c.autoStart && c.startTime && Date.parse(c.startTime) <= Date.now();
  return [
    { ok: c.challenges.length > 0, label: 'Challenges', tab: 'challenges',
      detail: c.challenges.length ? `${c.challenges.length} on the board` : 'Add at least one challenge before starting' },
    { ok: pendingUniversities === 0, warn: pendingUniversities > 0, label: 'Universities', tab: 'participants',
      detail: `${invitations.filter((i: any) => i.status === 'accepted').length} accepted${pendingUniversities ? ` · ${pendingUniversities} awaiting a reply` : ''}` },
    { ok: c.registrationCount > 0, warn: c.registrationCount === 0, label: 'Registrations', tab: 'participants',
      detail: `${c.registrationCount} / ${c.capacity} players · ${teams} team${teams === 1 ? '' : 's'}` },
    { ok: true, warn: !!overdue, label: 'Start', tab: 'settings',
      detail: !(c.autoStart && c.startTime) ? 'Manual — press Start event when ready'
        : overdue ? 'Start time passed — opens as soon as a challenge is added'
        : `Opens automatically ${formatDateTime(c.startTime)}` },
  ];
};

const OverviewTab: React.FC<{
  competition: any;
  isEvent: boolean;
  rows: any[];
  timeline: TimelineSeries[];
  activities: any[];
  now: number;
  onOpenTab: (tab: ConsoleTab) => void;
}> = ({ competition: c, isEvent, rows, timeline, activities, now, onOpenTab }) => {
  const categories = Array.from(
    c.challenges.reduce((map: Map<string, { total: number; solved: number; solves: number }>, ch: any) => {
      const stat = map.get(ch.category) || { total: 0, solved: 0, solves: 0 };
      stat.total += 1;
      stat.solves += ch.solves || 0;
      if ((ch.solves || 0) > 0) stat.solved += 1;
      return map.set(ch.category, stat);
    }, new Map()).entries(),
  ) as Array<[string, { total: number; solved: number; solves: number }]>;
  const firstBloods = c.challenges
    .map((ch: any) => ({ ch, blood: (ch.solvers || []).find((s: any) => s.isFirstBlood) }))
    .filter((entry: any) => entry.blood)
    .sort((a: any, b: any) => Date.parse(b.blood.solvedAt) - Date.parse(a.blood.solvedAt));
  const teamName = (teamId?: string) => c.teams?.find((t: any) => t.id === teamId)?.name;
  const ended = c.status === 'ended';

  return (
    <div className="space-y-6">
      {isEvent && c.status === 'pending' && (
        <Panel title="Launch checklist" icon={<CheckCircle2 size={16} />} bodyClassName="grid gap-px bg-edge sm:grid-cols-2 xl:grid-cols-4">
          {readiness(c).map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.tab && onOpenTab(item.tab)}
              className="flex items-start gap-3 bg-panel p-4 text-left transition-colors hover:bg-surface-hover"
            >
              {item.warn ? <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber" />
                : item.ok ? <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-brand" />
                : <Circle size={18} className="mt-0.5 flex-shrink-0 text-danger" />}
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg">{item.label}</span>
                <span className="block text-xs text-muted">{item.detail}</span>
              </span>
            </button>
          ))}
        </Panel>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {isEvent && (
            <Panel title="Score progression" icon={<LineChart size={16} />} actions={<span className="text-xs text-faint">Top {Math.min(timeline.length, 8)} teams</span>}>
              {timeline.some(s => s.points.length) ? (
                <ScoreTimeline series={timeline} start={c.startTime} end={ended ? c.endTime : undefined} />
              ) : (
                <EmptyState icon={<LineChart size={20} />} title="No scores yet">
                  The graph draws itself as teams capture flags.
                </EmptyState>
              )}
            </Panel>
          )}

          <Panel title="Live activity" icon={<Activity size={16} />} bodyClassName="max-h-[420px] overflow-y-auto custom-scrollbar">
            {activities.length ? (
              <ol className="divide-y divide-edge">
                {activities.map((a, index) => {
                  const blood = a.type === 'first_blood';
                  const team = isEvent ? a.teamName || teamName(a.teamId) : null;
                  return (
                    <li key={`${a.challengeId || a.challengeTitle}-${a.userId || a.username}-${a.timestamp}-${index}`} className="flex items-center gap-3 px-4 py-3">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${blood ? 'bg-amber/10 text-amber' : 'bg-brand/10 text-brand'}`}>
                        {blood ? <Droplet size={15} /> : <CheckCircle2 size={15} />}
                      </span>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="break-words text-fg-soft">
                          <span className="font-semibold text-fg">{a.username}</span>
                          {team && <span className="text-muted"> · {team}</span>}
                          <span className="text-dim"> {blood ? 'drew first blood on' : 'solved'} </span>
                          <span className="font-semibold text-fg">{a.challengeTitle}</span>
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-faint">
                          {a.category && (
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: categoryAccent(a.category) }} />
                              {a.category}
                            </span>
                          )}
                          <span>{formatAgo(a.timestamp || a.solvedAt, now)}</span>
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-sm font-bold tabular-nums text-brand">+{a.points}</span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState icon={<Activity size={20} />} title="No solves yet">
                {c.status === 'pending' ? 'Solves appear here the moment the competition starts.' : 'Every captured flag shows up here in real time.'}
              </EmptyState>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <Panel
            title={isEvent ? 'Top teams' : 'Top players'}
            icon={<Trophy size={16} />}
            actions={<button type="button" onClick={() => onOpenTab('scoreboard')} className="text-xs font-semibold text-brand hover:underline">Full scoreboard</button>}
            bodyClassName="p-2"
          >
            {rows.length ? rows.slice(0, 5).map((row, index) => (
              <div key={row._id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-edge bg-inset">{rankBadge(index + 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-fg">{row.name || row.username}</span>
                  <span className="block text-xs text-faint">{row.solvedChallenges} solved{isEvent && row.memberCount ? ` · ${row.memberCount} players` : ''}</span>
                </span>
                <span className="text-sm font-bold tabular-nums text-fg">{row.points.toLocaleString()}</span>
              </div>
            )) : <p className="px-2 py-6 text-center text-sm text-faint">No one on the board yet</p>}
          </Panel>

          <Panel title="Categories" icon={<Layers size={16} />} bodyClassName="space-y-4 p-4">
            {categories.length ? categories.map(([name, stat]) => (
              <div key={name}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-2 font-semibold text-fg-soft">
                    <span className="h-2 w-2 flex-shrink-0 rounded-sm" style={{ backgroundColor: categoryAccent(name) }} />
                    <span className="truncate">{name}</span>
                  </span>
                  <span className="flex-shrink-0 tabular-nums text-faint">{stat.solved}/{stat.total} cracked · {stat.solves} solves</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-inset">
                  <div className="h-full rounded-full" style={{ width: `${(stat.solved / stat.total) * 100}%`, backgroundColor: categoryAccent(name) }} />
                </div>
              </div>
            )) : <p className="py-4 text-center text-sm text-faint">No challenges yet</p>}
          </Panel>

          <Panel title="First bloods" icon={<Droplet size={16} />} bodyClassName="p-2">
            {firstBloods.length ? firstBloods.slice(0, 8).map(({ ch, blood }: any) => (
              <div key={ch._id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                <span className="h-8 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: categoryAccent(ch.category) }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-fg">{ch.title}</span>
                  <span className="block truncate text-xs text-faint">
                    {isEvent ? teamName(blood.teamId) || blood.username : blood.username} · {formatAgo(blood.solvedAt, now)}
                  </span>
                </span>
              </div>
            )) : (
              <p className="px-2 py-6 text-center text-sm text-faint">
                {c.challenges.length ? 'Every challenge is still unclaimed' : 'No challenges yet'}
              </p>
            )}
            {firstBloods.length > 0 && firstBloods.length < c.challenges.length && (
              <div className="px-2 pb-1 pt-2"><Chip tone="warn">{c.challenges.length - firstBloods.length} still unsolved</Chip></div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
