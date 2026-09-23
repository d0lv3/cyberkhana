import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Maximize, Minimize, ArrowLeft } from 'lucide-react';
import { competitionService } from '../services/competitionService';
import { eventService } from '../services/eventService';
import { useSocket } from '../src/contexts/SocketContext';
import UnifiedLeaderboard from '../components/leaderboard/UnifiedLeaderboard';
import ProfileSlidePanel from '../components/ui/ProfileSlidePanel';
import Button from '../components/ui/button';

const CompetitionLeaderboardPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin' || user.role === 'super-admin';
  const [competition, setCompetition] = useState<any>(null), [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0), [mode, setMode] = useState<'team' | 'individual'>('team');
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
        eventService.leaderboard(id, mode),
      ]);
      if (request !== version.current) return;
      setCompetition(data); setRows(Array.isArray(result) ? result : result.leaderboard || []);
      setTotal(result.totalChallenges ?? data.challenges.length); setError('');
    } catch (e: any) {
      if (request === version.current) { setRows([]); setCompetition(null); setError(e.message || 'Could not load leaderboard'); }
    } finally { if (request === version.current) setLoading(false); }
  }, [id, mode]);
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
      <Button variant="outline" onClick={() => { restore(); navigate(`/competition/${id}`); }}><ArrowLeft size={16} className="mr-2" />Competition</Button>
      <div className="flex flex-wrap gap-2">
        {competition?.type === 'event' && (['team', 'individual'] as const).map(value => <Button key={value} variant={mode === value ? 'default' : 'outline'} aria-pressed={mode === value} onClick={() => setMode(value)}>{value === 'team' ? 'Teams' : 'Individuals'}</Button>)}
        {isAdmin && <button ref={maximizeButton} autoFocus={expanded} className="flex items-center gap-2 rounded-lg border border-edge bg-panel px-4 py-2 text-fg" onClick={() => { if (expanded) restore(); else { setExpanded(true); void document.documentElement.requestFullscreen?.().catch(() => {}); } }}>{expanded ? <Minimize size={16} /> : <Maximize size={16} />}{expanded ? 'Exit fullscreen' : 'Maximize leaderboard'}</button>}
      </div>
    </div>
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
