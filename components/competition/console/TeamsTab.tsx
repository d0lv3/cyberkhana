import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Crown, Lock, Plus, Scale, Search, ShieldOff, ShieldCheck, Unlock, UserMinus, Users } from 'lucide-react';
import Modal from '../../ui/Modal';
import { eventService } from '../../../services/eventService';
import { Chip, ConsoleButton, DialogCard, EmptyState, Field, Segmented, formatDateTime, inputClass } from './ui';

type Filter = 'all' | 'open' | 'locked' | 'disqualified';
type Dialog = { kind: 'adjust' | 'member' | 'disqualify'; team: any } | null;

const TeamsTab: React.FC<{
  competition: any;
  rankOf: Map<string, number>;
  focus?: string;
  run: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
  confirm: (message: string, options?: any) => Promise<boolean>;
}> = ({ competition: c, rankOf, focus = '', run, confirm }) => {
  const [search, setSearch] = useState(focus);
  const [filter, setFilter] = useState<Filter>('all');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [amount, setAmount] = useState(''), [reason, setReason] = useState(''), [member, setMember] = useState('');
  const [copied, setCopied] = useState('');
  useEffect(() => { setSearch(focus); }, [focus]);

  const ended = c.status === 'ended';
  const player = (userId: string) => c.registrations.find((r: any) => r.userId === userId);
  const teamless = c.registrations.filter((r: any) => !c.teams.some((t: any) => t.members.includes(r.userId)));
  const counts = {
    all: c.teams.length,
    open: c.teams.filter((t: any) => !t.locked && !t.disqualified).length,
    locked: c.teams.filter((t: any) => t.locked && !t.disqualified).length,
    disqualified: c.teams.filter((t: any) => t.disqualified).length,
  };
  const teams = useMemo(() => c.teams
    .filter((t: any) => filter === 'all' || (filter === 'disqualified' ? t.disqualified : !t.disqualified && (filter === 'locked') === t.locked))
    .filter((t: any) => {
      const q = search.trim().toLowerCase();
      return !q || t.name.toLowerCase().includes(q) || t.members.some((id: string) => player(id)?.username.toLowerCase().includes(q));
    })
    .sort((a: any, b: any) => (rankOf.get(a.id) ?? Infinity) - (rankOf.get(b.id) ?? Infinity) || a.name.localeCompare(b.name)), [c.teams, filter, search, rankOf]);

  const open = (kind: 'adjust' | 'member' | 'disqualify', team: any) => { setAmount(''); setReason(''); setMember(''); setDialog({ kind, team }); };
  const close = () => setDialog(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialog) return;
    const { kind, team } = dialog;
    const done = kind === 'adjust'
      ? await run(() => eventService.adjust(c._id, team.id, Number(amount), reason), `Score adjusted for ${team.name}`)
      : kind === 'member'
        ? await run(() => eventService.addMember(c._id, team.id, member), `Added to ${team.name}`)
        : await run(() => eventService.disqualify(c._id, team.id, reason), `${team.name} disqualified`);
    if (done) close();
  };
  const copy = async (code: string) => {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 1500); } catch { /* the code stays selectable */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-72">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams or players" aria-label="Search teams" className={`${inputClass} pl-9`} />
        </div>
        <div className="scroll-x">
          <Segmented<Filter> label="Filter teams" value={filter} onChange={setFilter} options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'open', label: 'Open roster', count: counts.open },
            { value: 'locked', label: 'Locked', count: counts.locked },
            { value: 'disqualified', label: 'Disqualified', count: counts.disqualified },
          ]} />
        </div>
      </div>

      {teamless.length > 0 && !ended && (
        <p className="rounded-lg border border-amber/25 bg-amber/5 px-3 py-2 text-xs text-amber">
          {teamless.length} registered player{teamless.length === 1 ? ' has' : 's have'} no team and cannot submit flags: {teamless.slice(0, 5).map((r: any) => r.username).join(', ')}{teamless.length > 5 ? '…' : ''}
        </p>
      )}

      {!teams.length ? (
        <div className="rounded-xl border border-edge bg-panel">
          <EmptyState icon={<Users size={20} />} title={c.teams.length ? 'No teams match' : 'No teams yet'}>
            {c.teams.length ? 'Clear the search or pick another filter.' : 'Players create or join a team when they register.'}
          </EmptyState>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {teams.map((team: any) => {
            const rank = rankOf.get(team.id);
            const archived = !team.members.length;
            return (
              <article key={team.id} className={`flex min-w-0 flex-col rounded-xl border bg-panel ${team.disqualified ? 'border-danger/40' : 'border-edge'}`}>
                <header className="flex items-start gap-3 border-b border-edge p-4">
                  <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold tabular-nums ${
                    team.disqualified ? 'border-danger/30 bg-danger/10 text-danger' : 'border-edge bg-inset text-fg'
                  }`}>
                    {team.disqualified ? <ShieldOff size={16} /> : rank ? `#${rank}` : '—'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-fg">{team.name}</h3>
                    <p className="text-xs text-muted">
                      <span className="font-semibold tabular-nums text-fg-soft">{team.disqualified ? '—' : team.score.toLocaleString()}</span> pts · {team.solveCount ?? 0} solved · {team.hints.length} hint{team.hints.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap justify-end gap-1.5">
                    {archived ? <Chip>Archived</Chip> : <Chip tone={team.members.length >= 4 ? 'info' : 'neutral'}>{team.members.length}/4</Chip>}
                    {team.locked
                      ? <Chip title="Rosters lock after the first solve, hint or adjustment"><Lock size={11} /> Locked</Chip>
                      : <Chip tone="good"><Unlock size={11} /> Open</Chip>}
                  </div>
                </header>

                {team.disqualified && (
                  <div className="border-b border-danger/20 bg-danger/5 px-4 py-2.5 text-xs text-danger">
                    <span className="font-semibold">Disqualified</span> {formatDateTime(team.disqualified.at)} — {team.disqualified.reason}
                  </div>
                )}

                <ul className="flex-1 divide-y divide-edge">
                  {team.members.map((userId: string) => {
                    const r = player(userId);
                    return (
                      <li key={userId} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-edge bg-inset text-xs font-bold text-brand">
                          {(r?.username || '?').charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-fg">
                            {r?.username || 'Removed player'}
                            {userId === team.captainId && <Crown size={12} className="flex-shrink-0 text-amber" aria-label="Captain" />}
                          </span>
                          <span className="block text-xs text-faint">{r?.universityCode}</span>
                        </span>
                        {!ended && (
                          <ConsoleButton
                            size="sm"
                            tone="ghost"
                            aria-label={`Remove ${r?.username || 'player'} from ${team.name}`}
                            icon={<UserMinus size={14} />}
                            onClick={async () => {
                              const ok = await confirm(
                                `Remove ${r?.username || 'this player'} from ${team.name}? The team keeps the points they earned, and ${team.locked ? 'they stay locked to this team.' : 'they can join another team.'}`,
                                { type: 'danger', title: 'Remove team member', confirmText: 'Remove', isDestructive: true },
                              );
                              if (ok) await run(() => eventService.removeMember(c._id, team.id, userId), 'Member removed');
                            }}
                          />
                        )}
                      </li>
                    );
                  })}
                  {archived && <li className="px-4 py-3 text-xs text-faint">Every player left. The team stays on the board because it has scoring history.</li>}
                </ul>

                {team.adjustments.length > 0 && (
                  <div className="border-t border-edge px-4 py-2.5">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-dim">Adjustments</p>
                    <ul className="space-y-0.5 text-xs">
                      {team.adjustments.map((a: any, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span className={`w-14 flex-shrink-0 font-semibold tabular-nums ${a.amount > 0 ? 'text-brand' : 'text-danger'}`}>{a.amount > 0 ? '+' : ''}{a.amount}</span>
                          <span className="min-w-0 flex-1 truncate text-muted" title={a.reason}>{a.reason}</span>
                          <span className="flex-shrink-0 text-faint">{formatDateTime(a.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <footer className="flex flex-wrap items-center gap-2 border-t border-edge p-3">
                  <button
                    type="button"
                    onClick={() => copy(team.inviteCode)}
                    className="mr-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-muted transition-colors hover:bg-surface-hover hover:text-fg"
                    title="Copy invite code"
                  >
                    <Copy size={12} /> {copied === team.inviteCode ? 'Copied' : team.inviteCode}
                  </button>
                  <ConsoleButton size="sm" icon={<Scale size={14} />} onClick={() => open('adjust', team)}>Adjust</ConsoleButton>
                  {!ended && !team.disqualified && team.members.length < 4 && (
                    <ConsoleButton size="sm" icon={<Plus size={14} />} onClick={() => open('member', team)} disabled={!teamless.length} title={teamless.length ? undefined : 'Every registered player already has a team'}>Add player</ConsoleButton>
                  )}
                  {team.disqualified ? (
                    <ConsoleButton size="sm" icon={<ShieldCheck size={14} />} onClick={async () => {
                      if (await confirm(`Reinstate ${team.name}? Its solves count again, which can change other teams' first bloods and dynamic points.`, { title: 'Reinstate team', confirmText: 'Reinstate' })) {
                        await run(() => eventService.reinstate(c._id, team.id), `${team.name} reinstated`);
                      }
                    }}>Reinstate</ConsoleButton>
                  ) : (
                    <ConsoleButton size="sm" tone="danger" icon={<ShieldOff size={14} />} onClick={() => open('disqualify', team)}>Disqualify</ConsoleButton>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}

      <Modal isOpen={!!dialog} onClose={close} className="max-w-md">
        {dialog && (
          <form onSubmit={submit}>
            <DialogCard
              title={dialog.kind === 'adjust' ? `Adjust ${dialog.team.name}` : dialog.kind === 'member' ? `Add a player to ${dialog.team.name}` : `Disqualify ${dialog.team.name}`}
              description={dialog.kind === 'adjust'
                ? 'Award or deduct points. The reason is kept in the team’s audit trail, and any adjustment locks the roster.'
                : dialog.kind === 'member'
                  ? 'Only registered players without a team can be added.'
                  : 'The team leaves the rankings and can no longer submit flags or buy hints. Its solves stop counting, so first bloods and dynamic points pass to the next teams. You can reinstate it later.'}
              footer={<>
                <ConsoleButton tone="ghost" onClick={close}>Cancel</ConsoleButton>
                <ConsoleButton type="submit" tone={dialog.kind === 'disqualify' ? 'danger' : 'primary'}>
                  {dialog.kind === 'adjust' ? 'Apply adjustment' : dialog.kind === 'member' ? 'Add player' : 'Disqualify team'}
                </ConsoleButton>
              </>}
            >
              <div className="space-y-4">
                {dialog.kind === 'adjust' && (
                  <Field label="Points" htmlFor="adjust-amount" hint="Use a negative number for a penalty, e.g. -50.">
                    <input id="adjust-amount" autoFocus required type="number" step={1} min={-1000000} max={1000000} className={inputClass} value={amount} onChange={e => setAmount(e.target.value)} />
                  </Field>
                )}
                {dialog.kind === 'member' && (
                  <Field label="Player" htmlFor="add-member">
                    <select id="add-member" autoFocus required className={inputClass} value={member} onChange={e => setMember(e.target.value)}>
                      <option value="">Choose a player</option>
                      {teamless.map((r: any) => <option key={r.userId} value={r.userId}>{r.username} · {r.universityCode}</option>)}
                    </select>
                  </Field>
                )}
                {dialog.kind !== 'member' && (
                  <Field label="Reason" htmlFor="team-reason" hint={dialog.kind === 'disqualify' ? 'Shown to the team’s players.' : undefined}>
                    <textarea id="team-reason" required maxLength={500} rows={3} className={inputClass} value={reason} onChange={e => setReason(e.target.value)}
                      placeholder={dialog.kind === 'adjust' ? 'e.g. Bonus for the best write-up' : 'e.g. Flag sharing with another team'} />
                  </Field>
                )}
              </div>
            </DialogCard>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default TeamsTab;
