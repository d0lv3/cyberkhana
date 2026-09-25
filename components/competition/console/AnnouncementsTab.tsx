import React, { useCallback, useEffect, useState } from 'react';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import { announcementService } from '../../../services/announcementService';
import { ConsoleButton, EmptyState, Field, Panel, formatAgo, formatDateTime, inputClass } from './ui';

const AnnouncementsTab: React.FC<{
  competition: any;
  isEvent: boolean;
  now: number;
  run: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
  confirm: (message: string, options?: any) => Promise<boolean>;
}> = ({ competition: c, isEvent, now, run, confirm }) => {
  const [items, setItems] = useState<any[] | null>(null), [error, setError] = useState('');
  const [title, setTitle] = useState(''), [content, setContent] = useState(''), [posting, setPosting] = useState(false);

  const load = useCallback(() => {
    announcementService.getCompetitionAnnouncements(c._id).then(data => { setItems(data); setError(''); }).catch(e => setError(e.message));
  }, [c._id]);
  useEffect(load, [load]);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    const ok = await run(() => announcementService.createCompetitionAnnouncement(c._id, { title: title.trim(), content: content.trim() }), 'Announcement posted');
    setPosting(false);
    if (ok) { setTitle(''); setContent(''); load(); }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Panel title="New announcement" icon={<Megaphone size={16} />}>
        <form onSubmit={post} className="space-y-4">
          <Field label="Title" htmlFor="announcement-title">
            <input id="announcement-title" required maxLength={120} className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Web 3 target restarted" />
          </Field>
          <Field label="Message" htmlFor="announcement-content" hint={isEvent
            ? 'Shown on the event dashboard of every registered player; open dashboards update immediately.'
            : 'Shown on the competition dashboard and pushed to players at the participating universities.'}>
            <textarea id="announcement-content" required rows={6} maxLength={2000} className={inputClass} value={content} onChange={e => setContent(e.target.value)}
              placeholder="Clarifications, fixed challenges, schedule changes…" />
          </Field>
          <ConsoleButton type="submit" tone="primary" icon={<Send size={15} />} disabled={posting || !title.trim() || !content.trim()} className="w-full">
            {posting ? 'Posting…' : 'Post announcement'}
          </ConsoleButton>
        </form>
      </Panel>

      <Panel title={`Posted · ${items?.length ?? 0}`} icon={<Megaphone size={16} />} bodyClassName="">
        {error ? <p role="alert" className="px-4 py-6 text-sm text-danger">{error}</p>
          : items == null ? <p className="px-4 py-10 text-center text-sm text-faint">Loading…</p>
          : items.length ? (
            <ol className="divide-y divide-edge">
              {items.map(a => (
                <li key={a._id} className="px-4 py-4">
                  <div className="mb-1 flex items-start gap-3">
                    <h3 className="min-w-0 flex-1 font-semibold text-fg">{a.title}</h3>
                    <span className="flex-shrink-0 text-xs text-faint" title={formatDateTime(a.createdAt)}>{formatAgo(a.createdAt, now)}</span>
                    <ConsoleButton size="sm" tone="ghost" icon={<Trash2 size={14} />} aria-label={`Delete ${a.title}`} onClick={async () => {
                      if (await confirm(`Delete “${a.title}”? Players will no longer see it.`, { type: 'danger', title: 'Delete announcement', confirmText: 'Delete', isDestructive: true })) {
                        if (await run(() => announcementService.deleteAnnouncement(a._id), 'Announcement deleted')) load();
                      }
                    }} />
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted">{a.content}</p>
                  {a.author && <p className="mt-2 text-xs text-faint">— {a.author}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={<Megaphone size={20} />} title="Nothing posted yet">
              Use announcements for rule clarifications, restarted targets and schedule changes — the things a CTF’s players need to hear at once.
            </EmptyState>
          )}
      </Panel>
    </div>
  );
};

export default AnnouncementsTab;
