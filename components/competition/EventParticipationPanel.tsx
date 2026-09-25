import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Copy, Crown, FileText, Lock, LogOut, ShieldOff, Users } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { ConsoleButton, Eyebrow, inputClass } from './console/ui';

/**
 * The event's team area on its dashboard. Players see their team (or create /
 * join one); the host gets a pointer to the console, where rosters are managed.
 */
const EventParticipationPanel: React.FC<{ event: any; onChange: () => Promise<any> | void }> = ({ event, onChange }) => {
  const id = event._id, team = event.team;
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const [teamName, setTeamName] = useState(''), [code, setCode] = useState('');
  const act = async (action: () => Promise<any>, message: string) => {
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(message); await onChange(); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  const ended = event.status === 'ended';

  const brief = event.description ? (
    <details className="group rounded-xl border border-edge bg-panel">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 text-sm font-semibold text-fg">
        <FileText size={16} className="text-muted" /> Event brief & rules
        <span className="ml-auto text-xs font-normal text-faint group-open:hidden">Show</span>
      </summary>
      <p className="whitespace-pre-wrap border-t border-edge px-5 py-4 text-sm leading-relaxed text-fg-soft">{event.description}</p>
    </details>
  ) : null;

  if (event.canManage) {
    return (
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 rounded-xl border border-violet/30 bg-violet/[0.05] px-5 py-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-fg-soft">
            <span className="font-semibold text-fg">You are hosting this event.</span> Teams, participants, announcements and settings live in the event console.
          </p>
          <Link to={`/admin/competitions/${id}/monitor`} className="inline-flex items-center gap-1.5 self-start rounded-lg bg-brand-deep px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-press sm:self-auto">
            Open console <ArrowRight size={15} />
          </Link>
        </div>
        {brief}
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {team?.disqualified && (
        <div role="alert" className="flex gap-3 rounded-xl border border-danger/40 bg-danger/10 px-5 py-4 text-sm">
          <ShieldOff size={18} className="mt-0.5 flex-shrink-0 text-danger" />
          <p className="text-fg-soft">
            <span className="font-semibold text-danger">Your team has been disqualified.</span> {team.disqualified.reason}
            <span className="block text-xs text-muted">You can no longer submit flags or buy hints. Contact the organizers if you think this is a mistake.</span>
          </p>
        </div>
      )}

      <section className="rounded-xl border border-edge bg-panel">
        {team ? (
          <>
            <div className="flex flex-col gap-4 border-b border-edge px-5 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <Eyebrow>Your team</Eyebrow>
                <h2 className="truncate text-xl font-bold text-fg">{team.name}</h2>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tabular-nums text-fg">{team.score.toLocaleString()}</span>
                <span className="text-xs text-faint">pts</span>
              </div>
            </div>
            <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <ul className="grid gap-2 sm:grid-cols-2">
                {team.members.filter(Boolean).map((member: any) => (
                  <li key={member.userId} className="flex items-center gap-3 rounded-lg border border-edge bg-inset px-3 py-2">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold text-brand">{member.username.charAt(0).toUpperCase()}</span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-fg">
                        {member.username}{member.userId === team.captainId && <Crown size={12} className="text-amber" aria-label="Captain" />}
                      </span>
                      <span className="block text-xs text-faint">{member.universityCode}</span>
                    </span>
                  </li>
                ))}
                {Array.from({ length: Math.max(0, 4 - team.members.filter(Boolean).length) }, (_, i) => (
                  <li key={`open-${i}`} className="flex items-center gap-3 rounded-lg border border-dashed border-edge px-3 py-2 text-xs text-faint">
                    <Users size={14} /> {team.locked ? 'Roster locked' : 'Open seat'}
                  </li>
                ))}
              </ul>
              <div className="space-y-3">
                {!team.locked && team.members.length < 4 && !ended ? (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-fg-soft">Invite code</p>
                    <div className="flex gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-lg border border-edge bg-inset px-3 py-2 font-mono text-sm tracking-wider text-fg">{team.inviteCode}</code>
                      <ConsoleButton aria-label="Copy invite code" icon={<Copy size={15} />} onClick={async () => {
                        try { await navigator.clipboard.writeText(team.inviteCode); setNotice('Invite code copied'); } catch { setError('Could not copy. Select the code and copy it.'); }
                      }} />
                    </div>
                    <p className="mt-1.5 text-xs text-faint">Teammates enter it when they register.</p>
                  </div>
                ) : (
                  <p className="flex gap-2 text-xs text-muted">
                    <Lock size={14} className="flex-shrink-0" />
                    {team.locked ? 'The roster locked with your first solve, hint or score adjustment.' : ended ? 'The event has ended.' : 'Your team is full.'}
                  </p>
                )}
                <p className="text-xs text-faint">Solves and hints are shared by the whole team.</p>
                {!team.locked && !ended && (
                  <ConsoleButton size="sm" tone="ghost" icon={<LogOut size={14} />} disabled={busy} onClick={() => act(() => eventService.leaveTeam(id), 'You left the team')}>
                    Leave team
                  </ConsoleButton>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="px-5 py-4">
            <Eyebrow>Team</Eyebrow>
            <h2 className="mb-1 text-lg font-bold text-fg">Create or join a team</h2>
            <p className="mb-4 text-sm text-muted">You need a team to submit flags. Teams hold up to four players.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <form className="space-y-2" onSubmit={e => { e.preventDefault(); void act(() => eventService.createTeam(id, teamName), 'Team created'); }}>
                <label className="block text-xs font-semibold text-fg-soft" htmlFor="team-name">New team name</label>
                <div className="flex gap-2">
                  <input id="team-name" required maxLength={60} className={inputClass} value={teamName} onChange={e => setTeamName(e.target.value)} />
                  <ConsoleButton type="submit" tone="primary" disabled={busy || ended}>Create</ConsoleButton>
                </div>
              </form>
              <form className="space-y-2" onSubmit={e => { e.preventDefault(); void act(() => eventService.joinTeam(id, code), 'Joined team'); }}>
                <label className="block text-xs font-semibold text-fg-soft" htmlFor="invite-code">Invite code from a teammate</label>
                <div className="flex gap-2">
                  <input id="invite-code" required maxLength={30} className={`${inputClass} font-mono uppercase`} value={code} onChange={e => setCode(e.target.value)} />
                  <ConsoleButton type="submit" disabled={busy || ended}>Join</ConsoleButton>
                </div>
              </form>
            </div>
          </div>
        )}
        {(error || notice) && (
          <p role={error ? 'alert' : 'status'} className={`border-t border-edge px-5 py-2.5 text-sm ${error ? 'text-danger' : 'text-brand'}`}>{error || notice}</p>
        )}
      </section>

      {brief}
    </div>
  );
};

export default EventParticipationPanel;
