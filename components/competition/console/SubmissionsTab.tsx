import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, FileSearch, RefreshCw, ShieldAlert } from 'lucide-react';
import { eventService } from '../../../services/eventService';
import { Chip, ConsoleButton, EmptyState, Panel, Segmented, StatTile, downloadCsv, fileSlug, formatAgo, formatDateTime, inputClass } from './ui';

type ResultFilter = 'all' | 'correct' | 'incorrect' | 'flagged' | 'already_solved' | 'blocked';

const RESULT_LABEL: Record<string, { label: string; tone: 'good' | 'bad' | 'neutral' | 'warn' }> = {
  correct: { label: 'Correct', tone: 'good' },
  incorrect: { label: 'Wrong', tone: 'bad' },
  already_solved: { label: 'Duplicate', tone: 'neutral' },
  blocked: { label: 'Refused', tone: 'warn' },
};

/**
 * Every flag attempt in the event, for spotting brute forcing and shared flags.
 * Host-only on the server; the submitted text is only ever rendered as text.
 */
const SubmissionsTab: React.FC<{ competition: any; live: boolean; now: number }> = ({ competition: c, live, now }) => {
  const [filter, setFilter] = useState<ResultFilter>('all');
  const [teamId, setTeamId] = useState(''), [challengeId, setChallengeId] = useState('');
  const [data, setData] = useState<any>(null), [more, setMore] = useState<any[]>([]), [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const request = useRef(0);

  const params = useCallback((before?: string) => {
    const query: Record<string, string> = { limit: '100' };
    if (filter === 'flagged') query.flagged = '1';
    else if (filter !== 'all') query.result = filter;
    if (teamId) query.teamId = teamId;
    if (challengeId) query.challengeId = challengeId;
    if (before) query.before = before;
    return query;
  }, [filter, teamId, challengeId]);

  const load = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    try {
      const page = await eventService.submissions(c._id, params());
      if (id !== request.current) return;
      setData(page); setMore([]); setCursor(page.nextCursor); setError('');
    } catch (e: any) {
      if (id === request.current) setError(e.message || 'Could not load submissions');
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [c._id, params]);

  useEffect(() => { void load(); }, [load]);
  // Wrong guesses change nothing players see, so there is no push for them; poll while the tab is open.
  useEffect(() => {
    if (!live || c.status === 'ended') return;
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [live, load, c.status]);

  const loadMore = async () => {
    if (!cursor) return;
    try {
      const page = await eventService.submissions(c._id, params(cursor));
      setMore(prev => [...prev, ...page.items]); setCursor(page.nextCursor);
    } catch (e: any) { setError(e.message || 'Could not load more'); }
  };

  const items = [...(data?.items || []), ...more];
  const summary = data?.summary;
  const exportCsv = () => downloadCsv(`${fileSlug(c.name)}-submissions.csv`, [
    ['Time', 'Player', 'Team', 'Challenge', 'Result', 'Submitted', 'Matches flag of', 'Detail'],
    ...items.map(i => [i.createdAt, i.username, i.teamName || '', i.challengeTitle, RESULT_LABEL[i.result]?.label || i.result, i.submitted || '', i.matchedChallengeTitle || '', i.detail || '']),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Attempts" value={summary?.total ?? '—'} detail={summary ? `${summary.correct} correct` : undefined} icon={<FileSearch size={15} />} accent="#60a5fa" />
        <StatTile label="Wrong flags" value={summary?.incorrect ?? '—'} detail={summary?.total ? `${Math.round((summary.incorrect / summary.total) * 100)}% of attempts` : undefined} icon={<AlertTriangle size={15} />} accent="#f43f5e" />
        <StatTile label="Another challenge's flag" value={summary?.flagged ?? '—'} detail="Mix-ups, or shared flags" icon={<ShieldAlert size={15} />} accent="#f3a43a" />
        <StatTile label="Refused" value={summary ? summary.blocked + summary.already_solved : '—'} detail={summary ? `${summary.already_solved} duplicate${summary.already_solved === 1 ? '' : 's'} · ${summary.blocked} blocked` : undefined} icon={<ShieldAlert size={15} />} accent="#a855f7" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel
          title="Submission log"
          icon={<FileSearch size={16} />}
          actions={<>
            <ConsoleButton size="sm" tone="ghost" aria-label="Refresh" icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />} onClick={() => void load()} />
            <ConsoleButton size="sm" icon={<Download size={14} />} onClick={exportCsv} disabled={!items.length}>Export CSV</ConsoleButton>
          </>}
          bodyClassName=""
        >
          <div className="flex flex-col gap-3 border-b border-edge px-4 py-3">
            <div className="scroll-x">
              <Segmented<ResultFilter> label="Result" value={filter} onChange={setFilter} options={[
                { value: 'all', label: 'All' },
                { value: 'correct', label: 'Correct' },
                { value: 'incorrect', label: 'Wrong' },
                { value: 'flagged', label: 'Other challenge’s flag' },
                { value: 'already_solved', label: 'Duplicate' },
                { value: 'blocked', label: 'Refused' },
              ]} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <select aria-label="Team" className={inputClass} value={teamId} onChange={e => setTeamId(e.target.value)}>
                <option value="">All teams</option>
                {c.teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select aria-label="Challenge" className={inputClass} value={challengeId} onChange={e => setChallengeId(e.target.value)}>
                <option value="">All challenges</option>
                {c.challenges.map((ch: any) => <option key={ch._id} value={ch._id}>{ch.title}</option>)}
              </select>
            </div>
          </div>

          {error ? <p role="alert" className="px-4 py-6 text-sm text-danger">{error}</p>
            : !data ? <p className="px-4 py-10 text-center text-sm text-faint">Loading…</p>
            : !items.length ? (
              <EmptyState icon={<FileSearch size={20} />} title="No attempts match">
                {summary?.total ? 'Try another filter.' : 'Every flag submitted in this event, right or wrong, will be listed here.'}
              </EmptyState>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-edge text-left text-xs text-dim">
                        <th scope="col" className="px-4 py-2.5 font-medium">When</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Player</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Challenge</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Result</th>
                        <th scope="col" className="px-4 py-2.5 font-medium">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-edge">
                      {items.map(item => {
                        const result = RESULT_LABEL[item.result] || { label: item.result, tone: 'neutral' as const };
                        return (
                          <tr key={item._id} className="align-top">
                            <td className="whitespace-nowrap px-4 py-2.5 text-xs text-faint" title={formatDateTime(item.createdAt)}>{formatAgo(item.createdAt, now)}</td>
                            <td className="px-4 py-2.5">
                              <span className="block font-semibold text-fg">{item.username}</span>
                              <span className="block text-xs text-faint">{item.teamName || 'No team'}</span>
                            </td>
                            <td className="px-4 py-2.5 text-fg-soft">{item.challengeTitle}</td>
                            <td className="px-4 py-2.5"><Chip tone={result.tone}>{result.label}</Chip></td>
                            <td className="max-w-xs px-4 py-2.5">
                              {item.submitted && (
                                <code className="block break-all rounded border border-edge bg-inset px-2 py-1 font-mono text-xs text-fg-soft" title={item.submitted}>
                                  {item.submitted.length > 80 ? `${item.submitted.slice(0, 80)}…` : item.submitted}
                                </code>
                              )}
                              {item.matchedChallengeTitle && <Chip tone="warn" className="mt-1.5">Flag of “{item.matchedChallengeTitle}”</Chip>}
                              {item.detail && <span className="text-xs text-muted">{item.detail}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {cursor && (
                  <div className="border-t border-edge px-4 py-3 text-center">
                    <ConsoleButton size="sm" onClick={loadMore}>Load older attempts</ConsoleButton>
                  </div>
                )}
              </>
            )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Most wrong flags" icon={<AlertTriangle size={16} />} bodyClassName="p-2">
            {data?.noisiestTeams?.length ? data.noisiestTeams.map((t: any) => (
              <button key={t.teamId || 'none'} type="button" onClick={() => { setTeamId(t.teamId || ''); setFilter('incorrect'); }}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-hover">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{t.teamName || 'No team'}</span>
                <span className="text-sm font-bold tabular-nums text-danger">{t.incorrect}</span>
              </button>
            )) : <p className="px-2 py-6 text-center text-sm text-faint">No wrong flags yet</p>}
            <p className="px-2 pb-1 pt-2 text-xs text-faint">A burst of wrong flags from one team usually means guessing. The server allows each player 50 attempts per 10 minutes.</p>
          </Panel>
          <Panel title="About this log" icon={<ShieldAlert size={16} />}>
            <ul className="space-y-2 text-xs text-muted">
              <li>Only hosts can see it. Players never receive another team’s attempts.</li>
              <li>Wrong answers are stored as typed, cut to 256 characters. Correct answers are not stored: they are the flag.</li>
              <li>“Other challenge’s flag” means a correct flag was entered for the wrong challenge — often a slip, sometimes a copied flag.</li>
              <li>Attempts are deleted automatically after 180 days.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsTab;
