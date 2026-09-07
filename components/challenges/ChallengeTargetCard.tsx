import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Server } from 'lucide-react';
import {
  ChallengeTarget,
  formatAddress,
  netcatCommand,
  targetKind,
} from '../../utils/challengeTarget';

interface Props {
  challenge: ChallengeTarget;
  /** Wrapper classes, so each page keeps its own card chrome. */
  className?: string;
}

/** Copies text and confirms it in place for two seconds. */
const CopyButton: React.FC<{ text: string; label: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          /* Clipboard is blocked outside a secure context; the text is
             selectable either way, so this fails quietly rather than shouting. */
        }
      }}
      className="flex h-9 w-9 flex-shrink-0 touch:h-11 touch:w-11 items-center justify-center rounded-lg border border-edge text-faint transition-colors hover:border-brand/40 hover:text-brand"
    >
      {copied ? <Check size={15} className="text-brand" /> : <Copy size={15} />}
    </button>
  );
};

/**
 * Where the challenge lives, rendered as whatever it actually is.
 *
 * A link gets a button that opens it. An address gets monospace text and a copy
 * control, because a raw TCP target is not something you click — it is
 * something you paste into a terminal, and dressing it as a link sends people
 * to a page that does not exist.
 */
const ChallengeTargetCard: React.FC<Props> = ({ challenge, className = '' }) => {
  const kind = targetKind(challenge);
  if (kind === 'none') return null;

  if (kind === 'link') {
    const link = challenge.challengeLink!.trim();
    return (
      <div className={className}>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-fg">
          <ExternalLink size={18} className="text-muted" />
          Environment
        </h3>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-2xl border border-brand/20 bg-brand/10 p-5 text-center transition-all hover:bg-brand/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <ExternalLink
            size={24}
            className="mx-auto mb-2 text-brand-neon transition-transform group-hover:scale-110"
          />
          <span className="block font-bold text-brand-neon">Open challenge instance</span>
          <span className="mt-1 block truncate text-xs text-brand-neon/60">{link}</span>
        </a>
      </div>
    );
  }

  const host = challenge.challengeHost!.trim();
  const port = challenge.challengePort!;
  const address = formatAddress(host, port);
  const command = netcatCommand(host, port);

  return (
    <div className={className}>
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-fg">
        <Server size={18} className="text-muted" />
        Environment
      </h3>

      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-xl border border-edge bg-inset p-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-faint">Address</p>
            {/* select-all: the whole address is one token, and a double-click
                on a colon-separated string otherwise grabs only half of it. */}
            <p className="select-all truncate font-mono text-sm font-semibold text-fg-soft" dir="ltr">
              {address}
            </p>
          </div>
          <CopyButton text={address} label="Copy address" />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-edge bg-inset p-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-faint">Connect with</p>
            <p className="select-all truncate font-mono text-sm font-semibold text-brand-neon" dir="ltr">
              {command}
            </p>
          </div>
          <CopyButton text={command} label="Copy connect command" />
        </div>
      </div>
    </div>
  );
};

export default ChallengeTargetCard;
