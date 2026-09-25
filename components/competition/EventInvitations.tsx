import React, { useCallback, useEffect, useState } from 'react';
import { Check, Mail, X } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { useSocket } from '../../src/contexts/SocketContext';
import { ConsoleButton, formatDateTime } from './console/ui';

/** Invitations from other universities' events, answered by this university's admins. */
export default function EventInvitations({ onChange }: { onChange?: () => void }) {
  const [invitations, setInvitations] = useState<any[]>([]), [error, setError] = useState(''), [busy, setBusy] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { socket } = useSocket();
  const refresh = useCallback(() => { eventService.invitations().then(setInvitations).catch(e => setError(e.message)); }, []);
  useEffect(() => {
    refresh();
    socket?.on('eventInvitation', refresh); socket?.on('connect', refresh);
    return () => { socket?.off('eventInvitation', refresh); socket?.off('connect', refresh); };
  }, [socket, refresh]);
  const respond = async (id: string, status: 'accepted' | 'declined') => {
    setBusy(id); setError('');
    try { await eventService.respond(id, status); refresh(); onChange?.(); } catch (e: any) { setError(e.message); } finally { setBusy(''); }
  };
  if (!invitations.length && !error) return null;
  return (
    <section className="overflow-hidden rounded-xl border border-violet/30 bg-violet/[0.05]" aria-label="Event invitations">
      <header className="flex items-center gap-2 border-b border-violet/20 px-4 py-3">
        <Mail size={16} className="text-violet" />
        <h2 className="text-sm font-semibold text-fg">
          {invitations.length} event invitation{invitations.length === 1 ? '' : 's'} for your university
        </h2>
      </header>
      {error && <p role="alert" className="px-4 pt-3 text-sm text-danger">{error}</p>}
      <ul className="divide-y divide-violet/15">
        {invitations.map(i => (
          <li key={i._id} className="px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-fg">{i.name}</p>
                <p className="text-xs text-muted">
                  Hosted by {i.universityCode} · registration until {formatDateTime(i.registrationDeadline)}
                  {i.startTime && ` · starts ${formatDateTime(i.startTime)}`}
                  {i.capacity && ` · ${i.capacity} seats`}
                </p>
                {i.description && (
                  <button type="button" onClick={() => setExpanded(expanded === i._id ? null : i._id)} className="mt-1 text-xs font-semibold text-violet hover:underline">
                    {expanded === i._id ? 'Hide details' : 'Read the brief'}
                  </button>
                )}
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <ConsoleButton size="sm" tone="ghost" icon={<X size={14} />} disabled={!!busy} onClick={() => respond(i._id, 'declined')}>Decline</ConsoleButton>
                <ConsoleButton size="sm" tone="primary" icon={<Check size={14} />} disabled={!!busy} onClick={() => respond(i._id, 'accepted')}>Accept</ConsoleButton>
              </div>
            </div>
            {expanded === i._id && <p className="mt-2 whitespace-pre-wrap rounded-lg border border-edge bg-inset p-3 text-sm text-fg-soft">{i.description}</p>}
          </li>
        ))}
      </ul>
      <p className="border-t border-violet/15 px-4 py-2 text-xs text-faint">Accepting lets your students register. It does not give you control over the event.</p>
    </section>
  );
}
