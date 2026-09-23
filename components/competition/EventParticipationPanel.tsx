import React, { useState } from 'react';
import { Copy, Users } from 'lucide-react';
import { eventService } from '../../services/eventService';

const inputClass = 'w-full rounded-lg border border-edge bg-inset px-3 py-2 text-fg';
const buttonClass = 'rounded-lg border border-edge bg-surface px-4 py-2 text-sm font-semibold text-fg hover:border-brand/40 disabled:opacity-40';
const panelClass = 'rounded-xl border border-edge bg-panel p-5 space-y-4 mb-6';

const EventParticipationPanel: React.FC<{ event: any; onChange: () => Promise<any> | void }> = ({ event, onChange }) => {
  const id = event._id, team = event.team;
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const [teamName, setTeamName] = useState(''), [code, setCode] = useState('');
  const [search, setSearch] = useState(''), [candidates, setCandidates] = useState<any[]>([]), [candidate, setCandidate] = useState('');
  const [memberTeam, setMemberTeam] = useState(''), [memberId, setMemberId] = useState('');
  const [adjustTeam, setAdjustTeam] = useState(''), [amount, setAmount] = useState(''), [reason, setReason] = useState('');
  const act = async (action: () => Promise<any>, message: string) => {
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(message); await onChange(); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  return <div>
    {error && <p role="alert" className="mb-3 text-red-400">{error}</p>}
    {notice && <p role="status" className="mb-3 text-brand">{notice}</p>}
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
      <div><h3 className="font-bold text-fg">University invitations</h3><ul className="mt-3 space-y-2">{event.invitations.map((i: any) => <li key={i.universityCode} className="flex justify-between text-sm text-muted"><span>{i.universityCode}</span><span className="capitalize">{i.status}</span></li>)}</ul></div>
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

  </div>;
};
export default EventParticipationPanel;
