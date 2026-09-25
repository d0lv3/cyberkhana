import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal';
import { Users, Calendar, Ticket } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { useNow } from '../../src/hooks/useCompetitionClock';

const EventCard: React.FC<{ event: any; onChange: () => void }> = ({ event, onChange }) => {
  const now = useNow(), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [registering, setRegistering] = useState(false), [teamAction, setTeamAction] = useState<'create' | 'join'>('create');
  const [name, setName] = useState(''), [inviteCode, setInviteCode] = useState('');
  const withdrawOpen = event.canUnregister && now < Date.parse(event.unregisterUntil);
  const remaining = Math.max(0, new Date(event.registrationDeadline).getTime() - now);
  const open = remaining > 0 && event.registrationOpen;
  const act = async () => {
    if (!event.registered && !registering) { setRegistering(true); setError(''); return; }
    setBusy(true); setError('');
    try { if (event.registered) await eventService.unregister(event._id); else await eventService.register(event._id, { teamAction, name, inviteCode }); setRegistering(false); onChange(); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  return <article className="rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 to-panel p-5 flex flex-col gap-4">
    <div className="flex justify-between items-center"><span className="text-xs uppercase tracking-widest text-indigo-300 flex gap-2 items-center"><Ticket size={16} /> Team event</span><span className="text-xs text-muted capitalize">{event.status}</span></div>
    <h3 className="text-xl font-bold text-fg">{event.name}</h3>
    {event.description && <p className="line-clamp-2 whitespace-pre-line text-sm text-muted">{event.description}</p>}
    <div className="space-y-2 text-sm text-muted"><p className="flex gap-2 items-center"><Users size={16} /> {event.registrationCount} / {event.capacity} registered · Teams up to 4</p>
      <p className="flex gap-2 items-center"><Calendar size={16} /> {open ? `Registration closes in ${Math.floor(remaining / 86400000)}d ${Math.floor(remaining / 3600000) % 24}h ${Math.floor(remaining / 60000) % 60}m` : 'Registration closed'}</p>
      <p className="text-xs">{new Date(event.registrationDeadline).toLocaleString()}</p>
      {event.status === 'pending' && event.autoStart && event.startTime && <p className="text-xs">Starts {new Date(event.startTime).toLocaleString()}{event.challengeCount ? ` · ${event.challengeCount} challenges` : ''}</p>}</div>
    <div className="h-1.5 rounded bg-inset overflow-hidden"><div className="h-full bg-indigo-400" style={{ width: `${Math.min(100, event.registrationCount / event.capacity * 100)}%` }} /></div>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <div className="flex flex-wrap gap-3 mt-auto">
      {(event.registered || event.canManage) && <Link to={event.canManage ? `/admin/competitions/${event._id}/monitor` : `/competition/${event._id}`} className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white">{event.canManage ? 'Open console' : 'Registered · Open event'}</Link>}
      {!event.canManage && event.canRegister && <button onClick={act} disabled={busy || (event.registered ? !withdrawOpen : !open || event.registrationCount >= event.capacity)} className="rounded-lg border border-indigo-400/40 px-4 py-2 text-sm text-indigo-200 disabled:opacity-40">{busy ? 'Saving…' : event.registered ? (withdrawOpen ? 'Unregister' : 'Registration locked') : event.registrationCount >= event.capacity ? 'Event full' : 'Register'}</button>}
    </div>
    {event.registered && <p className="text-xs text-muted">{withdrawOpen ? `You can unregister for ${Math.ceil((Date.parse(event.unregisterUntil) - now) / 60000)} more minutes.` : 'The one-hour withdrawal window has closed.'}</p>}
    <Modal isOpen={registering} onClose={() => { if (!busy) setRegistering(false); }} title="Register for event">
      <form className="rounded-2xl border border-edge bg-panel p-6 space-y-4 text-fg" onSubmit={e => { e.preventDefault(); void act(); }}>
        <h2 className="text-xl font-bold">Register for {event.name}</h2>
        <p className="text-sm text-muted">Choose your team now. You can unregister during the first hour after registration.</p>
        <fieldset className="flex gap-4"><legend className="mb-2 text-sm">Team membership</legend>
          <label><input type="radio" name="team-action" checked={teamAction === 'create'} onChange={() => setTeamAction('create')} /> Create a team</label>
          <label><input type="radio" name="team-action" checked={teamAction === 'join'} onChange={() => setTeamAction('join')} /> Join a team</label>
        </fieldset>
        {teamAction === 'create' ? <label className="block">Team name<input autoFocus required maxLength={60} className="mt-2 w-full rounded-lg border border-edge bg-inset p-3" value={name} onChange={e => setName(e.target.value)} /></label> : <label className="block">Team invite code<input autoFocus required maxLength={30} className="mt-2 w-full rounded-lg border border-edge bg-inset p-3" value={inviteCode} onChange={e => setInviteCode(e.target.value)} /></label>}
        {error && <p role="alert" className="text-red-400">{error}</p>}
        <button disabled={busy} className="rounded-lg bg-brand-deep px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Registering…' : teamAction === 'create' ? 'Register and create team' : 'Register and join team'}</button>
      </form>
    </Modal>
  </article>;
}

export default EventCard;
