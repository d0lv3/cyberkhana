import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal';
import { Clock, Target, Ticket, Users } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { useNow, formatTimeRemaining } from '../../src/hooks/useCompetitionClock';
import CompetitionArt, { CompetitionState, STATE_ACCENT } from './CompetitionArt';
import { formatSpan } from './console/ui';

const stateOf = (event: any, now: number): CompetitionState => {
  if (event.status === 'ended' || (event.hasTimeLimit !== false && event.endTime && Date.parse(event.endTime) <= now)) return 'ended';
  return event.status === 'active' ? 'live' : 'upcoming';
};

/** When the event runs, in the fewest words that answer "can I play yet?". */
const timing = (event: any, state: CompetitionState, now: number) => {
  if (state === 'ended') return event.endTime ? `Ended ${new Date(event.endTime).toLocaleDateString()}` : 'Ended';
  if (state === 'live') return event.hasTimeLimit !== false && event.endTime ? `Ends in ${formatTimeRemaining(event.endTime, now, true)}` : 'Running · no time limit';
  if (event.autoStart && event.startTime && Date.parse(event.startTime) > now) return `Starts in ${formatSpan(Date.parse(event.startTime) - now)}`;
  return 'Starts when the host opens it';
};

const button = 'inline-flex min-h-tap w-full items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

/**
 * A team event on the Competitions page. The same construction as the workshop card beside it,
 * and so as an Academy module card: generated cover art tinted by the event's state, scrims that
 * keep the chips and title legible over it, and the facts at the foot. Registration lives here
 * too, so unlike a workshop card the whole card is only a link once there is somewhere to go.
 */
const EventCard: React.FC<{ event: any; onChange: () => void }> = ({ event, onChange }) => {
  const now = useNow(), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [registering, setRegistering] = useState(false), [teamAction, setTeamAction] = useState<'create' | 'join'>('create');
  const [name, setName] = useState(''), [inviteCode, setInviteCode] = useState('');
  const withdrawOpen = event.canUnregister && now < Date.parse(event.unregisterUntil);
  const remaining = Math.max(0, new Date(event.registrationDeadline).getTime() - now);
  const open = remaining > 0 && event.registrationOpen;
  const full = event.registrationCount >= event.capacity;
  const state = stateOf(event, now), accent = STATE_ACCENT[state];
  const label = state === 'live' ? 'Live' : state === 'ended' ? 'Ended' : open ? 'Registration open' : 'Upcoming';
  const destination = event.canManage ? `/admin/competitions/${event._id}/monitor` : event.registered ? `/competition/${event._id}` : null;
  // Once registered, the second button is Unregister, and only while that is still allowed;
  // after the withdrawal hour the Registered chip says all there is to say.
  const showRegister = !event.canManage && event.canRegister && state !== 'ended' && (event.registered ? withdrawOpen : !destination);

  const act = async () => {
    if (!event.registered && !registering) { setRegistering(true); setError(''); return; }
    setBusy(true); setError('');
    try { if (event.registered) await eventService.unregister(event._id); else await eventService.register(event._id, { teamAction, name, inviteCode }); setRegistering(false); onChange(); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <article className={`group relative flex min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-edge bg-panel transition-all duration-200 ${
      destination ? 'hover:-translate-y-1 hover:border-edge-light hover:shadow-lg hover:shadow-black/40' : ''
    }`}>
      {/* Cover: the art, over a bloom in the state's own colour */}
      <div className="absolute inset-x-0 top-0 h-48 overflow-hidden" aria-hidden>
        <div className="absolute inset-0" style={{ background: `radial-gradient(85% 90% at 50% 30%, ${accent}24 0%, transparent 70%)` }} />
        <CompetitionArt state={state} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.06]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/90 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-panel/80 to-transparent" aria-hidden />

      {/* Top: state, then what kind of event and how big */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-2 p-3.5">
        <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold backdrop-blur-sm"
          style={{ color: accent, borderColor: `${accent}4d`, backgroundColor: `${accent}1a` }}>
          {state === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
          {label}
        </span>
        <span className="flex flex-wrap justify-end gap-1.5">
          {event.registered && (
            <span className="inline-flex items-center gap-1 rounded-md border border-brand/40 bg-brand/15 px-2 py-0.5 text-xs font-semibold text-brand backdrop-blur-sm">
              <Ticket size={11} /> Registered
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-inset/80 px-2 py-0.5 text-xs font-semibold text-muted backdrop-blur-sm">
            <Users size={11} /> Team CTF
          </span>
        </span>
      </div>

      {/* Bottom: title, the facts, and what you can do */}
      <div className="relative z-10 mt-auto space-y-3 p-4 pt-0">
        <div>
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-fg transition-colors group-hover:text-brand-neon">
            {/* With somewhere to go, the title's link stretches over the whole card. */}
            {destination
              ? <Link to={destination} className="after:absolute after:inset-0 after:rounded-2xl focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand/50">{event.name}</Link>
              : event.name}
          </h3>
          {event.description && <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-muted">{event.description}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5"><Clock size={12} /> {timing(event, state, now)}</span>
          {event.challengeCount > 0 && <span className="inline-flex items-center gap-1.5"><Target size={12} /> {event.challengeCount} challenges</span>}
        </div>

        {state !== 'ended' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted"><span className="font-semibold text-fg-soft">{event.registrationCount}</span> / {event.capacity} players · teams of up to 4</span>
              <span className={open ? 'text-brand' : 'text-faint'}>{open ? `Closes in ${formatSpan(remaining)}` : 'Registration closed'}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-inset">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, event.registrationCount / event.capacity * 100)}%`, backgroundColor: accent }} />
            </div>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

        {(destination || showRegister) && (
          // Above the stretched link, so each button keeps its own click. Two buttons share the
          // row equally rather than each sizing to its label.
          <div className={`relative z-20 grid gap-2 ${destination && showRegister ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {destination && (
              <Link to={destination} className={`${button} border-transparent bg-brand-deep text-white hover:bg-brand-press`}>
                {event.canManage ? 'Open console' : 'Open event'}
              </Link>
            )}
            {showRegister && (
              <button type="button" onClick={act}
                disabled={busy || (!event.registered && (!open || full))}
                className={event.registered
                  ? `${button} border-edge bg-inset/60 text-fg-soft hover:border-edge-light`
                  : `${button} border-transparent bg-brand-deep text-white hover:bg-brand-press`}>
                {busy ? 'Saving…' : event.registered ? 'Unregister' : full ? 'Event full' : open ? 'Register' : 'Registration closed'}
              </button>
            )}
          </div>
        )}
        {event.registered && withdrawOpen && (
          <p className="relative z-20 text-xs text-faint">You can unregister for {Math.ceil((Date.parse(event.unregisterUntil) - now) / 60000)} more minutes.</p>
        )}
      </div>

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
    </article>
  );
};

export default EventCard;
