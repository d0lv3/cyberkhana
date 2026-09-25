import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Crown, Droplet, Flag, LineChart, Medal, Target, Trophy, Users } from 'lucide-react';
import { eventService } from '../../services/eventService';
import PublicShell from '../../components/public/PublicShell';
import ScoreTimeline from '../../components/competition/console/ScoreTimeline';
import { EmptyState, Eyebrow, Panel, StatTile, formatDateTime } from '../../components/competition/console/ui';
import { categoryAccent } from '../../components/challenges/ChallengeArt';

const PODIUM = [
  { place: 1, label: '1st', icon: <Crown size={18} />, color: '#9fef00' },
  { place: 2, label: '2nd', icon: <Medal size={18} />, color: '#cbd5e1' },
  { place: 3, label: '3rd', icon: <Medal size={18} />, color: '#d6a55a' },
];

const dateRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) return null;
  const day = (value: string) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  if (start && end && day(start) === day(end)) return day(start);
  return [start && day(start), end && day(end)].filter(Boolean).join(' – ');
};

/** Final standings of a finished event, published by its host for anyone to see. */
const EventResultsPage: React.FC = () => {
  const { id = '' } = useParams();
  const [results, setResults] = useState<any>(null), [error, setError] = useState('');

  useEffect(() => {
    const title = document.title;
    eventService.publicResults(id)
      .then(data => { setResults(data); document.title = `${data.name} · Results · CyberKhana`; })
      .catch(e => setError(e.message || 'These results are not published'));
    return () => { document.title = title; };
  }, [id]);

  if (error) {
    return (
      <PublicShell width="max-w-3xl">
        <EmptyState icon={<Trophy size={20} />} title="Results not available">
          These results have not been published, or the link is wrong. Results appear here once the organizers publish them.
        </EmptyState>
      </PublicShell>
    );
  }
  if (!results) {
    return (
      <PublicShell>
        <div className="space-y-4" aria-busy="true" aria-label="Loading results">
          <div className="h-10 w-2/3 animate-pulse rounded-lg bg-panel" />
          <div className="h-40 animate-pulse rounded-xl border border-edge bg-panel" />
        </div>
      </PublicShell>
    );
  }

  const podium = PODIUM.map(p => ({ ...p, row: results.standings[p.place - 1] })).filter(p => p.row);
  const dates = dateRange(results.startTime, results.endTime);

  return (
    <PublicShell>
      <div className="space-y-8">
        <header>
          <Eyebrow className="mb-2">Final results</Eyebrow>
          <h1 className="break-words text-3xl font-black tracking-tight text-fg sm:text-4xl">{results.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span>Hosted by <span className="font-semibold text-fg-soft">{results.host.name}</span></span>
            {dates && <span className="inline-flex items-center gap-1.5"><Calendar size={14} /> {dates}</span>}
          </p>
          {results.universities.length > 1 && (
            <p className="mt-1 text-sm text-faint">With {results.universities.filter((u: any) => u.code !== results.host.code).map((u: any) => u.name).join(', ')}</p>
          )}
        </header>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatTile label="Teams" value={results.stats.teams} icon={<Users size={15} />} accent="#60a5fa" />
          <StatTile label="Challenges" value={results.stats.challenges} icon={<Target size={15} />} accent="#a855f7" />
          <StatTile label="Flags captured" value={results.stats.solves} icon={<Flag size={15} />} accent="#00a859" />
        </div>

        {podium.length > 0 && (
          <section aria-label="Podium" className={`grid gap-4 ${podium.length === 3 ? 'sm:grid-cols-3' : podium.length === 2 ? 'sm:grid-cols-2' : 'max-w-sm'}`}>
            {podium.map(({ place, label, icon, color, row }) => (
              // A full podium puts first place in the middle, raised; a shorter one just reads left to right.
              <div key={place} className={`rounded-xl border bg-panel p-5 ${podium.length < 3 ? '' : place === 1 ? 'sm:order-2 sm:-mt-3' : place === 2 ? 'sm:order-1' : 'sm:order-3'}`}
                style={{ borderColor: `${color}55` }}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-bold" style={{ color }}>{icon} {label}</span>
                  <span className="text-lg font-black tabular-nums text-fg">{row.points.toLocaleString()}</span>
                </div>
                <p className="break-words text-xl font-bold text-fg">{row.name}</p>
                <p className="mt-1 text-xs text-muted">{row.universities.map((u: any) => u.name).join(' · ') || '—'}</p>
                <p className="mt-2 text-xs text-faint">{row.solved} of {results.stats.challenges} challenges solved</p>
              </div>
            ))}
          </section>
        )}

        {results.timeline?.some((series: any) => series.points.length) && (
          <Panel title={`Score progression · top ${Math.min(results.timeline.length, 8)}`} icon={<LineChart size={16} />}>
            <ScoreTimeline series={results.timeline} start={results.startTime} end={results.endTime} />
          </Panel>
        )}

        <Panel title={`Final standings · ${results.standings.length} teams`} icon={<Trophy size={16} />} bodyClassName="">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-xs text-dim">
                  <th scope="col" className="w-16 px-4 py-2.5 font-medium">Rank</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Team</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Universities</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Solved</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {results.standings.map((row: any) => (
                  <tr key={row.rank}>
                    <td className="px-4 py-3 font-bold tabular-nums text-dim">#{row.rank}</td>
                    <td className="px-4 py-3 font-semibold text-fg">{row.name}</td>
                    <td className="px-4 py-3 text-muted">{row.universities.map((u: any) => u.code).join(', ') || '—'}</td>
                    <td className="px-4 py-3 tabular-nums text-fg-soft">{row.solved}<span className="text-faint">/{results.stats.challenges}</span></td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-fg">{row.points.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Challenges" icon={<Target size={16} />} bodyClassName="">
          <ul className="divide-y divide-edge">
            {results.challenges.map((ch: any, index: number) => (
              <li key={index} className="flex items-center gap-3 px-4 py-3">
                <span className="h-9 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: categoryAccent(ch.category) }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-fg">{ch.title}</span>
                  <span className="block text-xs text-muted">
                    {ch.category}{ch.difficulty ? ` · ${ch.difficulty}` : ''}
                    {ch.firstBlood && <span className="ml-2 inline-flex items-center gap-1 text-amber"><Droplet size={11} /> {ch.firstBlood}</span>}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-bold tabular-nums text-fg">{ch.points.toLocaleString()} <span className="text-xs font-normal text-faint">pts</span></span>
                  <span className="block text-xs tabular-nums text-faint">{ch.solves} solve{ch.solves === 1 ? '' : 's'}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        {results.description && (
          <Panel title="About the event">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg-soft">{results.description}</p>
          </Panel>
        )}

        <footer className="border-t border-edge pt-6 text-xs text-faint">
          Results published by {results.host.name} on CyberKhana, {formatDateTime(results.publishedAt)}.
        </footer>
      </div>
    </PublicShell>
  );
};

export default EventResultsPage;
