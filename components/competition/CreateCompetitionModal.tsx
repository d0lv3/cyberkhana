import React, { useEffect, useState } from 'react';
import { Flag, GraduationCap, RefreshCw } from 'lucide-react';
import Modal from '../ui/Modal';
import { competitionService } from '../../services/competitionService';
import { ConsoleButton, DialogCard, Eyebrow, Field, Segmented, inputClass } from './console/ui';

type Format = 'event' | 'workshop';
type Ending = 'window' | 'duration' | 'none';

/**
 * Math.random() is not unguessable, and this is the only gate on a private
 * competition. crypto.getRandomValues is, and costs nothing here.
 */
const generateSecurityCode = (length = 8) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alikes: I, O, 0, 1
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
};

// `datetime-local` speaks local time; `new Date(local)` reads it back as local too.
const iso = (local: string) => new Date(local).toISOString();

const FORMATS: Array<{ value: Format; title: string; icon: React.ReactNode; body: string }> = [
  { value: 'event', title: 'CTF event', icon: <Flag size={18} />,
    body: 'Teams of up to four register ahead of time, across any universities you invite. Team scoreboard, first bloods and dynamic scoring.' },
  { value: 'workshop', title: 'Workshop', icon: <GraduationCap size={18} />,
    body: 'Students join on their own with a security code. Best for a class or lab session at one or two universities.' },
];

const blank = (hostCode: string) => ({
  name: '', description: '', hostCode, partnerCode: '', invited: [] as string[], inviteSearch: '',
  requiresCode: true, securityCode: generateSecurityCode(),
  deadline: '', capacity: '100',
  autoStart: true, start: '', ending: 'window' as Ending, end: '', duration: '120',
});

const CreateCompetitionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreated: (competition: any) => void;
  universities: Array<{ _id?: string; code: string; name: string }>;
  currentUser: any;
}> = ({ isOpen, onClose, onCreated, universities, currentUser }) => {
  const superAdmin = currentUser?.role === 'super-admin';
  const [format, setFormat] = useState<Format>('event');
  const [form, setForm] = useState(() => blank(currentUser?.universityCode || ''));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => { setError(''); setForm(prev => ({ ...prev, [key]: value })); };

  useEffect(() => {
    if (!isOpen) return;
    setFormat('event'); setError(''); setForm(blank(currentUser?.universityCode || ''));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const host = (superAdmin ? form.hostCode : currentUser?.universityCode || '').trim().toUpperCase();
  const others = universities.filter(u => u.code !== host);
  const invitable = others.filter(u => `${u.name} ${u.code}`.toLowerCase().includes(form.inviteSearch.trim().toLowerCase()));
  const isEvent = format === 'event';
  const autoStart = isEvent && form.autoStart;
  const needsStart = autoStart || (!isEvent && form.ending === 'window');

  /** Mirrors the server's rules so mistakes surface next to the form, not as a failed request. */
  const problem = (): string | null => {
    if (!form.name.trim()) return 'Give the competition a name.';
    if (!host) return 'Choose the host university.';
    const start = form.start ? Date.parse(form.start) : null, end = form.end ? Date.parse(form.end) : null;
    if (isEvent) {
      if (!form.deadline) return 'Set when registration closes.';
      if (Date.parse(form.deadline) <= Date.now()) return 'Registration must close in the future.';
      const capacity = Number(form.capacity);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000) return 'Capacity must be between 1 and 10,000 players.';
      if (autoStart && (!start || start <= Date.now())) return 'The automatic start must be in the future.';
      if (form.ending === 'window' && end && end <= Date.parse(form.deadline)) return 'The event must close after registration does.';
    }
    if (needsStart && !start) return 'Set a start time.';
    if (form.ending === 'window') {
      if (!end) return 'Set when the competition closes.';
      if (start && end <= start) return 'The competition must close after it starts.';
    }
    if (form.ending === 'duration' && !(Number(form.duration) > 0)) return 'Set a duration in minutes.';
    if (!isEvent && form.requiresCode && !form.securityCode.trim()) return 'Set a security code, or make the workshop open.';
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const issue = problem();
    if (issue) { setError(issue); return; }
    setBusy(true); setError('');
    try {
      const timed = form.ending !== 'none';
      const created = await competitionService.createCompetition(isEvent ? {
        type: 'event',
        name: form.name.trim(),
        description: form.description.trim(),
        universityCode: host,
        universityCodes: [host, ...form.invited],
        registrationDeadline: iso(form.deadline),
        capacity: Number(form.capacity),
        hasTimeLimit: timed,
        autoStart,
        ...(autoStart ? { startTime: iso(form.start) } : {}),
        ...(form.ending === 'window' ? { endTime: iso(form.end) } : {}),
        ...(form.ending === 'duration' ? { duration: Number(form.duration) } : {}),
      } : {
        type: 'workshop',
        name: form.name.trim(),
        securityCode: form.requiresCode ? form.securityCode.trim() : undefined,
        requiresSecurityCode: form.requiresCode,
        universityCode: host,
        universityCodes: [host, form.partnerCode].filter(Boolean),
        hasTimeLimit: timed,
        // A timer workshop stamps its real window when it is started.
        startTime: form.ending === 'window' ? iso(form.start) : new Date().toISOString(),
        endTime: form.ending === 'window' ? iso(form.end) : undefined,
        duration: form.ending === 'duration' ? Number(form.duration) : 0,
      });
      onCreated(created);
    } catch (err: any) {
      setError(err.message || 'Could not create the competition.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !busy && onClose()} className="max-w-3xl">
      <form onSubmit={submit} noValidate>
        <DialogCard
          title="New competition"
          description="Pick a format, then fill in the details. Challenges are added afterwards from the competition console."
          footer={<>
            {error && <p role="alert" className="mr-auto self-center text-sm text-danger">{error}</p>}
            <ConsoleButton tone="ghost" onClick={onClose} disabled={busy}>Cancel</ConsoleButton>
            <ConsoleButton type="submit" tone="primary" disabled={busy}>{busy ? 'Creating…' : isEvent ? 'Create event' : 'Create workshop'}</ConsoleButton>
          </>}
        >
          <div className="space-y-7">
            <div role="radiogroup" aria-label="Format" className="grid gap-3 sm:grid-cols-2">
              {FORMATS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  role="radio"
                  aria-checked={format === f.value}
                  onClick={() => setFormat(f.value)}
                  className={`flex gap-3 rounded-xl border p-4 text-left transition-colors ${
                    format === f.value ? 'border-brand bg-brand/[0.07]' : 'border-edge bg-inset hover:border-edge-light'
                  }`}
                >
                  <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${format === f.value ? 'bg-brand/15 text-brand' : 'bg-surface text-muted'}`}>{f.icon}</span>
                  <span>
                    <span className="block font-bold text-fg">{f.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">{f.body}</span>
                  </span>
                </button>
              ))}
            </div>

            <section className="space-y-4">
              <Eyebrow>Details</Eyebrow>
              <Field label="Name" htmlFor="new-name">
                <input id="new-name" autoFocus maxLength={120} className={inputClass} value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder={isEvent ? 'e.g. Spring Inter-University CTF' : 'e.g. Week 4 — Web lab'} />
              </Field>
              {isEvent && (
                <Field label="Description & rules" htmlFor="new-description" hint="Invited universities read this before registering. You can edit it later.">
                  <textarea id="new-description" rows={4} maxLength={5000} className={inputClass} value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder={'Format, prizes and rules — e.g. flag format CK{...}, no attacking the platform, no sharing flags between teams.'} />
                </Field>
              )}
            </section>

            <section className="space-y-4">
              <Eyebrow>Universities</Eyebrow>
              {superAdmin ? (
                <Field label="Host university" htmlFor="new-host">
                  <select id="new-host" className={inputClass} value={form.hostCode}
                    onChange={e => setForm(prev => ({ ...prev, hostCode: e.target.value, partnerCode: '', invited: prev.invited.filter(code => code !== e.target.value) }))}>
                    <option value="">Choose a university</option>
                    {universities.map(u => <option key={u.code} value={u.code}>{u.name} ({u.code})</option>)}
                  </select>
                </Field>
              ) : (
                <p className="text-sm text-muted">Hosted by <span className="font-semibold text-fg">{universities.find(u => u.code === host)?.name || host}</span></p>
              )}
              {isEvent ? (
                <Field label={`Invite universities${form.invited.length ? ` · ${form.invited.length} selected` : ''}`} hint="Each university’s admin accepts before its students can register. You can invite more later.">
                  <input value={form.inviteSearch} onChange={e => set('inviteSearch', e.target.value)} placeholder="Search universities" aria-label="Search universities to invite" className={`${inputClass} mb-2`} />
                  <ul className="max-h-44 space-y-0.5 overflow-y-auto rounded-lg border border-edge bg-inset p-1 custom-scrollbar">
                    {invitable.length ? invitable.map(u => (
                      <li key={u.code}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-hover">
                          <input type="checkbox" className="h-4 w-4 accent-[#00a859]" checked={form.invited.includes(u.code)}
                            onChange={e => set('invited', e.target.checked ? [...form.invited, u.code] : form.invited.filter(code => code !== u.code))} />
                          <span className="min-w-0 flex-1 truncate text-sm text-fg">{u.name}</span>
                          <span className="font-mono text-xs text-faint">{u.code}</span>
                        </label>
                      </li>
                    )) : <li className="px-2 py-3 text-center text-xs text-faint">{others.length ? 'No universities match' : 'No other universities on the platform yet'}</li>}
                  </ul>
                </Field>
              ) : (
                <Field label="Partner university (optional)" htmlFor="new-partner" hint="Leave empty for a single-university workshop.">
                  <select id="new-partner" className={inputClass} value={form.partnerCode} onChange={e => set('partnerCode', e.target.value)} disabled={!host}>
                    <option value="">No partner university</option>
                    {others.map(u => <option key={u.code} value={u.code}>{u.name} ({u.code})</option>)}
                  </select>
                </Field>
              )}
            </section>

            {isEvent ? (
              <section className="space-y-4">
                <Eyebrow>Registration</Eyebrow>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Registration closes" htmlFor="new-deadline" hint="Hosts can still add players after this.">
                    <input id="new-deadline" type="datetime-local" className={inputClass} value={form.deadline} onChange={e => set('deadline', e.target.value)} />
                  </Field>
                  <Field label="Player capacity" htmlFor="new-capacity" hint="Teams hold up to four players.">
                    <input id="new-capacity" type="number" min={1} max={10000} className={inputClass} value={form.capacity} onChange={e => set('capacity', e.target.value)} />
                  </Field>
                </div>
              </section>
            ) : (
              <section className="space-y-4">
                <Eyebrow>Access</Eyebrow>
                <label className="flex items-center gap-3 text-sm text-fg-soft">
                  <input type="checkbox" className="h-4 w-4 accent-[#00a859]" checked={form.requiresCode} onChange={e => set('requiresCode', e.target.checked)} />
                  Require a security code to join
                </label>
                {form.requiresCode ? (
                  <Field label="Security code" htmlFor="new-code" hint="Share this with your students.">
                    <div className="flex gap-2">
                      <input id="new-code" className={`${inputClass} font-mono tracking-widest`} value={form.securityCode} onChange={e => set('securityCode', e.target.value.toUpperCase())} />
                      <ConsoleButton aria-label="Generate a new code" icon={<RefreshCw size={15} />} onClick={() => set('securityCode', generateSecurityCode())} />
                    </div>
                  </Field>
                ) : <p className="rounded-lg border border-amber/25 bg-amber/5 px-3 py-2 text-xs text-amber">Anyone at the participating universities can open this workshop.</p>}
              </section>
            )}

            <section className="space-y-4">
              <Eyebrow>Schedule</Eyebrow>
              {isEvent && (
                <Field label="Start">
                  <Segmented label="Start mode" value={form.autoStart ? 'auto' : 'manual'} onChange={v => set('autoStart', v === 'auto')} options={[
                    { value: 'auto', label: 'Automatically' },
                    { value: 'manual', label: 'When I press Start' },
                  ]} />
                </Field>
              )}
              <Field label="Ends">
                <Segmented<Ending> label="End mode" value={form.ending} onChange={v => set('ending', v)} options={[
                  { value: 'window', label: 'At a set time' },
                  { value: 'duration', label: 'After a duration' },
                  { value: 'none', label: 'When I end it' },
                ]} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                {needsStart && (
                  <Field label={autoStart ? 'Opens at' : 'Starts'} htmlFor="new-start" hint={autoStart ? 'Opens by itself if the board has at least one challenge.' : 'You still press Start when it is time.'}>
                    <input id="new-start" type="datetime-local" className={inputClass} value={form.start} onChange={e => set('start', e.target.value)} />
                  </Field>
                )}
                {form.ending === 'window' && (
                  <Field label="Closes at" htmlFor="new-end">
                    <input id="new-end" type="datetime-local" className={inputClass} value={form.end} onChange={e => set('end', e.target.value)} />
                  </Field>
                )}
                {form.ending === 'duration' && (
                  <Field label="Duration (minutes)" htmlFor="new-duration" hint={`${Math.floor(Number(form.duration) / 60)}h ${Number(form.duration) % 60}m, counted from the start.`}>
                    <input id="new-duration" type="number" min={1} max={isEvent ? 525600 : 1440} className={inputClass} value={form.duration} onChange={e => set('duration', e.target.value)} />
                  </Field>
                )}
              </div>
              {!isEvent && form.ending !== 'window' && (
                <p className="text-xs text-faint">The workshop is created paused; press Start in its console when the class begins.</p>
              )}
            </section>
          </div>
        </DialogCard>
      </form>
    </Modal>
  );
};

export default CreateCompetitionModal;
