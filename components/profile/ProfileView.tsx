import React, { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, CalendarDays, ChevronDown, Droplet, Flag, Flame, GraduationCap, Layers, Trophy } from 'lucide-react';
import ChallengeArt, { artKindFor, categoryAccent, categoryLabel } from '../challenges/ChallengeArt';
import CyberAvatar, { presetFor } from '../ui/CyberAvatar';
import { EmptyState, Panel } from '../competition/console/ui';
import ActivityHeatmap from './ActivityHeatmap';
import { AchievementsPanel } from './Achievements';
import { CertificatesPanel, CompetitionsPanel } from './ServiceRecord';
import { evaluateInsignia } from './insignia';
import {
  CompetitionRecord, ProfileData, ProfileSolve, coverage, disciplinesOf, focusOf, formatDate, plural, streaksOf, timeAgo,
} from './profileData';

/* ── The profile ──
 * One layout for your own profile and for anyone else's: an identity card,
 * then four tabs. Your own page passes in the controls that edit it; a public
 * one passes nothing and reads the same.
 *
 * Colour keeps the meanings it has across the product: brand green for what
 * the operator earned, a category hue for a discipline, amber for first
 * blood, podium metals for a placing. Everything else is neutral. */

export const OCTAGON = 'polygon(25% 6%,75% 6%,94% 25%,94% 75%,75% 94%,25% 94%,6% 75%,6% 25%)';

/** The octagon portrait. The rim is its own clipped layer: a CSS border does not follow a clip-path onto the diagonals. */
export const OctagonAvatar: React.FC<{ profileIcon?: string; name: string; className?: string }> = ({
  profileIcon,
  name,
  className = 'h-24 w-24 sm:h-28 sm:w-28',
}) => {
  const preset = presetFor(profileIcon);
  return (
    <span className={`relative block ${className}`}>
      <span className="absolute inset-0 bg-brand/50" style={{ clipPath: OCTAGON }} />
      <span className="absolute inset-[2px] flex items-center justify-center overflow-hidden bg-inset" style={{ clipPath: OCTAGON }}>
        {preset ? (
          <CyberAvatar preset={preset} className="h-full w-full" title={name} />
        ) : (
          <span className="text-4xl font-black text-brand-neon">{name.charAt(0).toUpperCase()}</span>
        )}
      </span>
    </span>
  );
};

/* ── Identity card ── */

const Stat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
}> = ({ icon, label, value, detail }) => (
  <div className="min-w-0 bg-panel px-4 py-4 sm:px-5">
    <dt className="flex items-center gap-1.5 text-xs font-semibold text-dim">
      {icon}
      {label}
    </dt>
    <dd className="mt-1.5 text-xl font-black leading-none text-fg" dir="ltr">{value}</dd>
    {detail && <dd className="mt-1.5 truncate text-[11px] text-faint">{detail}</dd>}
  </div>
);

const Hero: React.FC<{
  data: ProfileData;
  record: CompetitionRecord | null;
  recordFailed: boolean;
  avatar: React.ReactNode;
  name: React.ReactNode;
}> = ({ data, record, recordFailed, avatar, name }) => {
  const streak = useMemo(() => streaksOf(data.solves), [data.solves]);
  const focus = focusOf(data.solves);
  const bloods = data.solves.filter(s => s.firstBlood).length;
  const onRange = data.solves.filter(s => s.published).length;
  const topPercent = data.rank && data.totalUsers ? Math.max(1, Math.round((data.rank / data.totalUsers) * 100)) : null;
  const podiums = record?.competitions.filter(e => e.status === 'ended' && e.rank && e.rank <= 3).length ?? 0;

  return (
    <section aria-label="Profile" className="relative overflow-hidden rounded-2xl border border-edge bg-panel">
      {/* The certificate's drafting grid, and a bloom behind the portrait. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(38 50 72 / 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgb(38 50 72 / 0.45) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          WebkitMaskImage: 'radial-gradient(ellipse at 0% 0%, black, transparent 60%)',
          maskImage: 'radial-gradient(ellipse at 0% 0%, black, transparent 60%)',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -start-20 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 p-5 sm:p-7 md:flex-row md:items-center">
        {/* Stacked on a phone: beside the portrait, a name had under 200px and truncated. */}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="shrink-0">{avatar}</div>
          <div className="w-full min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">Operator</p>
            <div className="mt-1 min-w-0">{name}</div>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="font-mono text-xs text-faint" dir="ltr">@{data.username}</span>
              {data.universityName && (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <GraduationCap size={14} className="shrink-0" />
                  <span className="truncate">{data.universityName}</span>
                </span>
              )}
              {data.joinedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  Joined {data.joinedAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </p>
            {focus && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-edge bg-inset px-3 py-1 text-xs font-semibold text-fg-soft">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryAccent(focus) }} />
                Focus: {categoryLabel(focus)}
              </p>
            )}
          </div>
        </div>

        {/* The one hero figure. */}
        <div className="shrink-0 border-t border-edge pt-5 md:border-s md:border-t-0 md:ps-8 md:pt-0 md:text-end">
          <p className="text-5xl font-black leading-none text-brand-neon" dir="ltr">{data.points.toLocaleString('en-US')}</p>
          <p className="mt-1.5 text-xs font-semibold text-dim">points</p>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted md:justify-end">
            {/* A placing on no points is an accident of sort order, not a standing. */}
            {data.rank && data.points > 0 ? (
              <span>
                Rank <span className="font-bold text-fg">#{data.rank}</span> of {data.totalUsers}
              </span>
            ) : (
              <span>Not ranked yet</span>
            )}
            {data.points > 0 && topPercent !== null && topPercent <= 50 && (
              <span className="rounded-md border border-brand/30 bg-brand/10 px-1.5 py-0.5 text-[11px] font-bold text-brand">
                Top {topPercent}%
              </span>
            )}
          </p>
        </div>
      </div>

      {/* The edge colour shows through the 1px gaps as the dividers, in either arrangement. */}
      <dl className="relative grid grid-cols-2 gap-px border-t border-edge bg-edge sm:grid-cols-4">
        <Stat
          icon={<Flag size={13} />}
          label="Flags captured"
          value={
            <>
              {data.solves.length}
              {data.totalChallenges > 0 && <span className="text-sm font-bold text-faint">/{data.totalChallenges}</span>}
            </>
          }
          detail={data.totalChallenges ? `${Math.round((onRange / data.totalChallenges) * 100)}% of the range` : 'Practice range'}
        />
        <Stat
          icon={<Droplet size={13} className="text-amber" />}
          label="First bloods"
          value={bloods}
          detail={bloods ? 'First to solve' : 'None yet'}
        />
        <Stat
          icon={<Flame size={13} />}
          label="Streak"
          value={
            <>
              {streak.current}
              <span className="ms-1 text-sm font-bold text-faint">{streak.current === 1 ? 'day' : 'days'}</span>
            </>
          }
          detail={streak.best ? `Best ${plural(streak.best, 'day')}` : 'Starts with a capture'}
        />
        <Stat
          icon={<Trophy size={13} />}
          label="Competitions"
          value={record ? record.competitions.length : '–'}
          detail={
            record
              ? podiums ? plural(podiums, 'podium finish', 'podium finishes') : 'No podium yet'
              : recordFailed ? 'Unavailable' : 'Loading'
          }
        />
      </dl>
    </section>
  );
};

/* ── Overview ── */

const Disciplines: React.FC<{ data: ProfileData }> = ({ data }) => {
  const rows = disciplinesOf(data);
  const touched = rows.filter(r => r.solved > 0).length;
  return (
    <Panel
      title="Disciplines"
      icon={<Layers size={15} />}
      actions={rows.length ? <span className="text-xs text-muted">{touched} of {rows.length} started</span> : null}
    >
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No challenges are published on the range yet.</p>
      ) : (
        <ul className="space-y-3.5">
          {rows.map(row => (
            <li key={row.category} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-edge bg-inset">
                <ChallengeArt
                  kind={artKindFor(row.category)}
                  detailed={false}
                  className={`h-9 w-9 ${row.solved ? '' : 'opacity-40 grayscale'}`}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className={`truncate font-semibold ${row.solved ? 'text-fg' : 'text-muted'}`}>{categoryLabel(row.category)}</span>
                  <span className="shrink-0 text-xs text-muted tabular-nums" dir="ltr">
                    <span className="font-bold text-fg-soft">{row.solved}</span>/{row.total}
                    <span className="ms-2 text-faint">{Math.round(coverage(row) * 100)}%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-inset">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${coverage(row) * 100}%`, backgroundColor: categoryAccent(row.category) }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

const CAPTURES_SHOWN = 8;

const CaptureRow: React.FC<{ solve: ProfileSolve; link: boolean }> = ({ solve, link }) => {
  const linked = link && solve.published;
  return (
    <li className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: categoryAccent(solve.category) }} aria-hidden />
      <div className="min-w-0 flex-1">
        {linked ? (
          <Link
            to={`/challenges/${solve.id}`}
            title={solve.title}
            className="block truncate text-sm font-semibold text-fg transition-colors hover:text-brand-neon focus:outline-none focus-visible:underline"
          >
            {solve.title}
          </Link>
        ) : (
          <p className="truncate text-sm font-semibold text-fg" title={solve.title}>
            {solve.title}
          </p>
        )}
        <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-dim">
          <span>{categoryLabel(solve.category)}</span>
          {solve.difficulty && <span>· {solve.difficulty}</span>}
          {solve.firstBlood && (
            <span className="inline-flex items-center gap-1 font-semibold text-amber">
              · <Droplet size={11} /> First blood
            </span>
          )}
        </p>
      </div>
      <div className="shrink-0 text-end">
        <p className="text-sm font-black text-brand-neon" dir="ltr">+{solve.points.toLocaleString('en-US')}</p>
        <p className="mt-0.5 text-[11px] text-faint" title={solve.solvedAt ? solve.solvedAt.toLocaleString() : undefined}>
          {timeAgo(solve.solvedAt)}
        </p>
      </div>
    </li>
  );
};

const RecentCaptures: React.FC<{ solves: ProfileSolve[]; link: boolean; own: boolean }> = ({ solves, link, own }) => {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? solves : solves.slice(0, CAPTURES_SHOWN);
  return (
    <Panel
      title="Recent captures"
      icon={<Flag size={15} />}
      actions={solves.length ? <span className="text-xs text-muted">{solves.length} total</span> : null}
      bodyClassName="p-2"
    >
      {solves.length === 0 ? (
        <EmptyState icon={<Flag size={20} />} title="No captures yet">
          {own ? (
            <>
              Your first flag starts the record.{' '}
              <Link to="/challenges" className="font-semibold text-brand hover:text-brand-neon">
                Open the range
              </Link>
            </>
          ) : null}
        </EmptyState>
      ) : (
        <>
          <ol className="space-y-0.5">
            {shown.map(solve => (
              <CaptureRow key={solve.id} solve={solve} link={link} />
            ))}
          </ol>
          {solves.length > CAPTURES_SHOWN && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              aria-expanded={expanded}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-fg-soft touch:min-h-tap"
            >
              {expanded ? 'Show fewer' : `Show all ${solves.length}`}
              <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </>
      )}
    </Panel>
  );
};

/* ── Tabs ── */

type TabId = 'overview' | 'achievements' | 'competitions' | 'certificates';

interface ProfileViewProps {
  data: ProfileData;
  record: CompetitionRecord | null;
  recordError: string;
  onRetryRecord: () => void;
  /** The signed-in player's own profile. */
  own: boolean;
  /** Link challenge titles; only for someone on the same range as the profile. */
  linkChallenges: boolean;
  /** Your own page swaps in the controls that edit these. */
  avatar?: React.ReactNode;
  name?: React.ReactNode;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  data,
  record,
  recordError,
  onRetryRecord,
  own,
  linkChallenges,
  avatar,
  name,
}) => {
  const [params, setParams] = useSearchParams();
  const insignia = useMemo(() => evaluateInsignia(data), [data]);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const earned = insignia.filter(s => s.tiersEarned > 0).length;
  const tabs: Array<{ id: TabId; label: string; count?: string; spoken?: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'achievements', label: 'Achievements', count: `${earned}/${insignia.length}`, spoken: `${earned} of ${insignia.length} earned` },
    { id: 'competitions', label: 'Competitions', count: record ? String(record.competitions.length) : undefined },
    { id: 'certificates', label: 'Certificates', count: record ? String(record.certificates.length) : undefined },
  ];
  const requested = params.get('tab');
  const tab: TabId = tabs.some(t => t.id === requested) ? (requested as TabId) : 'overview';

  const select = (next: TabId, focus = false) => {
    setParams(current => {
      const updated = new URLSearchParams(current);
      if (next === 'overview') updated.delete('tab');
      else updated.set('tab', next);
      return updated;
    }, { replace: true });
    if (focus) tabRefs.current[next]?.focus();
  };

  // Arrow keys move between tabs, as a tablist is expected to.
  const onTabKey = (event: React.KeyboardEvent) => {
    const index = tabs.findIndex(t => t.id === tab);
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (step) {
      event.preventDefault();
      select(tabs[(index + step + tabs.length) % tabs.length].id, true);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      select(tabs[event.key === 'Home' ? 0 : tabs.length - 1].id, true);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Hero
          data={data}
          record={record}
          recordFailed={!!recordError}
          avatar={avatar ?? <OctagonAvatar profileIcon={data.profileIcon} name={data.name} />}
          name={
            name ?? (
              <h1 className="truncate text-2xl font-black text-fg sm:text-3xl" title={data.name}>
                {data.name}
              </h1>
            )
          }
        />
      </motion.div>

      <div role="tablist" aria-label="Profile sections" onKeyDown={onTabKey} className="scroll-x flex gap-1 border-b border-edge">
        {tabs.map(t => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              ref={el => { tabRefs.current[t.id] = el; }}
              type="button"
              role="tab"
              id={`profile-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`profile-panel-${t.id}`}
              aria-label={t.count !== undefined ? `${t.label}, ${t.spoken ?? t.count}` : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.id)}
              className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-3 text-sm font-semibold transition-colors touch:min-h-tap sm:px-4 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-neon ${
                selected ? 'text-fg' : 'text-muted hover:text-fg-soft'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${selected ? 'bg-brand/15 text-brand' : 'bg-inset text-faint'}`} dir="ltr">
                  {t.count}
                </span>
              )}
              {selected && <motion.span layoutId="profile-tab-rule" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`profile-panel-${tab}`} aria-labelledby={`profile-tab-${tab}`} tabIndex={-1} className="focus:outline-none">
        {tab === 'overview' && (
          <div className="space-y-6">
            <Panel
              title="Activity"
              icon={<Activity size={15} />}
              actions={
                data.solves[0]?.solvedAt ? (
                  <span className="text-xs text-muted">Last capture {formatDate(data.solves[0].solvedAt)}</span>
                ) : null
              }
            >
              <ActivityHeatmap solves={data.solves} />
            </Panel>
            <div className="grid gap-6 lg:grid-cols-2">
              <Disciplines data={data} />
              <RecentCaptures solves={data.solves} link={linkChallenges} own={own} />
            </div>
          </div>
        )}
        {tab === 'achievements' && <AchievementsPanel states={insignia} own={own} />}
        {tab === 'competitions' && <CompetitionsPanel record={record} error={recordError} onRetry={onRetryRecord} own={own} />}
        {tab === 'certificates' && <CertificatesPanel record={record} error={recordError} onRetry={onRetryRecord} own={own} />}
      </div>
    </div>
  );
};

export default ProfileView;
