import React, { useCallback, useEffect, useState } from 'react';
import { eventService } from '../../services/eventService';
import { useSocket } from '../../src/contexts/SocketContext';

export default function EventInvitations({ onChange }: { onChange?: () => void }) {
  const [invitations, setInvitations] = useState<any[]>([]), [error, setError] = useState(''), [busy, setBusy] = useState('');
  const { socket } = useSocket();
  const refresh = useCallback(() => { eventService.invitations().then(setInvitations).catch(e => setError(e.message)); }, []);
  useEffect(() => { refresh(); socket?.on('eventInvitation', refresh); socket?.on('connect', refresh); return () => { socket?.off('eventInvitation', refresh); socket?.off('connect', refresh); }; }, [socket, refresh]);
  const respond = async (id: string, status: 'accepted' | 'declined') => {
    setBusy(id); setError('');
    try { await eventService.respond(id, status); refresh(); onChange?.(); } catch(e: any) { setError(e.message); } finally { setBusy(''); }
  };
  if (!invitations.length && !error) return null;
  return <section className="rounded-xl border border-indigo-400/30 bg-indigo-500/5 p-5 space-y-4">
    <h2 className="text-lg font-bold text-fg">University event invitations</h2>
    {error && <p role="alert" className="text-red-400">{error}</p>}
    {invitations.map(i => <div key={i._id} className="flex flex-wrap justify-between items-center gap-3"><div><p className="font-semibold text-fg">{i.name}</p><p className="text-xs text-muted">Hosted by {i.universityCode} · Registration until {new Date(i.registrationDeadline).toLocaleString()}</p></div><div className="flex gap-2">
      <button disabled={!!busy} onClick={() => respond(i._id, 'accepted')} className="rounded bg-indigo-500 px-3 py-2 text-white disabled:opacity-40">Accept</button>
      <button disabled={!!busy} onClick={() => respond(i._id, 'declined')} className="rounded border border-edge px-3 py-2 text-muted disabled:opacity-40">Decline</button>
    </div></div>)}
  </section>;
}
