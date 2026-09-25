import React, { useEffect, useMemo, useState } from 'react';
import { Check, Droplet, Eye, Lightbulb, Plus, Search, Target, Trash2 } from 'lucide-react';
import Modal from '../../ui/Modal';
import { ChallengeCategory } from '../../../types';
import { challengeService } from '../../../services/challengeService';
import { competitionService } from '../../../services/competitionService';
import { categoryAccent } from '../../challenges/ChallengeArt';
import { Chip, ConsoleButton, DialogCard, EmptyState, Panel, inputClass } from './ui';

const ChallengesTab: React.FC<{
  competition: any;
  isEvent: boolean;
  run: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
  confirm: (message: string, options?: any) => Promise<boolean>;
  onView: (challengeId: string) => void;
}> = ({ competition: c, isEvent, run, confirm, onView }) => {
  const [picking, setPicking] = useState(false);
  const [bank, setBank] = useState<any[] | null>(null), [bankError, setBankError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(''), [category, setCategory] = useState('');
  const [hintsFor, setHintsFor] = useState<any>(null);
  const [adding, setAdding] = useState(false);

  // Events snapshot their challenges before the start so every team plays one fixed board.
  const editable = isEvent ? c.status === 'pending' : c.status !== 'ended';
  const lockedReason = isEvent ? 'The board is frozen once the event starts' : 'The competition has ended';
  // Event copies get fresh IDs and remember their source; workshop entries keep the bank ID.
  const added = new Set<string>(c.challenges.map((ch: any) => String(isEvent ? ch.sourceChallengeId : ch._id)));
  const totalPoints = c.challenges.reduce((n: number, ch: any) => n + (ch.currentPoints ?? ch.points ?? 0), 0);

  useEffect(() => {
    if (!picking || bank) return;
    challengeService.getAllChallenges().then(setBank).catch(e => setBankError(e.message || 'Could not load the challenge bank'));
  }, [picking, bank]);

  const candidates = useMemo(() => (bank || []).filter(ch =>
    (!category || ch.category === category) && ch.title.toLowerCase().includes(search.trim().toLowerCase())), [bank, category, search]);

  const addSelected = async () => {
    setAdding(true);
    let failed = 0;
    // One at a time: each add is its own write, and an event commit retries on contention.
    for (const challengeId of selected) {
      try { await competitionService.addChallengeToCompetition(c._id, challengeId); } catch { failed++; }
    }
    setAdding(false);
    const count = selected.size - failed;
    await run(async () => { if (failed) throw new Error(`${failed} challenge${failed === 1 ? '' : 's'} could not be added`); }, `Added ${count} challenge${count === 1 ? '' : 's'}`);
    setPicking(false);
    setSelected(new Set());
  };

  const hintChallenge = hintsFor && c.challenges.find((ch: any) => ch._id === hintsFor._id);

  return (
    <>
      <Panel
        title={`Challenge board · ${c.challenges.length}`}
        icon={<Target size={16} />}
        actions={
          <>
            <span className="hidden text-xs text-faint sm:inline">{totalPoints.toLocaleString()} pts on the board</span>
            <ConsoleButton size="sm" tone="primary" icon={<Plus size={14} />} disabled={!editable} title={editable ? undefined : lockedReason}
              onClick={() => { setSelected(new Set()); setSearch(''); setCategory(''); setPicking(true); }}>
              Add challenges
            </ConsoleButton>
          </>
        }
        bodyClassName=""
      >
        {!editable && isEvent && c.status === 'active' && (
          <p className="border-b border-edge bg-inset/60 px-4 py-2.5 text-xs text-muted">
            The board is frozen while the event runs so every team plays the same set. You can still publish hints.
          </p>
        )}
        {c.challenges.length ? (
          <ul className="divide-y divide-edge">
            {c.challenges.map((ch: any) => {
              const blood = (ch.solvers || []).find((s: any) => s.isFirstBlood);
              const bloodName = isEvent ? c.teams?.find((t: any) => t.id === blood?.teamId)?.name || blood?.username : blood?.username;
              const hints = ch.hints || [];
              const published = hints.filter((h: any) => h.isPublished).length;
              return (
                <li key={ch._id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="h-10 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: categoryAccent(ch.category) }} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-fg">{ch.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                        <span>{ch.category}</span>
                        {ch.difficulty && <span className="text-faint">· {ch.difficulty}</span>}
                        <span className="text-faint">· {ch.scoringMode === 'static' ? 'Static' : 'Dynamic'}</span>
                        {blood && <span className="inline-flex items-center gap-1 text-amber"><Droplet size={11} /> {bloodName}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-4 pl-4 sm:pl-0">
                    <div className="text-right">
                      <p className="font-bold tabular-nums text-fg">{(ch.currentPoints ?? ch.points).toLocaleString()} <span className="text-xs font-normal text-faint">pts</span></p>
                      <p className="text-xs tabular-nums text-faint">{ch.solves || 0} solve{ch.solves === 1 ? '' : 's'}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {hints.length > 0 && (
                        <ConsoleButton size="sm" icon={<Lightbulb size={14} />} onClick={() => setHintsFor(ch)} aria-label={`Hints for ${ch.title}`}>
                          {published}/{hints.length}
                        </ConsoleButton>
                      )}
                      <ConsoleButton size="sm" tone="ghost" icon={<Eye size={14} />} aria-label={`Open ${ch.title}`} onClick={() => onView(ch._id)} />
                      {editable && (
                        <ConsoleButton size="sm" tone="ghost" icon={<Trash2 size={14} />} aria-label={`Remove ${ch.title}`} onClick={async () => {
                          if (await confirm(`Remove “${ch.title}” from ${c.name}?`, { type: 'danger', title: 'Remove challenge', confirmText: 'Remove', isDestructive: true })) {
                            await run(() => competitionService.removeChallengeFromCompetition(c._id, ch._id), 'Challenge removed');
                          }
                        }} />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={<Target size={20} />} title="No challenges yet">
            {editable ? 'Pick challenges from your university’s bank. Events copy them, so later edits to the bank don’t change the event.' : lockedReason}
          </EmptyState>
        )}
      </Panel>

      <Modal isOpen={picking} onClose={() => !adding && setPicking(false)} className="max-w-5xl">
        <DialogCard
          title="Add challenges"
          description={isEvent
            ? 'Each pick is copied into the event. Keep a source challenge unpublished in the bank if it should stay exclusive to this event.'
            : 'Picked challenges are added to the workshop as they are.'}
          footer={<>
            <span className="mr-auto self-center text-xs text-muted">{selected.size} selected</span>
            <ConsoleButton tone="ghost" onClick={() => setPicking(false)} disabled={adding}>Cancel</ConsoleButton>
            <ConsoleButton tone="primary" onClick={addSelected} disabled={!selected.size || adding}>
              {adding ? 'Adding…' : `Add ${selected.size || ''} challenge${selected.size === 1 ? '' : 's'}`}
            </ConsoleButton>
          </>}
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search the challenge bank" aria-label="Search challenges" className={`${inputClass} pl-9`} />
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Category" className={`${inputClass} sm:w-56`}>
              <option value="">All categories</option>
              {Object.values(ChallengeCategory).map(cat => <option key={cat} value={cat}>{cat === ChallengeCategory.MISC ? 'Misc' : cat}</option>)}
            </select>
          </div>
          {bankError ? <p role="alert" className="text-sm text-danger">{bankError}</p>
            : !bank ? <p className="py-10 text-center text-sm text-faint">Loading the challenge bank…</p>
            : !candidates.length ? <p className="py-10 text-center text-sm text-faint">No challenges match.</p>
            : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {candidates.map(ch => {
                  const already = added.has(String(ch._id)), on = selected.has(ch._id);
                  return (
                    <li key={ch._id}>
                      <button
                        type="button"
                        disabled={already}
                        aria-pressed={on}
                        onClick={() => setSelected(prev => { const next = new Set(prev); next.has(ch._id) ? next.delete(ch._id) : next.add(ch._id); return next; })}
                        className={`flex h-full w-full flex-col rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          on ? 'border-brand bg-brand/10' : 'border-edge bg-inset hover:border-edge-light'
                        }`}
                      >
                        <span className="mb-2 flex items-start gap-2">
                          <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${on ? 'border-brand bg-brand text-white' : 'border-edge-light'}`}>
                            {on && <Check size={11} strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1 font-semibold leading-snug text-fg">{ch.title}</span>
                        </span>
                        <span className="mb-2 line-clamp-2 text-xs text-muted">{ch.description}</span>
                        <span className="mt-auto flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-fg-soft">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: categoryAccent(ch.category) }} />{ch.category}
                          </span>
                          <Chip>{ch.currentPoints || ch.points} pts</Chip>
                          {!ch.isPublished && <Chip tone="warn">Unpublished</Chip>}
                          {already && <Chip tone="info">On the board</Chip>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
        </DialogCard>
      </Modal>

      <Modal isOpen={!!hintsFor} onClose={() => setHintsFor(null)} className="max-w-xl">
        {hintChallenge && (
          <DialogCard
            title={`Hints · ${hintChallenge.title}`}
            description="Publishing makes a hint free for everyone. Unpublished hints can still be bought for their cost."
            footer={<ConsoleButton onClick={() => setHintsFor(null)}>Done</ConsoleButton>}
          >
            <ol className="space-y-3">
              {hintChallenge.hints.map((hint: any, index: number) => (
                <li key={index} className={`rounded-lg border p-3 ${hint.isPublished ? 'border-brand/30 bg-brand/5' : 'border-edge bg-inset'}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-semibold text-fg">Hint {index + 1}</span>
                    <Chip tone="info">{hint.cost} pts</Chip>
                    {hint.isPublished ? <Chip tone="good">Published</Chip> : (
                      <ConsoleButton size="sm" tone="primary" className="ml-auto" onClick={() => run(
                        () => competitionService.publishCompetitionHint(c._id, hintChallenge._id, index), `Hint ${index + 1} published`,
                      )}>Publish</ConsoleButton>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted">{hint.text}</p>
                </li>
              ))}
            </ol>
          </DialogCard>
        )}
      </Modal>
    </>
  );
};

export default ChallengesTab;
