import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Copy, Flag, GraduationCap, KeyRound, Mail, Plus, Search, Target, Ticket, Trash2, Trophy, Users } from 'lucide-react';
import { competitionService } from '../../services/competitionService';
import { universityService } from '../../services/universityService';
import { useSocket } from '../../src/contexts/SocketContext';
import { useConfirmation } from '../../src/contexts/ConfirmationContext';
import { useToast } from '../../src/hooks/useToast';
import { useNow } from '../../src/hooks/useCompetitionClock';
import EventInvitations from '../../components/competition/EventInvitations';
import CreateCompetitionModal from '../../components/competition/CreateCompetitionModal';
import { Chip, ConsoleButton, EmptyState, LifecycleState, Segmented, StatusPill, TypeBadge, formatDateTime, formatSpan, inputClass, lifecycleOf } from '../../components/competition/console/ui';

type StateFilter = 'all' | LifecycleState;
type TypeFilter = 'all' | 'event' | 'workshop';

const ORDER: Record<LifecycleState, number> = { live: 0, upcoming: 1, ended: 2 };

/** One line on where a competition stands in time. */
const scheduleLine = (c: any, state: LifecycleState, now: number) => {
  if (state === 'ended') return c.endTime || c.updatedAt ? `Ended ${formatDateTime(c.endTime || c.updatedAt)}` : 'Ended';
  if (state === 'live') return c.hasTimeLimit !== false && c.endTime ? `Ends in ${formatSpan(Date.parse(c.endTime) - now)}` : 'Running · no time limit';
  if (c.autoStart && c.startTime) return Date.parse(c.startTime) > now ? `Opens in ${formatSpan(Date.parse(c.startTime) - now)}` : 'Opens once it has a challenge';
  return 'Not started · you start it from the console';
};

const CompetitionRow: React.FC<{ c: any; now: number; universityName: (code: string) => string; onDelete: (c: any) => void }> = ({ c, now, universityName, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const state = lifecycleOf(c, now);
  const isEvent = c.type === 'event';
  const href = `/admin/competitions/${c._id}/monitor`;
  const challengeCount = isEvent ? c.challengeCount ?? 0 : c.challenges?.length ?? 0;
  const codes: string[] = c.universityCodes?.length ? c.universityCodes : [c.universityCode];

  return (
    <article className="group relative flex flex-col gap-4 rounded-xl border border-edge bg-panel p-4 transition-colors hover:border-edge-light sm:flex-row sm:items-center sm:p-5">
      <span className={`hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border sm:flex ${
        isEvent ? 'border-violet/30 bg-violet/10 text-violet' : 'border-info/30 bg-info/10 text-info'
      }`}>
        {isEvent ? <Flag size={19} /> : <GraduationCap size={19} />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <TypeBadge type={c.type} />
          <StatusPill state={state} />
          {isEvent && c.pendingInvitations > 0 && <Chip tone="warn"><Mail size={11} /> {c.pendingInvitations} invitation{c.pendingInvitations === 1 ? '' : 's'} pending</Chip>}
          {isEvent && state === 'upcoming' && challengeCount === 0 && <Chip tone="bad"><Target size={11} /> No challenges</Chip>}
        </div>
        {/* The whole card opens the console; the link stretches over it. */}
        <h2 className="truncate text-lg font-bold text-fg">
          <Link to={href} className="after:absolute after:inset-0 after:rounded-xl focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand/50 group-hover:text-brand-neon">
            {c.name}
          </Link>
        </h2>
        <p className="mt-0.5 text-sm text-muted">{scheduleLine(c, state, now)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-faint">
          {isEvent ? (
            <>
              <span className="inline-flex items-center gap-1.5"><Ticket size={13} /> {c.registrationCount}/{c.capacity} players</span>
              <span className="inline-flex items-center gap-1.5"><Users size={13} /> {c.teamCount ?? 0} team{c.teamCount === 1 ? '' : 's'}</span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5"><Users size={13} /> {codes.map(universityName).join(' + ')}</span>
          )}
          <span className="inline-flex items-center gap-1.5"><Target size={13} /> {challengeCount} challenge{challengeCount === 1 ? '' : 's'}</span>
          {isEvent && codes.length > 1 && <span>{codes.length} universities</span>}
          {isEvent && state !== 'ended' && (
            <span className={c.registrationOpen ? 'text-brand' : ''}>Registration {c.registrationOpen ? `open until ${formatDateTime(c.registrationDeadline)}` : 'closed'}</span>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-shrink-0 items-center gap-2">
        {!isEvent && c.requiresSecurityCode !== false && c.securityCode && (
          <button
            type="button"
            onClick={async () => { try { await navigator.clipboard.writeText(c.securityCode); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* still visible to copy by hand */ } }}
            title="Copy security code"
            className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-inset px-2.5 py-1.5 font-mono text-xs tracking-wider text-fg-soft transition-colors hover:border-edge-light touch:min-h-tap"
          >
            {copied ? <Copy size={12} className="text-brand" /> : <KeyRound size={12} className="text-muted" />}
            {copied ? 'Copied' : c.securityCode}
          </button>
        )}
        {!isEvent && (
          <ConsoleButton tone="ghost" size="sm" aria-label={`Delete ${c.name}`} icon={<Trash2 size={15} />} onClick={() => onDelete(c)} />
        )}
        <span className="hidden items-center gap-1 text-sm font-semibold text-muted transition-colors group-hover:text-brand-neon sm:inline-flex">
          Console <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
};

const AdminCompetitionsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } }, []);
  const { confirm } = useConfirmation();
  const { toast, ToastContainer } = useToast();
  const { socket } = useSocket();
  const now = useNow(30_000);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [universities, setUniversities] = useState<Array<{ _id?: string; code: string; name: string }>>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState(''), [stateFilter, setStateFilter] = useState<StateFilter>('all'), [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const load = useCallback(async () => {
    try {
      const data = await competitionService.getCompetitions();
      // Events show up here for their host only; invited universities see them on the Competitions page.
      setCompetitions(data.filter((c: any) => c.type !== 'event' || c.canManage));
      setError('');
    } catch (e: any) {
      setError(e.message || 'Could not load competitions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { universityService.getUniversities().then(setUniversities).catch(() => setUniversities([])); }, []);
  useEffect(() => {
    const refresh = () => { void load(); };
    const events = ['eventRegistrationChanged', 'eventInvitationResponded', 'competitionUpdate'];
    for (const name of events) socket?.on(name, refresh);
    return () => { for (const name of events) socket?.off(name, refresh); };
  }, [socket, load]);

  const universityName = (code: string) => universities.find(u => u.code === code)?.name || code;
  const withState = competitions.map(c => ({ c, state: lifecycleOf(c, now) }));
  const counts = { all: withState.length, live: 0, upcoming: 0, ended: 0 } as Record<StateFilter, number>;
  for (const { state } of withState) counts[state] += 1;
  const visible = withState
    .filter(({ c, state }) => (stateFilter === 'all' || state === stateFilter)
      && (typeFilter === 'all' || (typeFilter === 'event') === (c.type === 'event'))
      && c.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => ORDER[a.state] - ORDER[b.state]
      || (a.state === 'ended'
        ? Date.parse(b.c.endTime || b.c.updatedAt || 0) - Date.parse(a.c.endTime || a.c.updatedAt || 0)
        : Date.parse(b.c.createdAt || b.c.startTime || 0) - Date.parse(a.c.createdAt || a.c.startTime || 0)));

  const remove = async (c: any) => {
    if (!await confirm(`Delete "${c.name}"? Every player's progress in it is lost. This cannot be undone.`, {
      type: 'danger', title: 'Delete workshop', confirmText: 'Delete', isDestructive: true,
    })) return;
    try {
      await competitionService.deleteCompetition(c._id);
      toast('success', 'Workshop deleted');
      await load();
    } catch (e: any) {
      toast('error', e.message || 'Could not delete the workshop');
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-fg sm:text-3xl">Competitions</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Run CTF events for teams across universities, or quick workshops for your own students. Open a competition to manage it live.
          </p>
        </div>
        <ConsoleButton tone="primary" icon={<Plus size={16} />} onClick={() => setCreating(true)} className="self-start sm:self-auto">New competition</ConsoleButton>
      </header>

      <EventInvitations onChange={load} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:w-72">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search competitions" aria-label="Search competitions" className={`${inputClass} pl-9`} />
        </div>
        <div className="scroll-x flex gap-2 lg:ml-auto">
          <Segmented<StateFilter> label="Status" value={stateFilter} onChange={setStateFilter} options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'live', label: 'Live', count: counts.live },
            { value: 'upcoming', label: 'Not started', count: counts.upcoming },
            { value: 'ended', label: 'Ended', count: counts.ended },
          ]} />
          <Segmented<TypeFilter> label="Format" value={typeFilter} onChange={setTypeFilter} options={[
            { value: 'all', label: 'All formats' },
            { value: 'event', label: 'CTF events' },
            { value: 'workshop', label: 'Workshops' },
          ]} />
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map(i => <div key={i} className="h-28 animate-pulse rounded-xl border border-edge bg-panel" />)}
        </div>
      ) : visible.length ? (
        <div className="space-y-3">
          {visible.map(({ c }) => <CompetitionRow key={c._id} c={c} now={now} universityName={universityName} onDelete={remove} />)}
        </div>
      ) : (
        <div className="rounded-xl border border-edge bg-panel">
          <EmptyState icon={<Trophy size={20} />} title={competitions.length ? 'Nothing matches these filters' : 'No competitions yet'}>
            {competitions.length ? 'Clear the search or choose another status.' : (
              <>
                <p>Create a CTF event for teams, or a workshop for a class.</p>
                <ConsoleButton tone="primary" icon={<Plus size={15} />} className="mt-4" onClick={() => setCreating(true)}>New competition</ConsoleButton>
              </>
            )}
          </EmptyState>
        </div>
      )}

      <CreateCompetitionModal
        isOpen={creating}
        onClose={() => setCreating(false)}
        universities={universities}
        currentUser={currentUser}
        onCreated={created => {
          setCreating(false);
          // Straight to the board: a new competition's first job is getting challenges.
          if (created?._id) navigate(`/admin/competitions/${created._id}/monitor?tab=challenges`);
          else void load();
        }}
      />
    </div>
  );
};

export default AdminCompetitionsPage;
