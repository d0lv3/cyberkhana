import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Maximize, Minimize, ArrowLeft, Snowflake } from 'lucide-react';
import { competitionService } from '../services/competitionService';
import { eventService } from '../services/eventService';
import { useSocket } from '../src/contexts/SocketContext';
import UnifiedLeaderboard from '../components/leaderboard/UnifiedLeaderboard';
import ProfileSlidePanel from '../components/ui/ProfileSlidePanel';
import { ConsoleButton, Segmented } from '../components/competition/console/ui';
import ScoreTimeline, { TimelineSeries } from '../components/competition/console/ScoreTimeline';

const CompetitionLeaderboardPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin' || user.role === 'super-admin';
  const [competition, setCompetition] = useState<any>(null), [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0), [mode, setMode] = useState<'team' | 'individual'>('team');
  const [timeline, setTimeline] = useState<TimelineSeries[]>([]);
  // Hosts see what players see by default, so a projected scoreboard never leaks a freeze.
  const [hostLive, setHostLive] = useState(false), [frozenAt, setFrozenAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [expanded, setExpanded] = useState(isAdmin && params.get('present') === '1');
  const [selected, setSelected] = useState<any>(null), [rank, setRank] = useState<number>();
  const version = useRef(0), maximizeButton = useRef<HTMLButtonElement>(null);
  const { socket, isConnected, joinCompetition, leaveCompetition } = useSocket();
  const refresh = useCallback(async () => {
    const request = ++version.current;
    try {
      const [data, result] = await Promise.all([
        competitionService.getCompetitionById(id, localStorage.getItem(`competition_${id}_security_code`) || undefined),
        eventService.leaderboard(id, mode, isAdmin && !hostLive ? 'public' : undefined),
      ]);
      if (request !== version.current) return;
      setCompetition(data); setRows(Array.isArray(result) ? result : result.leaderboard || []); setTimeline(result.timeline || []); setFrozenAt(result.frozenAt || null);
      setTotal(result.totalChallenges ?? data.challenges.length); setError('');
    } catch (e: any) {
      if (request === version.current) { setRows([]); setCompetition(null); setError(e.message || 'Could not load leaderboard'); }
    } finally { if (request === version.current) setLoading(false); }
  }, [id, mode, hostLive]);
  useEffect(() => { void refresh(); return () => { ++version.current; }; }, [refresh]);
  useEffect(() => {
    if (isConnected) { joinCompetition(id); void refresh(); }
    const changed = (data: any) => { if (!data?.competitionId || data.competitionId === id) void refresh(); };
    const revoked = (data: any) => { if (data.competitionId === id) { ++version.current; setRows([]); setCompetition(null); setLoading(false); setError('Your event registration has been removed.'); } };
    for (const name of ['competitionActivity', 'leaderboardUpdate', 'flagSubmitted', 'eventChanged']) socket?.on(name, changed);
    socket?.on('eventAccessRevoked', revoked); window.addEventListener('focus', refresh);
    return () => {
      leaveCompetition(id);
      for (const name of ['competitionActivity', 'leaderboardUpdate', 'flagSubmitted', 'eventChanged']) socket?.off(name, changed);
      socket?.off('eventAccessRevoked', revoked); window.removeEventListener('focus', refresh);
    };
  }, [socket, isConnected, id, refresh, joinCompetition, leaveCompetition]);
  const restore = () => { setExpanded(false); if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); };
  useEffect(() => {
    if (!expanded) return;
    const overflow = document.body.style.overflow;
    const root = document.getElementById('root');
    const wasInert = root?.inert;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') restore(); };
    const fullscreen = () => { if (!document.fullscreenElement) setExpanded(false); };
    window.addEventListener('keydown', key); document.addEventListener('fullscreenchange', fullscreen);
    return () => { document.body.style.overflow = overflow; if (root) root.inert = !!wasInert; window.removeEventListener('keydown', key); document.removeEventListener('fullscreenchange', fullscreen); maximizeButton.current?.focus(); };
  }, [expanded]);
  useEffect(() => () => { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); }, []);
  const teamMode = competition?.type === 'event' && mode === 'team';
  const content = <div className={expanded ? 'fixed inset-0 z-[100] overflow-y-auto bg-canvas p-4 md:p-8' : 'space-y-6'}>
    <div className="flex flex-wrap justify-between gap-3 mb-6">
      <ConsoleButton icon={<ArrowLeft size={16} />} onClick={() => { restore(); navigate(`/competition/${id}`); }}>Competition</ConsoleButton>
      <div className="flex flex-wrap items-center gap-2">
        {competition?.type === 'event' && <Segmented label="Standings" value={mode} onChange={setMode} options={[{ value: 'team', label: 'Teams' }, { value: 'individual', label: 'Individuals' }]} />}
        {isAdmin && <button ref={maximizeButton} autoFocus={expanded} className="flex items-center gap-2 rounded-lg border border-edge bg-panel px-4 py-2 text-fg" onClick={() => { if (expanded) restore(); else { setExpanded(true); void document.documentElement.requestFullscreen?.().catch(() => {}); } }}>{expanded ? <Minimize size={16} /> : <Maximize size={16} />}{expanded ? 'Exit fullscreen' : 'Maximize leaderboard'}</button>}
      </div>
    </div>
    {(frozenAt || (hostLive && competition?.scoreboardFrozen)) && (
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-info/30 bg-info/[0.07] px-5 py-3.5 text-sm sm:flex-row sm:items-center">
        <Snowflake size={18} className="flex-shrink-0 text-info" />
        <p className="flex-1 text-fg-soft">
          {hostLive
            ? <><span className="font-semibold text-fg">Live standings, visible to hosts only.</span> Players still see the frozen scoreboard.</>
            : <><span className="font-semibold text-fg">Scoreboard frozen</span> at {new Date(frozenAt!).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}. These are the standings from that moment; the final scoreboard is revealed by the organizers.</>}
        </p>
        {isAdmin && competition?.canManage && !expanded && (
          <button type="button" onClick={() => setHostLive(v => !v)} className="flex-shrink-0 text-xs font-semibold text-info hover:underline">
            {hostLive ? 'Show players’ view' : 'Show live (hosts only)'}
          </button>
        )}
      </div>
    )}
    {teamMode && timeline.some(series => series.points.length) && (
      <section className="mb-6 rounded-xl border border-edge bg-panel p-4" aria-label="Score progression">
        <h2 className="mb-3 text-sm font-semibold text-fg">Score progression · top {Math.min(timeline.length, 8)} teams</h2>
        <ScoreTimeline series={timeline} start={competition.startTime} end={frozenAt || (competition.status === 'ended' ? competition.endTime : undefined)} />
      </section>
    )}
    <UnifiedLeaderboard title={`${competition?.name || 'Competition'} leaderboard`} subtitle={`${rows.length} ${teamMode ? 'teams' : 'players'} in this competition`} entryLabel={teamMode ? 'Team' : 'Player'} preserveOrder={competition?.type === 'event'}
      entries={rows.map(row => ({ id: row._id, username: row.username, player: row.displayName || row.fullName || row.username,
        playerTag: teamMode ? `${row.memberCount} members` : row.universityName || row.universityCode, points: row.points, flagsPwned: row.solvedChallenges,
        profileIcon: row.profileIcon, isCurrentUser: teamMode ? row._id === competition.team?.id : row.username === user.username }))}
      totalFlags={total} loading={loading} error={error} onRetry={refresh}
      onSelectEntry={teamMode ? undefined : (entry, place) => { setSelected(rows.find(row => row._id === entry.id)); setRank(place); }} />
    <ProfileSlidePanel isOpen={!!selected} onClose={() => setSelected(null)} user={selected} rank={rank} totalChallenges={total} />
  </div>;
  return expanded ? createPortal(content, document.body) : content;
};
export default CompetitionLeaderboardPage;
