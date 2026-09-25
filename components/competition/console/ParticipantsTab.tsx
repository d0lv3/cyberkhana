import React, { useMemo, useState } from 'react';
import { Building2, Mail, Search, UserMinus, UserPlus, Users } from 'lucide-react';
import Modal from '../../ui/Modal';
import { eventService } from '../../../services/eventService';
import { Chip, ConsoleButton, DialogCard, EmptyState, Panel, Segmented, formatDateTime, inputClass } from './ui';

const INVITE_TONE = { accepted: 'good', pending: 'warn', declined: 'bad' } as const;

const ParticipantsTab: React.FC<{
  competition: any;
  universities: Array<{ code: string; name: string }>;
  now: number;
  run: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
  confirm: (message: string, options?: any) => Promise<boolean>;
}> = ({ competition: c, universities, now, run, confirm }) => {
  const [search, setSearch] = useState(''), [filter, setFilter] = useState<'all' | 'teamless'>('all');
  const [lookup, setLookup] = useState(''), [candidates, setCandidates] = useState<any[] | null>(null), [lookupError, setLookupError] = useState('');
  const [inviting, setInviting] = useState(false), [selected, setSelected] = useState<string[]>([]), [inviteSearch, setInviteSearch] = useState('');

  const ended = c.status === 'ended';
  const nameOf = (code: string) => universities.find(u => u.code === code)?.name || code;
  const teamOf = (userId: string) => c.teams.find((t: any) => t.members.includes(userId));
  const full = c.registrationCount >= c.capacity;
  const deadline = Date.parse(c.registrationDeadline);
  const perUniversity = c.registrations.reduce((map: Record<string, number>, r: any) => ({ ...map, [r.universityCode]: (map[r.universityCode] || 0) + 1 }), {});
  const registrations = useMemo(() => c.registrations
    .filter((r: any) => filter === 'all' || !teamOf(r.userId))
    .filter((r: any) => `${r.username} ${r.universityCode} ${teamOf(r.userId)?.name || ''}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a: any, b: any) => Date.parse(b.registeredAt) - Date.parse(a.registeredAt)), [c.registrations, c.teams, filter, search]);
  const invitable = universities.filter(u => !c.invitations.some((i: any) => i.universityCode === u.code)
    && `${u.name} ${u.code}`.toLowerCase().includes(inviteSearch.trim().toLowerCase()));

  const find = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    try { setCandidates(await eventService.candidates(c._id, lookup)); } catch (err: any) { setLookupError(err.message); }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <Panel title={`Registered players · ${c.registrationCount}`} icon={<Users size={16} />} bodyClassName="">
          <div className="space-y-3 border-b border-edge px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="text-fg-soft"><span className="font-bold tabular-nums text-fg">{c.registrationCount}</span> of {c.capacity} seats taken</span>
              <span className={`text-xs ${c.registrationOpen ? 'text-brand' : 'text-faint'}`}>
                {ended ? 'Event ended' : c.registrationOpen ? `Registration open until ${formatDateTime(c.registrationDeadline)}` : deadline <= now ? `Registration closed ${formatDateTime(c.registrationDeadline)}` : 'Registration closed'}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-inset">
              <div className={`h-full rounded-full ${full ? 'bg-amber' : 'bg-brand'}`} style={{ width: `${Math.min(100, (c.registrationCount / c.capacity) * 100)}%` }} />
            </div>
          </div>

          {!ended && (
            <div className="border-b border-edge px-4 py-4">
              <form onSubmit={find} className="flex flex-col gap-2 sm:flex-row">
                <input aria-label="Find a student by username" required minLength={2} placeholder="Find a student by username" className={inputClass} value={lookup} onChange={e => setLookup(e.target.value)} />
                <ConsoleButton type="submit" icon={<UserPlus size={15} />} disabled={full}>Find to add</ConsoleButton>
              </form>
              <p className="mt-2 text-xs text-faint">
                Hosts can add students from accepted universities even after the deadline, up to capacity. Added players still need a team before they can submit.
              </p>
              {lookupError && <p role="alert" className="mt-2 text-xs text-danger">{lookupError}</p>}
              {candidates && (
                <ul className="mt-3 divide-y divide-edge rounded-lg border border-edge">
                  {candidates.length ? candidates.map(u => {
                    const already = c.registrations.some((r: any) => r.userId === u._id);
                    return (
                      <li key={u._id} className="flex items-center gap-3 px-3 py-2">
                        <span className="min-w-0 flex-1 truncate text-sm text-fg">{u.username} <span className="text-xs text-faint">· {u.universityCode}</span></span>
                        {already ? <Chip>Registered</Chip> : (
                          <ConsoleButton size="sm" tone="primary" disabled={full} onClick={() => run(() => eventService.addParticipant(c._id, u._id), `${u.username} registered`)}>Add</ConsoleButton>
                        )}
                      </li>
                    );
                  }) : <li className="px-3 py-3 text-sm text-faint">No students from accepted universities match “{lookup}”.</li>}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-64">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter players" aria-label="Filter registered players" className={`${inputClass} pl-9`} />
            </div>
            <Segmented label="Show" value={filter} onChange={setFilter} options={[
              { value: 'all', label: 'Everyone', count: c.registrations.length },
              { value: 'teamless', label: 'Without a team', count: c.registrations.filter((r: any) => !teamOf(r.userId)).length },
            ]} />
          </div>

          {registrations.length ? (
            <div className="overflow-x-auto border-t border-edge">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-edge text-left text-xs text-dim">
                    <th scope="col" className="px-4 py-2.5 font-medium">Player</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">University</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Team</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Registered</th>
                    <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {registrations.map((r: any) => {
                    const team = teamOf(r.userId);
                    return (
                      <tr key={r.userId}>
                        <td className="px-4 py-2.5 font-semibold text-fg">{r.username}</td>
                        <td className="px-4 py-2.5 text-muted" title={nameOf(r.universityCode)}>{r.universityCode}</td>
                        <td className="px-4 py-2.5">{team ? <span className="text-fg-soft">{team.name}</span> : <Chip tone="warn">No team</Chip>}</td>
                        <td className="px-4 py-2.5 text-xs text-faint">{formatDateTime(r.registeredAt)}</td>
                        <td className="px-4 py-2.5 text-right">
                          {!ended && (
                            <ConsoleButton size="sm" tone="ghost" icon={<UserMinus size={14} />} onClick={async () => {
                              const ok = await confirm(`Remove ${r.username} from the event? They lose access immediately. Points they earned stay with ${team ? team.name : 'their team'}.`,
                                { type: 'danger', title: 'Remove participant', confirmText: 'Remove', isDestructive: true });
                              if (ok) await run(() => eventService.removeParticipant(c._id, r.userId), `${r.username} removed`);
                            }}>Remove</ConsoleButton>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border-t border-edge">
              <EmptyState icon={<Users size={20} />} title={c.registrations.length ? 'No players match' : 'No one has registered yet'}>
                {c.registrations.length ? 'Clear the filter to see everyone.' : 'Students from accepted universities register from their Competitions page.'}
              </EmptyState>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Universities"
        icon={<Building2 size={16} />}
        actions={!ended && <ConsoleButton size="sm" icon={<Mail size={14} />} onClick={() => { setSelected([]); setInviteSearch(''); setInviting(true); }}>Invite</ConsoleButton>}
        bodyClassName="p-2"
      >
        <ul>
          {c.invitations.map((i: any) => (
            <li key={i.universityCode} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-edge bg-inset font-mono text-[10px] font-bold text-muted">
                {i.universityCode.slice(0, 4)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-fg" title={nameOf(i.universityCode)}>{nameOf(i.universityCode)}</span>
                <span className="block text-xs text-faint">{perUniversity[i.universityCode] || 0} registered</span>
              </span>
              {i.universityCode === c.universityCode ? <Chip tone="info">Host</Chip> : <Chip tone={INVITE_TONE[i.status as keyof typeof INVITE_TONE]} className="capitalize">{i.status}</Chip>}
              {i.status !== 'accepted' && !ended && (
                <ConsoleButton size="sm" tone="ghost" aria-label={`Withdraw invitation to ${nameOf(i.universityCode)}`} onClick={async () => {
                  if (await confirm(`Withdraw the invitation to ${nameOf(i.universityCode)}?`, { title: 'Withdraw invitation', confirmText: 'Withdraw' })) {
                    await run(() => eventService.updateSettings(c._id, { revoke: [i.universityCode] }), 'Invitation withdrawn');
                  }
                }}>Withdraw</ConsoleButton>
              )}
            </li>
          ))}
        </ul>
        <p className="px-2 pb-2 pt-1 text-xs text-faint">
          Students can register once their university admin accepts. Teams may mix students from any accepted university.
        </p>
      </Panel>

      <Modal isOpen={inviting} onClose={() => setInviting(false)} className="max-w-lg">
        <DialogCard
          title="Invite universities"
          description="Their admins see the invitation on the Competitions page and accept or decline for their students."
          footer={<>
            <ConsoleButton tone="ghost" onClick={() => setInviting(false)}>Cancel</ConsoleButton>
            <ConsoleButton tone="primary" disabled={!selected.length} onClick={async () => {
              if (await run(() => eventService.updateSettings(c._id, { invite: selected }), `Invited ${selected.length} universit${selected.length === 1 ? 'y' : 'ies'}`)) setInviting(false);
            }}>Send {selected.length || ''} invitation{selected.length === 1 ? '' : 's'}</ConsoleButton>
          </>}
        >
          <input autoFocus value={inviteSearch} onChange={e => setInviteSearch(e.target.value)} placeholder="Search universities" aria-label="Search universities" className={`${inputClass} mb-3`} />
          {invitable.length ? (
            <ul className="space-y-1">
              {invitable.map(u => (
                <li key={u.code}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-hover">
                    <input type="checkbox" className="h-4 w-4 accent-[#00a859]" checked={selected.includes(u.code)}
                      onChange={e => setSelected(prev => e.target.checked ? [...prev, u.code] : prev.filter(code => code !== u.code))} />
                    <span className="min-w-0 flex-1 truncate text-sm text-fg">{u.name}</span>
                    <span className="font-mono text-xs text-faint">{u.code}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-faint">Every university is already invited.</p>}
        </DialogCard>
      </Modal>
    </div>
  );
};

export default ParticipantsTab;
