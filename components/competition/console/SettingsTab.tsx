import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, FileText, Save, Ticket } from 'lucide-react';
import { eventService } from '../../../services/eventService';
import { ConsoleButton, Field, Panel, Segmented, inputClass, toLocalInput } from './ui';

type Limit = 'window' | 'duration' | 'none';

const initialForm = (c: any) => ({
  name: c.name || '',
  description: c.description || '',
  registrationDeadline: toLocalInput(c.registrationDeadline),
  capacity: String(c.capacity ?? ''),
  autoStart: !!c.autoStart,
  startTime: toLocalInput(c.startTime),
  limit: (c.hasTimeLimit === false ? 'none' : c.duration && !(c.status === 'active' || c.endTime) ? 'duration' : 'window') as Limit,
  endTime: toLocalInput(c.endTime),
  duration: String(c.duration ?? 120),
});

const iso = (local: string) => (local ? new Date(local).toISOString() : null);

const SettingsTab: React.FC<{
  competition: any;
  run: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
}> = ({ competition: c, run }) => {
  const [form, setForm] = useState(() => initialForm(c));
  const [saving, setSaving] = useState(false), [touched, setTouched] = useState(false);
  const baseline = useMemo(() => initialForm(c), [c]);
  // Follow changes made elsewhere (another host, the scheduler) until the host starts editing.
  useEffect(() => { if (!touched) setForm(initialForm(c)); }, [c, touched]);
  const dirty = touched && JSON.stringify(form) !== JSON.stringify(baseline);

  const pending = c.status === 'pending', ended = c.status === 'ended';
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => { setTouched(true); setForm(prev => ({ ...prev, [key]: value })); };

  /** Only what changed goes to the server, so a stale field can never overwrite a newer one. */
  const changes = () => {
    const patch: Record<string, unknown> = {};
    if (form.name !== baseline.name) patch.name = form.name;
    if (form.description !== baseline.description) patch.description = form.description;
    if (form.registrationDeadline !== baseline.registrationDeadline) patch.registrationDeadline = iso(form.registrationDeadline);
    if (form.capacity !== baseline.capacity) patch.capacity = Number(form.capacity);
    if (pending) {
      if (form.autoStart !== baseline.autoStart) patch.autoStart = form.autoStart;
      if (form.startTime !== baseline.startTime) patch.startTime = iso(form.startTime);
      if (form.limit !== baseline.limit) patch.hasTimeLimit = form.limit !== 'none';
      if (form.limit === 'duration' && (form.limit !== baseline.limit || form.duration !== baseline.duration)) { patch.duration = Number(form.duration); patch.endTime = null; }
      if (form.limit === 'window' && (form.limit !== baseline.limit || form.endTime !== baseline.endTime)) { patch.endTime = iso(form.endTime); if (form.limit !== baseline.limit) patch.duration = null; }
    } else if (c.hasTimeLimit !== false && form.endTime !== baseline.endTime) {
      patch.endTime = iso(form.endTime);
    }
    return patch;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (await run(() => eventService.updateSettings(c._id, changes()), 'Event settings saved')) setTouched(false);
    setSaving(false);
  };

  if (ended) {
    return (
      <Panel title="Settings" icon={<FileText size={16} />}>
        <p className="text-sm text-muted">This event has ended. Its settings are locked so the final results stay as they were played.</p>
      </Panel>
    );
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Event brief" icon={<FileText size={16} />} bodyClassName="space-y-4 p-4">
          <Field label="Name" htmlFor="event-name">
            <input id="event-name" required maxLength={120} className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="Description & rules" htmlFor="event-description" hint={`Shown to invited universities before they register. ${form.description.length}/5000`}>
            <textarea id="event-description" rows={9} maxLength={5000} className={inputClass} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder={'What the event is, prizes, and the rules. For example:\n• Flag format: CK{...}\n• No attacking the platform or other teams\n• No sharing flags between teams'} />
          </Field>
        </Panel>

        <div className="space-y-6">
          <Panel title="Registration" icon={<Ticket size={16} />} bodyClassName="grid gap-4 p-4 sm:grid-cols-2">
            <Field label="Registration closes" htmlFor="event-deadline" hint="Players can withdraw during the first hour after registering.">
              <input id="event-deadline" required type="datetime-local" className={inputClass} value={form.registrationDeadline} onChange={e => set('registrationDeadline', e.target.value)} />
            </Field>
            <Field label="Player capacity" htmlFor="event-capacity" hint={`${c.registrationCount} already registered.`}>
              <input id="event-capacity" required type="number" min={Math.max(1, c.registrationCount)} max={10000} className={inputClass} value={form.capacity} onChange={e => set('capacity', e.target.value)} />
            </Field>
          </Panel>

          <Panel title="Schedule" icon={<CalendarClock size={16} />} bodyClassName="space-y-4 p-4">
            {pending ? (
              <>
                <Field label="Start">
                  <Segmented label="Start mode" value={form.autoStart ? 'auto' : 'manual'} onChange={v => set('autoStart', v === 'auto')} options={[
                    { value: 'auto', label: 'Automatically' },
                    { value: 'manual', label: 'When I press Start' },
                  ]} />
                </Field>
                {form.autoStart && (
                  <Field label="Opens at" htmlFor="event-start" hint="The event opens on its own at this time, as long as it has at least one challenge.">
                    <input id="event-start" required type="datetime-local" className={inputClass} value={form.startTime} onChange={e => set('startTime', e.target.value)} />
                  </Field>
                )}
                <Field label="Ends">
                  <Segmented<Limit> label="End mode" value={form.limit} onChange={v => set('limit', v)} options={[
                    { value: 'window', label: 'At a set time' },
                    { value: 'duration', label: 'After a duration' },
                    { value: 'none', label: 'When I end it' },
                  ]} />
                </Field>
                {form.limit === 'window' && (
                  <Field label="Closes at" htmlFor="event-end">
                    <input id="event-end" required type="datetime-local" className={inputClass} value={form.endTime} onChange={e => set('endTime', e.target.value)} />
                  </Field>
                )}
                {form.limit === 'duration' && (
                  <Field label="Duration (minutes)" htmlFor="event-duration" hint="Counted from the moment the event opens.">
                    <input id="event-duration" required type="number" min={1} max={525600} className={inputClass} value={form.duration} onChange={e => set('duration', e.target.value)} />
                  </Field>
                )}
              </>
            ) : c.hasTimeLimit !== false ? (
              <Field label="Closes at" htmlFor="event-end" hint="Extend or shorten the running event. To stop it now, use End event at the top.">
                <input id="event-end" required type="datetime-local" className={inputClass} value={form.endTime} onChange={e => set('endTime', e.target.value)} />
              </Field>
            ) : (
              <p className="text-sm text-muted">This event runs until you end it from the top of the console.</p>
            )}
          </Panel>
        </div>
      </div>

      <div className="sticky bottom-3 z-10 flex items-center justify-end gap-3 rounded-xl border border-edge bg-panel/95 px-4 py-3 shadow-lg shadow-black/30 backdrop-blur">
        <span className="mr-auto text-xs text-muted">{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
        <ConsoleButton tone="ghost" disabled={!dirty || saving} onClick={() => { setForm(baseline); setTouched(false); }}>Discard</ConsoleButton>
        <ConsoleButton type="submit" tone="primary" icon={<Save size={15} />} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save changes'}</ConsoleButton>
      </div>
    </form>
  );
};

export default SettingsTab;
