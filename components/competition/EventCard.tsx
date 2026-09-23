import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Ticket } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { useNow } from '../../src/hooks/useCompetitionClock';

const EventCard: React.FC<{ event: any; onChange: () => void }> = ({ event, onChange }) => {
  const now = useNow(), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const remaining = Math.max(0, new Date(event.registrationDeadline).getTime() - now);
  const open = remaining > 0 && event.registrationOpen;
  const act = async () => {
    setBusy(true); setError('');
    try { if (event.registered) await eventService.unregister(event._id); else await eventService.register(event._id); onChange(); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  return <article className="rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 to-panel p-5 flex flex-col gap-4">
    <div className="flex justify-between items-center"><span className="text-xs uppercase tracking-widest text-indigo-300 flex gap-2 items-center"><Ticket size={16} /> Team event</span><span className="text-xs text-muted capitalize">{event.status}</span></div>
    <h3 className="text-xl font-bold text-fg">{event.name}</h3>
    <div className="space-y-2 text-sm text-muted"><p className="flex gap-2 items-center"><Users size={16} /> {event.registrationCount} / {event.capacity} registered · Teams up to 4</p>
      <p className="flex gap-2 items-center"><Calendar size={16} /> {open ? `Registration closes in ${Math.floor(remaining / 86400000)}d ${Math.floor(remaining / 3600000) % 24}h ${Math.floor(remaining / 60000) % 60}m` : 'Registration closed'}</p>
      <p className="text-xs">{new Date(event.registrationDeadline).toLocaleString()}</p></div>
    <div className="h-1.5 rounded bg-inset overflow-hidden"><div className="h-full bg-indigo-400" style={{ width: `${Math.min(100, event.registrationCount / event.capacity * 100)}%` }} /></div>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <div className="flex flex-wrap gap-3 mt-auto">
      {(event.registered || event.canManage) && <Link to={`/events/${event._id}`} className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white">{event.canManage ? 'Manage event' : 'Registered · Open event'}</Link>}
      {!event.canManage && event.canRegister && <button onClick={act} disabled={busy || !open || (!event.registered && event.registrationCount >= event.capacity)} className="rounded-lg border border-indigo-400/40 px-4 py-2 text-sm text-indigo-200 disabled:opacity-40">{busy ? 'Saving…' : event.registered ? 'Unregister' : event.registrationCount >= event.capacity ? 'Event full' : 'Register'}</button>}
    </div>
  </article>;
}

export default EventCard;
