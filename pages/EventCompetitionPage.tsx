import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Copy, Users, Trophy, Flag, Plus, ArrowLeft } from 'lucide-react';
import { eventService } from '../services/eventService';
import { competitionService } from '../services/competitionService';
import { challengeService } from '../services/challengeService';
import { useSocket } from '../src/contexts/SocketContext';
import { useNow } from '../src/hooks/useCompetitionClock';
import ChallengeArt, { artKindFor } from '../components/challenges/ChallengeArt';

const inputClass = 'w-full rounded-lg border border-edge bg-inset px-3 py-2 text-fg';
const buttonClass = 'rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200 disabled:opacity-40';
const panelClass = 'rounded-2xl border border-edge bg-panel p-5 space-y-4';

export default function EventCompetitionPage() {
  const { id = '' } = useParams(), now = useNow();
  const [event, setEvent] = useState<any>(null), [rows, setRows] = useState<any[]>([]), [mode, setMode] = useState<'team' | 'individual'>('team');
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const [teamName, setTeamName] = useState(''), [code, setCode] = useState(''), [library, setLibrary] = useState<any[]>([]), [challengeId, setChallengeId] = useState('');
  const [search, setSearch] = useState(''), [candidates, setCandidates] = useState<any[]>([]), [candidate, setCandidate] = useState('');
  const [memberTeam, setMemberTeam] = useState(''), [memberId, setMemberId] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [adjustTeam, setAdjustTeam] = useState(''), [amount, setAmount] = useState(''), [reason, setReason] = useState('');
  const { socket, isConnected, joinCompetition, leaveCompetition } = useSocket();
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    try {
      const [data, rankings, activity] = await Promise.all([eventService.details(id), eventService.leaderboard(id, mode), competitionService.getCompetitionActivity(id)]);
      if (request !== version.current) return;
      setEvent(data); setRows(rankings.leaderboard || []); setActivities(activity || []); setError('');
    } catch (e: any) { if (request === version.current) { setError(e.message); setEvent(null); setRows([]); } }
    finally { if (request === version.current) setLoading(false); }
  }, [id, mode]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!event || !isConnected) return;
    joinCompetition(id);
    return () => leaveCompetition(id);
  }, [id, !!event, isConnected, joinCompetition, leaveCompetition]);
  useEffect(() => {
    const changed = (data: any) => { if (data.competitionId === id) void refresh(); };
    const revoked = (data: any) => { if (data.competitionId === id) { ++version.current; setEvent(null); setRows([]); setError('Your registration has been removed.'); } };
    socket?.on('eventChanged', changed); socket?.on('eventAccessRevoked', revoked); socket?.on('connect', refresh);
    window.addEventListener('focus', refresh);
    return () => { socket?.off('eventChanged', changed); socket?.off('eventAccessRevoked', revoked); socket?.off('connect', refresh); window.removeEventListener('focus', refresh); };
  }, [socket, refresh, id]);
  useEffect(() => {
    if (!event?.canManage) return;
    challengeService.getChallenges(event.universityCode, true).then((data: any) => setLibrary(Array.isArray(data) ? data.filter(c => !c.fromCompetition) : [])).catch((e: any) => setError(e.message));
  }, [event?.canManage, event?.universityCode]);
  const act = async (action: () => Promise<any>, message: string) => {
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(message); await refresh(); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  if (loading) return <div className="p-10 text-muted">Loading event…</div>;
  if (!event) return <div className="max-w-xl mx-auto p-10 space-y-4"><p role="alert" className="text-red-400">{error || 'Event unavailable'}</p><Link to="/competition" className={buttonClass}>Back to competitions</Link></div>;
  const active = event.status === 'active' && (!event.endTime || now < new Date(event.endTime).getTime());
  const team = event.team;
  return <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 pb-24">
    <Link to="/competition" className="flex gap-2 items-center text-sm text-muted"><ArrowLeft size={16} /> Competitions</Link>
    <header className="rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/15 to-panel p-6 space-y-3">
      <p className="text-xs uppercase tracking-widest text-indigo-300">Team event · {event.status}</p><h1 className="text-3xl font-bold text-fg">{event.name}</h1>
      <p className="text-sm text-muted">{event.registrationCount} / {event.capacity} participants · Registration deadline {new Date(event.registrationDeadline).toLocaleString()}</p>
      {event.endTime && <p className="text-sm text-muted">Ends {new Date(event.endTime).toLocaleString()}</p>}
      <div className="flex flex-wrap gap-2">{event.universityCodes.map((university: string) => <span key={university} className="rounded border border-edge px-2 py-1 text-xs text-muted">{university}</span>)}</div>
    </header>
    {error && <p role="alert" className="rounded border border-red-400/30 bg-red-500/10 p-3 text-red-300">{error}</p>}
    {notice && <p role="status" className="text-emerald-300">{notice}</p>}

    {!event.canManage && <section className={panelClass}>
      <h2 className="flex gap-2 items-center text-xl font-bold text-fg"><Users size={20} /> {team ? team.name : 'Create or join your team'}</h2>
      {team ? <>
        <div className="flex flex-wrap items-center gap-3"><span className="text-lg font-bold text-indigo-300">{team.score} points</span><code className="rounded bg-inset p-2 text-fg">{team.inviteCode}</code><button className={buttonClass} onClick={async () => { try { await navigator.clipboard.writeText(team.inviteCode); setNotice('Invite code copied'); } catch { setError('Could not copy. Select and copy the invite code above.'); } }}><Copy size={14} className="inline mr-2" />Copy invite code</button></div>
        <ul className="flex flex-wrap gap-3">{team.members.filter(Boolean).map((member: any) => <li key={member.userId} className="rounded-lg border border-edge p-3 text-fg">{member.username}<span className="ml-2 text-xs text-muted">{member.universityCode}{member.userId === team.captainId ? ' · Captain' : ''}</span></li>)}</ul>
        <p className="text-xs text-muted">Solves and purchased hints are shared by everyone on the team. Rosters lock after the first solve, hint purchase or score adjustment.</p>
        <button disabled={busy || team.locked} className={buttonClass} onClick={() => act(() => eventService.leaveTeam(id), 'You left the team')}>{team.locked ? 'Roster locked' : 'Leave team'}</button>
      </> : <div className="grid md:grid-cols-2 gap-4">
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); void act(() => eventService.createTeam(id, teamName), 'Team created'); }}><label className="block text-sm text-muted" htmlFor="team-name">Team name</label><input id="team-name" required maxLength={60} className={inputClass} value={teamName} onChange={e => setTeamName(e.target.value)} /><button disabled={busy || event.status === 'ended'} className={buttonClass}>Create team</button></form>
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); void act(() => eventService.joinTeam(id, code), 'Joined team'); }}><label className="block text-sm text-muted" htmlFor="invite-code">Team invite code</label><input id="invite-code" required maxLength={30} className={inputClass} value={code} onChange={e => setCode(e.target.value)} /><button disabled={busy || event.status === 'ended'} className={buttonClass}>Join team</button></form>
      </div>}
    </section>}

    {event.canManage && <section className={panelClass}>
      <h2 className="text-xl font-bold text-fg">Event management</h2>
      <div className="flex flex-wrap gap-3">{event.status === 'pending' && <button disabled={busy || !event.challenges.length} className={buttonClass} onClick={() => act(() => competitionService.updateCompetitionStatus(id, 'active'), 'Event started')}>Start event now</button>}{event.status !== 'ended' && <button disabled={busy} className={buttonClass} onClick={() => act(() => competitionService.updateCompetitionStatus(id, 'ended'), 'Event ended')}>End event</button>}</div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3"><h3 className="font-bold text-fg">University invitations</h3><ul className="space-y-2">{event.invitations.map((i: any) => <li key={i.universityCode} className="flex justify-between text-sm text-muted"><span>{i.universityCode}</span><span className="capitalize">{i.status}</span></li>)}</ul></div>
        {event.status === 'pending' && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void act(() => competitionService.addChallengeToCompetition(id, challengeId), 'Challenge added'); }}><label className="block font-bold text-fg" htmlFor="event-challenge">Add a challenge</label><select id="event-challenge" required className={inputClass} value={challengeId} onChange={e => setChallengeId(e.target.value)}><option value="">Select challenge</option>{library.map(c => <option key={c._id} value={c._id}>{c.title} · {c.category}</option>)}</select><button disabled={busy} className={buttonClass}><Plus size={14} className="inline mr-2" />Add challenge</button></form>}
      </div>
      <details className="border-t border-edge pt-4" open><summary className="font-bold text-fg cursor-pointer">Registered participants ({event.registrations.length})</summary>
        <form className="flex flex-wrap gap-2 mt-4" onSubmit={async e => { e.preventDefault(); setBusy(true); try { setCandidates(await eventService.candidates(id, search)); setCandidate(''); } catch(e: any) { setError(e.message); } finally { setBusy(false); } }}><input aria-label="Search students by username" minLength={2} required className={`${inputClass} md:w-64`} placeholder="Search username" value={search} onChange={e => setSearch(e.target.value)} /><button disabled={busy} className={buttonClass}>Find students</button></form>
        {!!candidates.length && <div className="flex flex-wrap gap-2 mt-3"><select aria-label="Student to register" className={`${inputClass} md:w-80`} value={candidate} onChange={e => setCandidate(e.target.value)}><option value="">Select student</option>{candidates.map(c => <option key={c._id} value={c._id}>{c.username} · {c.universityCode}</option>)}</select><button disabled={busy || !candidate} className={buttonClass} onClick={() => act(() => eventService.addParticipant(id, candidate), 'Participant added')}>Add participant</button></div>}
        <p className="text-xs text-muted my-3">Only students from accepted universities can be added. Host additions may bypass the deadline, but capacity still applies. Removing a participant preserves earned team scores.</p>
        <div className="max-h-72 overflow-y-auto space-y-2">{event.registrations.map((r: any) => <div key={r.userId} className="flex justify-between items-center gap-2 border-b border-edge py-2 text-sm"><span className="text-fg">{r.username} <span className="text-muted">· {r.universityCode}</span></span><button className={buttonClass} disabled={busy} onClick={() => act(() => eventService.removeParticipant(id, r.userId), 'Participant removed')}>Remove</button></div>)}</div>
      </details>
      <details className="border-t border-edge pt-4"><summary className="font-bold text-fg cursor-pointer">Teams and score adjustments ({event.teams.length})</summary>
        <div className="grid md:grid-cols-2 gap-3 my-4">{event.teams.map((t: any) => <div key={t.id} className="rounded border border-edge p-3"><p className="font-semibold text-fg">{t.name} · {t.score} points</p><p className="text-sm text-muted">{t.members.map((uid: string) => event.registrations.find((r: any) => r.userId === uid)?.username || uid).join(', ') || 'Archived team'}</p><p className="text-xs text-muted">{t.locked ? 'Roster locked' : 'Roster open'}</p><div className="flex flex-wrap gap-2 mt-2">{t.members.map((uid: string) => <button key={uid} disabled={busy || event.status === 'ended'} className={buttonClass} onClick={() => act(() => eventService.removeMember(id, t.id, uid), 'Member removed from team')}>Remove {event.registrations.find((r: any) => r.userId === uid)?.username || 'member'}</button>)}</div>{t.adjustments.map((a: any, index: number) => <p key={index} className="text-xs text-muted mt-1">{a.amount > 0 ? '+' : ''}{a.amount}: {a.reason}</p>)}</div>)}</div>
        <form className="grid md:grid-cols-3 gap-3 mb-4" onSubmit={e => { e.preventDefault(); void act(() => eventService.addMember(id, memberTeam, memberId), 'Team member added'); }}><select required aria-label="Team for participant" className={inputClass} value={memberTeam} onChange={e => setMemberTeam(e.target.value)}><option value="">Choose team</option>{event.teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><select required aria-label="Registered participant to assign" className={inputClass} value={memberId} onChange={e => setMemberId(e.target.value)}><option value="">Choose participant</option>{event.registrations.map((r: any) => <option key={r.userId} value={r.userId}>{r.username}</option>)}</select><button disabled={busy || event.status === 'ended'} className={buttonClass}>Add to team</button></form>
        <form className="grid md:grid-cols-4 gap-3" onSubmit={e => { e.preventDefault(); void act(() => eventService.adjust(id, adjustTeam, Number(amount), reason), 'Score adjustment saved'); }}><select required aria-label="Team to adjust" className={inputClass} value={adjustTeam} onChange={e => setAdjustTeam(e.target.value)}><option value="">Choose team</option>{event.teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><input required aria-label="Point adjustment" type="number" step="1" min="-1000000" max="1000000" placeholder="Points (+ / −)" className={inputClass} value={amount} onChange={e => setAmount(e.target.value)} /><input required maxLength={500} aria-label="Adjustment reason" placeholder="Reason" className={inputClass} value={reason} onChange={e => setReason(e.target.value)} /><button disabled={busy} className={buttonClass}>Apply adjustment</button></form>
      </details>
    </section>}

    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
      <section className={panelClass}><h2 className="flex gap-2 items-center text-xl font-bold text-fg"><Flag size={20} /> Challenges</h2>
        {!event.challenges.length && <p className="text-muted">{event.status === 'pending' ? 'Challenges will appear when the event starts.' : 'Challenge content is closed. View the final rankings.'}</p>}
        {event.challenges.map((c: any) => <div key={c._id} className="flex items-center gap-3 rounded-xl border border-edge p-3"><ChallengeArt kind={artKindFor(c.category)} detailed={false} className="h-14 w-14 shrink-0" /><div className="min-w-0 flex-1"><p className="font-semibold text-fg">{c.title}</p><p className="text-xs text-muted">{c.category} · {c.currentPoints} points · {c.solves} teams solved</p>{c.solvedBy && <p className="text-xs text-emerald-300 mt-1">{c.solvedByTeammate ? `Solved by teammate ${c.solvedBy}` : `Solved by ${c.solvedBy}`}</p>}</div><div className="flex gap-2">{(active || event.canManage) && <Link className={buttonClass} to={`/competition/${id}/challenge/${c._id}`}>View</Link>}{event.canManage && event.status === 'pending' && <button disabled={busy} className={buttonClass} onClick={() => act(() => competitionService.removeChallengeFromCompetition(id, c._id), 'Challenge removed')}>Remove</button>}</div></div>)}
        {event.canManage && event.challenges.some((c: any) => c.hints?.length) && <details><summary className="text-sm text-muted cursor-pointer">Publish hints to all teams</summary><div className="mt-3 space-y-2">{event.challenges.flatMap((c: any) => (c.hints || []).map((h: any, index: number) => <div key={c._id + index} className="flex justify-between gap-2 items-center text-sm text-muted"><span>{c.title} · Hint {index + 1}</span><button className={buttonClass} disabled={busy || h.isPublished} onClick={() => act(() => competitionService.publishCompetitionHint(id, c._id, index), 'Hint published to all teams')}>{h.isPublished ? 'Published' : 'Publish'}</button></div>))}</div></details>}
      </section>
      <section className={panelClass}><h2 className="flex gap-2 items-center text-xl font-bold text-fg"><Trophy size={20} /> Rankings</h2><div className="flex gap-2">{(['team', 'individual'] as const).map(value => <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)} className={`${buttonClass} ${mode === value ? 'bg-indigo-500/30' : ''}`}>{value === 'team' ? 'Teams' : 'Individuals'}</button>)}</div>
        <p className="text-xs text-muted">{mode === 'team' ? 'Unique solves, minus hint costs and penalties. Ties go to the earliest last solve.' : 'Points attributed to the submitting player, minus their hint purchases. Team adjustments appear only in team rankings.'}</p>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-muted border-b border-edge"><th className="text-left py-2">#</th><th className="text-left">{mode === 'team' ? 'Team' : 'Player'}</th><th className="text-right">Solves</th><th className="text-right">Points</th></tr></thead><tbody>{rows.map((r, index) => <tr key={r._id} className="border-b border-edge text-fg"><td className="py-3">{index + 1}</td><td>{r.name || r.username}</td><td className="text-right">{r.solvedChallenges}</td><td className="text-right font-semibold text-indigo-300">{r.points}</td></tr>)}</tbody></table></div>{!rows.length && <p className="text-sm text-muted">No teams yet.</p>}
      </section>
    </div>
    {!!activities.length && <section className={panelClass}><h2 className="text-xl font-bold text-fg">Recent activity</h2><ul className="space-y-2">{activities.slice(0, 10).map((a, index) => <li key={index} className="text-sm text-muted"><span className="font-semibold text-fg">{a.username}</span> solved {a.challengeTitle}{a.type === 'first_blood' ? ' · First blood' : ''}<span className="ml-2 text-xs">{new Date(a.timestamp).toLocaleTimeString()}</span></li>)}</ul></section>}
  </div>;
}
