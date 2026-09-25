import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Flag, Monitor, Pause, Play, RefreshCw, Square, Trophy, Users, Ticket, Target } from 'lucide-react';
import { competitionService } from '../../services/competitionService';
import { universityService } from '../../services/universityService';
import { useSocket } from '../../src/contexts/SocketContext';
import { useConfirmation } from '../../src/contexts/ConfirmationContext';
import { useToast } from '../../src/hooks/useToast';
import { useNow } from '../../src/hooks/useCompetitionClock';
import { ConsoleButton, StatTile, StatusPill, TypeBadge, formatAgo, formatDateTime, formatSpan, lifecycleOf } from '../../components/competition/console/ui';
import { ConsoleTab, tabsFor } from '../../components/competition/console/tabs';
import type { TimelineSeries } from '../../components/competition/console/ScoreTimeline';
import OverviewTab from '../../components/competition/console/OverviewTab';
import ScoreboardTab from '../../components/competition/console/ScoreboardTab';
import TeamsTab from '../../components/competition/console/TeamsTab';
import ParticipantsTab from '../../components/competition/console/ParticipantsTab';
import ChallengesTab from '../../components/competition/console/ChallengesTab';
import AnnouncementsTab from '../../components/competition/console/AnnouncementsTab';
import SettingsTab from '../../components/competition/console/SettingsTab';
import StudentsTab from '../../components/competition/console/StudentsTab';

/** Where the schedule stands, as one line and (while running) a progress bar through the window. */
const Timeline: React.FC<{ c: any; now: number }> = ({ c, now }) => {
  const state = lifecycleOf(c, now);
  const start = c.startTime ? Date.parse(c.startTime) : null;
  const end = c.hasTimeLimit !== false && c.endTime ? Date.parse(c.endTime) : null;
  let headline: string, detail: string, progress: number | null = null;
  if (state === 'ended') {
    headline = 'Finished';
    detail = c.endTime ? `Closed ${formatDateTime(c.endTime)}${start ? ` · ran ${formatSpan(Date.parse(c.endTime) - start)}` : ''}` : 'Ended by the host';
  } else if (state === 'live') {
    headline = end ? `${formatSpan(end - now)} left` : `Running for ${formatSpan(now - (start ?? now))}`;
    detail = end ? `Started ${formatDateTime(c.startTime)} · closes ${formatDateTime(c.endTime)}` : 'No time limit — it runs until you end it';
    if (start && end) progress = ((now - start) / (end - start)) * 100;
  } else if (c.autoStart && start) {
    headline = start > now ? `Opens in ${formatSpan(start - now)}` : 'Start time has passed';
    detail = start > now
      ? `Opens automatically ${formatDateTime(c.startTime)}${end ? ` · closes ${formatDateTime(c.endTime)}` : c.duration ? ` · runs ${formatSpan(c.duration * 60000)}` : ''}`
      : 'It opens automatically as soon as the board has a challenge';
  } else {
    headline = 'Waiting for you to start';
    detail = end ? `Closes ${formatDateTime(c.endTime)}` : c.duration ? `Runs ${formatSpan(c.duration * 60000)} from the moment you press Start` : 'Runs until you end it';
  }
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-edge bg-panel px-4 py-3 sm:flex-row sm:items-center">
      <div className={`min-w-0 ${progress !== null ? 'sm:w-96' : 'flex-1'}`}>
        <p className="font-bold tabular-nums text-fg">{headline}</p>
        <p className="text-xs text-muted">{detail}</p>
      </div>
      {progress !== null && (
        <div className="flex flex-1 items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-inset" role="progressbar" aria-label="Time elapsed" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-brand-neon" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
          <span className="text-xs tabular-nums text-faint">{Math.round(Math.min(100, Math.max(0, progress)))}%</span>
        </div>
      )}
      {c.type === 'event' && state !== 'ended' && (
        <p className="text-xs text-faint sm:ml-auto sm:text-right">
          Registration {c.registrationOpen ? `closes ${formatDateTime(c.registrationDeadline)}` : 'closed'}
        </p>
      )}
    </div>
  );
};

const CompetitionMonitoringPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { confirm } = useConfirmation();
  const { toast, ToastContainer } = useToast();
  const { socket, isConnected, joinCompetition, leaveCompetition } = useSocket();
  const now = useNow();

  const [competition, setCompetition] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<TimelineSeries[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [universities, setUniversities] = useState<Array<{ code: string; name: string }>>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false), [updatedAt, setUpdatedAt] = useState(Date.now());
  const [live, setLive] = useState(true);
  const [teamFocus, setTeamFocus] = useState('');
  const version = useRef(0), liveRef = useRef(live);
  liveRef.current = live;

  const isEvent = competition?.type === 'event';
  const tabs = tabsFor(isEvent);
  const requested = params.get('tab') as ConsoleTab | null;
  const tab: ConsoleTab = tabs.some(t => t.id === requested) ? requested! : 'overview';
  const openTab = (next: ConsoleTab) => setParams(prev => { const p = new URLSearchParams(prev); p.set('tab', next); return p; }, { replace: true });

  const load = useCallback(async (quiet = false) => {
    const request = ++version.current;
    if (quiet) setRefreshing(true);
    try {
      const data = await competitionService.getCompetitionById(id);
      if (data.type === 'event' && !data.canManage) throw new Error('Only the host university can manage this event.');
      const [board, activity] = await Promise.all([
        competitionService.getCompetitionLeaderboard(id),
        competitionService.getCompetitionActivity(id),
      ]);
      if (request !== version.current) return;
      setCompetition(data);
      setRows(Array.isArray(board) ? board : board.leaderboard || []);
      setTimeline(board.timeline || []);
      setActivities(Array.isArray(activity) ? activity : []);
      setError('');
      setUpdatedAt(Date.now());
    } catch (e: any) {
      if (request === version.current) setError(e.message || 'Could not load this competition.');
    } finally {
      if (request === version.current) { setLoading(false); setRefreshing(false); }
    }
  }, [id]);

  useEffect(() => { void load(); return () => { ++version.current; }; }, [load]);
  useEffect(() => { universityService.getUniversities().then(setUniversities).catch(() => setUniversities([])); }, []);

  // Realtime: every relevant socket event collapses into one quiet reload, skipped while paused.
  useEffect(() => {
    if (!id) return;
    if (isConnected) joinCompetition(id);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (data?: any) => {
      if (!liveRef.current || (data?.competitionId && data.competitionId !== id)) return;
      clearTimeout(timer);
      timer = setTimeout(() => void load(true), 400);
    };
    const events = ['competitionActivity', 'flagSubmitted', 'competitionUpdate', 'eventChanged', 'eventRegistrationChanged'];
    for (const name of events) socket?.on(name, schedule);
    return () => {
      clearTimeout(timer);
      for (const name of events) socket?.off(name, schedule);
      leaveCompetition(id);
    };
  }, [id, socket, isConnected, joinCompetition, leaveCompetition, load]);

  /** Runs a management action, reports it, and reloads whatever it changed. */
  const run = useCallback(async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast('success', success);
      return true;
    } catch (e: any) {
      toast('error', e.message || 'That did not work. Try again.');
      return false;
    } finally {
      await load(true);
    }
  }, [load, toast]);

  const rankOf = useMemo(() => new Map<string, number>(rows.map((row, index) => [String(row._id), index + 1])), [rows]);

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading competition">
        <div className="h-5 w-32 animate-pulse rounded bg-panel" />
        <div className="h-10 w-2/3 animate-pulse rounded-lg bg-panel" />
        <div className="h-16 animate-pulse rounded-xl border border-edge bg-panel" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-28 animate-pulse rounded-xl border border-edge bg-panel" />)}
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p role="alert" className="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">{error || 'Competition not found.'}</p>
        <Link to="/admin/competitions" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg"><ArrowLeft size={16} /> Back to competitions</Link>
      </div>
    );
  }

  const c = competition;
  const state = lifecycleOf(c, now);
  const totalSolves = c.challenges.reduce((n: number, ch: any) => n + (ch.solves || 0), 0);
  const cracked = c.challenges.filter((ch: any) => (ch.solves || 0) > 0).length;
  // Nobody leads a board where nobody has scored.
  const leader = rows[0] && (rows[0].points !== 0 || rows[0].solvedChallenges > 0) ? rows[0] : undefined;
  const universityCount = isEvent ? c.invitations?.filter((i: any) => i.status === 'accepted').length : (c.universityCodes?.length || 1);
  const hostName = universities.find(u => u.code === c.universityCode)?.name || c.universityCode;

  const start = async () => {
    const plan = c.hasTimeLimit === false ? 'It runs until you end it.'
      : c.endTime ? `It closes ${formatDateTime(c.endTime)}.`
      : c.duration ? `It runs for ${formatSpan(c.duration * 60000)} from now.` : '';
    if (!await confirm(`Start "${c.name}" now? ${isEvent ? 'Registered teams' : 'Players'} see the challenges and can submit flags immediately. ${plan}`, {
      type: 'warning', title: isEvent ? 'Start event' : 'Start competition', confirmText: 'Start now',
    })) return;
    await run(() => {
      // Workshops store the timer as a duration and stamp the window when started.
      if (!isEvent && c.duration) {
        const startTime = new Date();
        return competitionService.updateCompetitionStartTime(c._id, {
          startTime: startTime.toISOString(), endTime: new Date(startTime.getTime() + c.duration * 60000).toISOString(), status: 'active',
        });
      }
      return competitionService.updateCompetitionStatus(c._id, 'active');
    }, isEvent ? 'Event started' : 'Competition started');
  };

  const end = async () => {
    if (!await confirm(`End "${c.name}" now? Submissions close immediately and the standings become final.${isEvent ? ' Ended events cannot be reopened.' : ''}`, {
      type: 'danger', title: isEvent ? 'End event' : 'End competition', confirmText: 'End now', isDestructive: true,
    })) return;
    await run(() => competitionService.updateCompetitionStatus(c._id, 'ended'), isEvent ? 'Event ended' : 'Competition ended');
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <Link to="/admin/competitions" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-fg">
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" /> Competitions
      </Link>

      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <TypeBadge type={c.type} />
            <StatusPill state={state} />
            <span className="text-xs text-faint">
              Hosted by {hostName}{universityCount > 1 ? ` · ${universityCount} universities` : ''}
            </span>
          </div>
          <h1 className="break-words text-2xl font-black tracking-tight text-fg sm:text-3xl">{c.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { setLive(v => !v); if (!live) void load(true); }}
            aria-pressed={live}
            title={live ? 'Pause live updates' : 'Resume live updates'}
            className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-fg touch:min-h-tap"
          >
            <span className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-brand-neon' : 'bg-amber'}`} />
            {live ? 'Live' : 'Paused'}
            <span className="font-normal text-faint">· {formatAgo(new Date(updatedAt), now)}</span>
          </button>
          <ConsoleButton tone="ghost" aria-label="Refresh" icon={<RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />} onClick={() => void load(true)} disabled={refreshing} />
          <ConsoleButton icon={<Monitor size={15} />} onClick={() => navigate(`/competition/${id}/leaderboard?present=1`)}>Present scoreboard</ConsoleButton>
          {c.status === 'pending' && (
            <ConsoleButton tone="primary" icon={<Play size={15} />} onClick={start} disabled={!c.challenges.length} title={c.challenges.length ? undefined : 'Add a challenge first'}>
              {isEvent ? 'Start event' : 'Start'}
            </ConsoleButton>
          )}
          {c.status === 'active' && (
            <ConsoleButton tone="danger" icon={<Square size={14} />} onClick={end}>{isEvent ? 'End event' : 'End'}</ConsoleButton>
          )}
        </div>
      </header>

      {!live && (
        <p className="flex items-center gap-2 rounded-lg border border-amber/25 bg-amber/5 px-3 py-2 text-xs text-amber">
          <Pause size={13} /> Live updates are paused. The numbers below are from {formatAgo(new Date(updatedAt), now)}.
        </p>
      )}

      <Timeline c={c} now={now} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isEvent ? (
          <>
            <StatTile label="Teams" value={rows.length} detail={`${c.registrationCount} players registered`} icon={<Users size={15} />} accent="#60a5fa" />
            <StatTile label="Seats" value={<>{c.registrationCount}<span className="text-sm font-semibold text-faint"> / {c.capacity}</span></>}
              detail={c.registrationOpen ? 'Registration open' : 'Registration closed'} icon={<Ticket size={15} />} accent="#a855f7"
              progress={(c.registrationCount / c.capacity) * 100} />
          </>
        ) : (
          <>
            <StatTile label="Players" value={rows.length} detail={`${rows.filter(r => r.solvedChallenges > 0).length} have scored`} icon={<Users size={15} />} accent="#60a5fa" />
            <StatTile label="Challenges" value={c.challenges.length} detail={`${c.challenges.reduce((n: number, ch: any) => n + (ch.hints?.length || 0), 0)} hints available`} icon={<Target size={15} />} accent="#a855f7" />
          </>
        )}
        <StatTile label="Flags captured" value={totalSolves} detail={`${cracked} of ${c.challenges.length} challenges cracked`} icon={<Flag size={15} />} accent="#00a859"
          progress={c.challenges.length ? (cracked / c.challenges.length) * 100 : 0} />
        <StatTile label="Leading" value={<span className="block truncate text-xl">{leader ? leader.name || leader.username : '—'}</span>}
          detail={leader ? `${leader.points.toLocaleString()} pts · ${leader.solvedChallenges} solved` : 'No scores yet'} icon={<Trophy size={15} />} accent="#9fef00" />
      </div>

      <nav aria-label="Console sections" className="scroll-x -mb-px flex gap-1 border-b border-edge">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => openTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors touch:min-h-tap ${
              tab === t.id ? 'border-brand-neon text-fg' : 'border-transparent text-muted hover:text-fg-soft'
            }`}
          >
            {t.label}
            {t.id === 'teams' && isEvent && <span className="ml-1.5 text-xs font-normal text-faint">{c.teams?.length || 0}</span>}
            {t.id === 'participants' && isEvent && <span className="ml-1.5 text-xs font-normal text-faint">{c.registrationCount}</span>}
            {t.id === 'challenges' && <span className="ml-1.5 text-xs font-normal text-faint">{c.challenges.length}</span>}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <OverviewTab competition={c} isEvent={isEvent} rows={rows} timeline={timeline} activities={activities} now={now} onOpenTab={openTab} />}
      {tab === 'scoreboard' && <ScoreboardTab competition={c} isEvent={isEvent} teamRows={rows} onOpenTeam={isEvent ? name => { setTeamFocus(name); openTab('teams'); } : undefined} />}
      {tab === 'teams' && isEvent && <TeamsTab competition={c} rankOf={rankOf} focus={teamFocus} run={run} confirm={confirm} />}
      {tab === 'participants' && isEvent && <ParticipantsTab competition={c} universities={universities} now={now} run={run} confirm={confirm} />}
      {tab === 'students' && !isEvent && <StudentsTab competition={c} rows={rows} now={now} onProfile={userId => navigate(`/profile/${userId}`)} />}
      {tab === 'challenges' && <ChallengesTab competition={c} isEvent={isEvent} run={run} confirm={confirm} onView={challengeId => navigate(`/competition/${id}/challenge/${challengeId}`)} />}
      {tab === 'announcements' && <AnnouncementsTab competition={c} isEvent={isEvent} now={now} run={run} confirm={confirm} />}
      {tab === 'settings' && isEvent && <SettingsTab competition={c} run={run} />}
    </div>
  );
};

export default CompetitionMonitoringPage;
