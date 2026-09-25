import React, { useCallback, useEffect, useState } from 'react';
import { Award, Copy, ExternalLink, EyeOff, Globe, Lock, Snowflake, Unlock } from 'lucide-react';
import { eventService } from '../../../services/eventService';
import { Chip, ConsoleButton, Panel, formatDateTime, formatSpan } from './ui';
import type { ConsoleTab } from './tabs';

/** Links to the public pages. The app uses hash routing, so the path lives after `#`. */
export const publicLink = (path: string) => `${window.location.origin}${window.location.pathname}#${path}`;

const CopyLink: React.FC<{ href: string }> = ({ href }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-edge bg-inset px-3 py-2">
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg-soft">{href}</span>
      <button type="button" className="flex-shrink-0 text-xs font-semibold text-brand hover:underline" onClick={async () => {
        try { await navigator.clipboard.writeText(href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* still selectable */ }
      }}>
        {copied ? 'Copied' : <span className="inline-flex items-center gap-1"><Copy size={12} /> Copy</span>}
      </button>
      <a href={href} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-muted hover:text-fg" aria-label="Open in a new tab"><ExternalLink size={14} /></a>
    </div>
  );
};

const ResultsTab: React.FC<{
  competition: any;
  now: number;
  run: (action: () => Promise<unknown>, success: string) => Promise<boolean>;
  confirm: (message: string, options?: any) => Promise<boolean>;
  onOpenTab: (tab: ConsoleTab) => void;
}> = ({ competition: c, now, run, confirm, onOpenTab }) => {
  const [certificates, setCertificates] = useState<any[] | null>(null);
  const ended = c.status === 'ended';
  const freezeAt = c.scoreboardFreezeAt ? Date.parse(c.scoreboardFreezeAt) : null;
  const frozen = !!c.scoreboardFrozen;
  const revealed = !!c.scoreboardRevealedAt;

  const loadCertificates = useCallback(() => {
    if (!c.certificatesIssued) return setCertificates([]);
    eventService.certificates(c._id).then(setCertificates).catch(() => setCertificates([]));
  }, [c._id, c.certificatesIssued]);
  useEffect(loadCertificates, [loadCertificates, c]);

  const reveal = async () => {
    if (!await confirm('Reveal the final scoreboard? Every player sees the live standings at once, including everything scored during the freeze. This cannot be undone.', {
      type: 'warning', title: 'Reveal scoreboard', confirmText: 'Reveal now',
    })) return;
    await run(() => eventService.revealScoreboard(c._id), 'Scoreboard revealed');
  };
  const publish = async () => {
    if (!await confirm(`Publish the results page? Anyone with the link can see the final standings: team names, universities, points and challenge statistics. Player names are not shown.${frozen ? ' This also reveals the frozen scoreboard.' : ''}`, {
      type: 'warning', title: 'Publish results', confirmText: 'Publish',
    })) return;
    await run(() => eventService.publishResults(c._id), 'Results published');
  };
  const issue = async () => {
    if (!await confirm(c.certificatesIssued
      ? 'Update the certificates from the final standings? Existing links keep working. Players who are no longer eligible (for example, on a disqualified team) have theirs revoked.'
      : 'Issue a certificate to every registered player who is not on a disqualified team? Each player can open theirs from the event page, and anyone with the link can verify it.', {
      type: 'warning', title: c.certificatesIssued ? 'Update certificates' : 'Issue certificates', confirmText: c.certificatesIssued ? 'Update' : 'Issue',
    })) return;
    if (await run(async () => {
      const result = await eventService.issueCertificates(c._id);
      if (result.revoked) throw new Error(`${result.issued} certificates up to date; ${result.revoked} revoked`);
    }, 'Certificates are up to date')) loadCertificates();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Scoreboard freeze" icon={<Snowflake size={16} />}>
        {!freezeAt ? (
          <div className="space-y-3 text-sm text-muted">
            <p>No freeze is scheduled. Many CTFs freeze the scoreboard for the last hour, so the final standings stay a surprise until the closing ceremony.</p>
            {!ended && <ConsoleButton size="sm" onClick={() => onOpenTab('settings')}>Schedule a freeze in Settings</ConsoleButton>}
          </div>
        ) : revealed ? (
          <p className="flex items-center gap-2 text-sm text-muted"><Unlock size={15} className="text-brand" /> Frozen at {formatDateTime(c.scoreboardFreezeAt)}, revealed {formatDateTime(c.scoreboardRevealedAt)}.</p>
        ) : frozen ? (
          <div className="space-y-3">
            <p className="flex items-start gap-2 text-sm text-fg-soft">
              <Snowflake size={16} className="mt-0.5 flex-shrink-0 text-info" />
              <span>Frozen since {formatDateTime(c.scoreboardFreezeAt)}. Players, the public scoreboard and the projector view show the standings from that moment; this console shows them live.</span>
            </p>
            <ConsoleButton tone="primary" icon={<Unlock size={15} />} onClick={reveal}>Reveal final scoreboard</ConsoleButton>
            <p className="text-xs text-faint">Tip: open Present scoreboard on the projector first, then reveal. It updates on screen.</p>
          </div>
        ) : (
          <p className="text-sm text-muted">Freezes {formatDateTime(c.scoreboardFreezeAt)}{freezeAt > now ? ` — in ${formatSpan(freezeAt - now)}` : ''}. From then on players see the standings as they were at that moment.</p>
        )}
      </Panel>

      <Panel title="Public results page" icon={<Globe size={16} />}>
        {!ended ? (
          <p className="text-sm text-muted">After the event ends you can publish a results page that anyone can open without an account: podium, standings, score graph and challenge statistics.</p>
        ) : c.resultsPublished ? (
          <div className="space-y-3">
            <p className="text-sm text-fg-soft"><Chip tone="good">Published</Chip> <span className="ml-1">Share this link with the universities and on social media.</span></p>
            <CopyLink href={publicLink(`/results/${c._id}`)} />
            <ConsoleButton size="sm" tone="ghost" icon={<EyeOff size={14} />} onClick={async () => {
              if (await confirm('Unpublish the results page? The link stops working until you publish again.', { title: 'Unpublish results', confirmText: 'Unpublish' })) {
                await run(() => eventService.unpublishResults(c._id), 'Results unpublished');
              }
            }}>Unpublish</ConsoleButton>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">Not published. The page shows team names, universities, points and challenge statistics — never player names or flags.</p>
            <ConsoleButton tone="primary" icon={<Globe size={15} />} onClick={publish}>Publish results</ConsoleButton>
          </div>
        )}
      </Panel>

      <Panel title="Certificates" icon={<Award size={16} />} className="xl:col-span-2"
        actions={ended && !frozen && <ConsoleButton size="sm" tone={c.certificatesIssued ? 'secondary' : 'primary'} icon={<Award size={14} />} onClick={issue}>
          {c.certificatesIssued ? 'Update certificates' : 'Issue certificates'}
        </ConsoleButton>}
        bodyClassName=""
      >
        {!ended ? (
          <p className="px-4 py-4 text-sm text-muted">Certificates can be issued once the event ends. Each registered player gets one with their team and final placing, and a link anyone can use to verify it.</p>
        ) : frozen ? (
          <p className="flex items-center gap-2 px-4 py-4 text-sm text-muted"><Lock size={15} /> Reveal the scoreboard first: certificates show final placings.</p>
        ) : !c.certificatesIssued ? (
          <p className="px-4 py-4 text-sm text-muted">Not issued yet. Players on disqualified teams do not receive one.</p>
        ) : certificates == null ? (
          <p className="px-4 py-6 text-center text-sm text-faint">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-xs text-dim">
                  <th scope="col" className="px-4 py-2.5 font-medium">Name on certificate</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Team</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Placing</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-4 py-2.5"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {certificates.map(cert => (
                  <tr key={cert.code}>
                    <td className="px-4 py-2.5"><span className="font-semibold text-fg">{cert.name}</span> <span className="text-xs text-faint">@{cert.username}</span></td>
                    <td className="px-4 py-2.5 text-muted">{cert.teamName || 'No team'}</td>
                    <td className="px-4 py-2.5 tabular-nums text-fg-soft">{cert.rank ? `#${cert.rank} of ${cert.totalTeams}` : '—'}</td>
                    <td className="px-4 py-2.5">{cert.revoked ? <Chip tone="bad">Revoked</Chip> : <Chip tone="good">Valid</Chip>}</td>
                    <td className="px-4 py-2.5 text-right">
                      <a href={publicLink(`/certificates/${cert.code}`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                        Open <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default ResultsTab;
