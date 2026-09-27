import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BadgeCheck, Droplet, Flag, Medal, RotateCw, ScrollText, Trophy, Users } from 'lucide-react';
import CompetitionArt from '../competition/CompetitionArt';
import { EmptyState, Segmented, StatusPill, TypeBadge, lifecycleOf, type LifecycleState } from '../competition/console/ui';
import { TIERS } from '../leaderboard/UnifiedLeaderboard';
import type { CertificateData } from '../certificates/CertificateTemplate';
import { CompetitionRecord, RecordEntry, formatDate, ordinal, plural } from './profileData';

/* ── Service record ──
 * Every workshop and event a player took part in, with where they finished,
 * and the certificates those events issued. Placings use the podium colours
 * the leaderboard uses, the one thing colour means on this tab. */

const shortDate = (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** "Mar 3, 2026", "Mar 3–4, 2026", "Mar 30 – Apr 2, 2026". */
const dateSpan = (start: string | null, end: string | null) => {
  if (!start) return end ? formatDate(end) : 'Date to be set';
  if (!end) return `Since ${formatDate(start)}`;
  const a = new Date(start), b = new Date(end);
  if (a.toDateString() === b.toDateString()) return formatDate(a);
  if (a.getFullYear() !== b.getFullYear()) return `${formatDate(a)} – ${formatDate(b)}`;
  if (a.getMonth() === b.getMonth()) return `${shortDate(start)}–${b.getDate()}, ${b.getFullYear()}`;
  return `${shortDate(start)} – ${formatDate(b)}`;
};

const linkClass =
  'inline-flex items-center gap-1.5 rounded-lg border border-edge bg-inset px-2.5 py-1.5 text-xs font-semibold text-fg-soft transition-colors hover:border-edge-light hover:text-fg touch:min-h-tap focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-neon';

const Placing: React.FC<{ entry: RecordEntry; state: LifecycleState }> = ({ entry, state }) => {
  const unit = entry.kind === 'event' ? 'team' : 'player';
  if (entry.rank && entry.field) {
    const podium = entry.rank <= 3 ? TIERS[entry.rank as 1 | 2 | 3] : null;
    return (
      <div className="text-center">
        {podium && <Medal size={16} className="mx-auto mb-1" style={{ color: podium.accent }} aria-hidden />}
        <p className="text-2xl font-black leading-none text-fg" style={podium ? { color: podium.accent } : undefined} dir="ltr">
          {ordinal(entry.rank)}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          of {plural(entry.field, unit)}
          {state !== 'ended' && ' so far'}
        </p>
      </div>
    );
  }
  if (state === 'live') return <p className="text-center text-xs font-semibold text-brand-neon">In progress</p>;
  if (state === 'upcoming') return <p className="text-center text-xs font-semibold text-amber">Registered</p>;
  return <p className="text-center text-xs text-faint">No placing</p>;
};

const EntryCard: React.FC<{ entry: RecordEntry; own: boolean }> = ({ entry, own }) => {
  const state = lifecycleOf(entry);
  const event = entry.kind === 'event';

  return (
    <li className="rounded-xl border border-edge bg-panel p-4 transition-colors hover:border-edge-light">
      <div className="flex gap-4">
        <div className="hidden h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-edge bg-inset sm:flex">
          <CompetitionArt state={state} className="h-14 w-14" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={entry.kind} />
            <StatusPill state={state} />
          </div>
          <h3 className="mt-2 truncate text-base font-bold text-fg" title={entry.name}>
            {entry.name}
          </h3>
          {/* Wraps between host and dates rather than cutting the year off on a phone. */}
          <p className="mt-0.5 flex flex-wrap gap-x-1.5 text-xs text-muted">
            <span className="min-w-0 truncate">{entry.host.name}</span>
            <span className="shrink-0">· {dateSpan(entry.startTime, entry.endTime)}</span>
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-soft">
            {entry.team && (
              <li className="inline-flex min-w-0 items-center gap-1.5">
                <Users size={12} className="shrink-0 text-faint" />
                <span className="truncate">{entry.team}</span>
              </li>
            )}
            {entry.solved != null && (
              <li className="inline-flex items-center gap-1.5">
                <Flag size={12} className="text-faint" />
                <span dir="ltr">
                  {entry.solved}
                  {entry.totalChallenges ? <span className="text-faint">/{entry.totalChallenges}</span> : null}
                </span>
                <span>{entry.totalChallenges || entry.solved !== 1 ? 'flags' : 'flag'}</span>
                {event && entry.ownSolves ? <span className="text-faint">· {entry.ownSolves} by you</span> : null}
              </li>
            )}
            {entry.points != null && (
              <li dir="ltr">
                <span className="font-semibold text-fg">{entry.points.toLocaleString('en-US')}</span>{' '}
                <span className="text-faint">pts</span>
              </li>
            )}
            {!!entry.firstBloods && (
              <li className="inline-flex items-center gap-1.5">
                <Droplet size={12} className="text-amber" />
                {plural(entry.firstBloods, 'first blood')}
              </li>
            )}
          </ul>
        </div>

        <div className="flex w-20 shrink-0 flex-col items-center justify-center border-s border-edge ps-4 sm:w-24">
          <Placing entry={entry} state={state} />
        </div>
      </div>

      {(!event || own || entry.resultsPublished || entry.certificateCode) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-edge pt-3">
          {!event && (
            <Link to={`/competition/${entry.id}/leaderboard`} className={linkClass}>
              <Trophy size={12} /> Leaderboard
            </Link>
          )}
          {event && own && (
            <Link to={`/competition/${entry.id}`} className={linkClass}>
              <Flag size={12} /> Open event
            </Link>
          )}
          {entry.resultsPublished && (
            <a href={`#/results/${entry.id}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
              Results <ArrowUpRight size={12} />
            </a>
          )}
          {entry.certificateCode && (
            <a
              href={`#/certificates/${entry.certificateCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkClass} border-brand/30 text-brand hover:border-brand/60 hover:text-brand-neon`}
            >
              <BadgeCheck size={12} /> Certificate <ArrowUpRight size={12} />
            </a>
          )}
        </div>
      )}
    </li>
  );
};

const RecordError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="rounded-xl border border-danger/30 bg-danger/[0.06] p-5 text-sm text-fg-soft">
    <p>The competition record could not be loaded.</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-semibold text-fg-soft hover:border-edge-light hover:text-fg touch:min-h-tap"
    >
      <RotateCw size={12} /> Try again
    </button>
  </div>
);

const RecordSkeleton = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading">
    {[0, 1, 2].map(i => (
      <div key={i} className="h-32 animate-pulse rounded-xl border border-edge bg-panel" />
    ))}
  </div>
);

type Filter = 'all' | 'event' | 'workshop';

export const CompetitionsPanel: React.FC<{
  record: CompetitionRecord | null;
  error: string;
  onRetry: () => void;
  own: boolean;
}> = ({ record, error, onRetry, own }) => {
  const [filter, setFilter] = useState<Filter>('all');
  // Annotated: outside strict mode a bare `[]` widens to any[] and takes the whole chain with it.
  const entries: RecordEntry[] = record?.competitions ?? [];
  const shown = filter === 'all' ? entries : entries.filter(e => e.kind === filter);

  const summary = useMemo(() => {
    const final = entries.filter(e => e.rank && lifecycleOf(e) === 'ended');
    const best = final.reduce<number | null>((min, e) => (min === null || e.rank! < min ? e.rank! : min), null);
    return {
      podiums: final.filter(e => e.rank! <= 3).length,
      best,
      events: entries.filter(e => e.kind === 'event').length,
    };
  }, [entries]);

  if (error) return <RecordError onRetry={onRetry} />;
  if (!record) return <RecordSkeleton />;

  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-edge bg-panel">
        <EmptyState icon={<Trophy size={20} />} title={own ? 'No competitions yet' : 'No competitions to show'}>
          {own ? (
            <>
              A workshop appears here once you capture a flag in it, and an event once you register.{' '}
              <Link to="/competition" className="font-semibold text-brand hover:text-brand-neon">
                Browse competitions
              </Link>
            </>
          ) : (
            'Nothing they have played is open to your university.'
          )}
        </EmptyState>
      </div>
    );
  }

  const tiles = [
    { label: 'Played', value: String(entries.length), detail: `${plural(summary.events, 'event')}, ${plural(entries.length - summary.events, 'workshop')}` },
    { label: 'Podium finishes', value: String(summary.podiums), detail: 'Top three, final standings' },
    { label: 'Best placing', value: summary.best ? ordinal(summary.best) : '–', detail: summary.best ? 'Final standings' : 'No final placing yet' },
    { label: 'Certificates', value: String(record.certificates.length), detail: 'Issued by event hosts' },
  ];

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(tile => (
          <div key={tile.label} className="min-w-0 rounded-xl border border-edge bg-panel p-4">
            <dt className="text-xs font-semibold text-dim">{tile.label}</dt>
            <dd className="mt-1 text-2xl font-black text-fg" dir="ltr">{tile.value}</dd>
            <dd className="mt-0.5 truncate text-[11px] text-faint">{tile.detail}</dd>
          </div>
        ))}
      </dl>

      <Segmented<Filter>
        label="Show"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All', count: entries.length },
          { value: 'event', label: 'Events', count: summary.events },
          { value: 'workshop', label: 'Workshops', count: entries.length - summary.events },
        ]}
      />

      {shown.length ? (
        <ul className="space-y-3">
          {shown.map(entry => (
            <EntryCard key={entry.id} entry={entry} own={own} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-edge bg-panel px-4 py-8 text-center text-sm text-muted">
          {filter === 'event' ? 'No events yet.' : 'No workshops yet.'}
        </p>
      )}
    </div>
  );
};

/* The certificate's own tier colours (certificate.css), so a card previews the sheet it opens. */
const CERTIFICATE_TIER: Record<number, string> = { 1: '#9fef00', 2: '#cbd5e1', 3: '#d6a55a' };

const CertificateCard: React.FC<{ certificate: CertificateData }> = ({ certificate: c }) => {
  const foil = (c.rank && CERTIFICATE_TIER[c.rank]) || '#00a859';
  return (
    <li>
      <a
        href={`#/certificates/${c.code}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Certificate for ${c.eventName}, opens the verification page`}
        className="group relative flex aspect-[297/210] flex-col overflow-hidden rounded-xl border border-edge bg-canvas p-5 transition-colors hover:border-edge-light focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-neon"
      >
        {/* The certificate's drafting grid, fading out from the corner. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(38 50 72 / 0.55) 1px, transparent 1px), linear-gradient(to bottom, rgb(38 50 72 / 0.55) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            WebkitMaskImage: 'radial-gradient(ellipse at 100% 0%, black, transparent 70%)',
            maskImage: 'radial-gradient(ellipse at 100% 0%, black, transparent 70%)',
          }}
        />
        <span aria-hidden className="absolute inset-y-0 start-0 w-1" style={{ backgroundColor: foil }} />

        <div className="relative flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
            Certificate of achievement
          </span>
          <BadgeCheck size={16} className="shrink-0 text-brand" />
        </div>
        <p className="relative mt-3 line-clamp-2 text-lg font-bold leading-snug text-fg">{c.eventName}</p>
        <p className="relative mt-1 truncate text-xs text-muted">Hosted by {c.hostUniversityName}</p>

        <div className="relative mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            {c.rank ? (
              <>
                <p className="text-3xl font-black leading-none" style={{ color: foil }} dir="ltr">
                  {ordinal(c.rank)}
                </p>
                <p className="mt-1 truncate text-xs text-muted">
                  of {plural(c.totalTeams, 'team')}
                  {c.teamName ? ` · ${c.teamName}` : ''}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-fg-soft">Verified participant</p>
            )}
          </div>
          <div className="shrink-0 text-end">
            <p className="text-[11px] text-faint">Issued {formatDate(c.issuedAt)}</p>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand transition-colors group-hover:text-brand-neon">
              View <ArrowUpRight size={12} />
            </span>
          </div>
        </div>
      </a>
    </li>
  );
};

export const CertificatesPanel: React.FC<{
  record: CompetitionRecord | null;
  error: string;
  onRetry: () => void;
  own: boolean;
}> = ({ record, error, onRetry, own }) => {
  if (error) return <RecordError onRetry={onRetry} />;
  if (!record) return <RecordSkeleton />;
  if (!record.certificates.length) {
    return (
      <div className="rounded-2xl border border-edge bg-panel">
        <EmptyState icon={<ScrollText size={20} />} title={own ? 'No certificates yet' : 'No certificates to show'}>
          {own
            ? 'Event hosts issue certificates once an event ends. Yours will collect here, each with a link anyone can verify.'
            : 'None of their certificates are from events open to your university.'}
        </EmptyState>
      </div>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {record.certificates.map(certificate => (
        <CertificateCard key={certificate.code} certificate={certificate} />
      ))}
    </ul>
  );
};
