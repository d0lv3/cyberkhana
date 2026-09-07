import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import Button from '../ui/EnhancedButton';

export interface AcceptancePoint {
  title: string;
  text: string;
}

interface AcceptanceDialogProps {
  title: string;
  intro: string;
  /** The clauses shown before the checkbox. Kept short on purpose. */
  points: AcceptancePoint[];
  /** Hash link to the full document, e.g. '#/terms'. Opened in a new tab. */
  docHref: string;
  docLabel: string;
  updated: string;
  checkboxLabel: React.ReactNode;
  acceptLabel: string;
  /** Must reject on failure — the dialog stays open and shows the message. */
  onAccept: () => Promise<void>;
  secondaryLabel: string;
  onSecondary: () => void;
  footnote: string;
}

/**
 * The shared mechanics behind both legal acceptance gates.
 *
 * Deliberately NOT built on components/ui/Modal: that one closes on Escape and
 * on a backdrop click and paints a close button, and every one of those is a
 * way out of a dialog that is supposed to have exactly two exits — accept, or
 * the caller's secondary action. This renders its own backdrop, traps focus,
 * locks the page behind it and swallows Escape.
 *
 * The two callers differ only in copy, in what their secondary button does, and
 * in how much they lock: TermsGate covers the whole app, AmbassadorGate covers
 * the Management area. Everything below is identical between them, so it lives
 * here rather than being written twice.
 *
 * Neither gate is a security boundary. Both are enforced independently on the
 * server, so removing this node from the DOM yields 403s, not access.
 */
const AcceptanceDialog: React.FC<AcceptanceDialogProps> = ({
  title,
  intro,
  points,
  docHref,
  docLabel,
  updated,
  checkboxLabel,
  acceptLabel,
  onAccept,
  secondaryLabel,
  onSecondary,
  footnote,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Lock the page behind the dialog and pull focus into it.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // The checkbox rather than the panel: it is the first thing they must act
    // on, and starting there means a keyboard user tabs forward into Accept.
    checkboxRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Keep Tab inside the dialog, and swallow Escape — there is no dismissing it.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, []);

  const handleAccept = async () => {
    if (!agreed || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      await onAccept();
      // No success state: accepting removes the condition that renders this,
      // so the caller unmounts us.
    } catch (err: any) {
      // authService's shared parser throws a bare 'Request failed' when the
      // response carries no error of its own — which is exactly what a dead
      // backend looks like from here, and is useless to a student. Anything
      // the server actually said is worth more, so only replace the generic.
      const message = err?.message && err.message !== 'Request failed' ? err.message : '';
      setError(
        message ||
          'Could not save your acceptance — the server did not respond. Check your connection and try again.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="acceptance-title"
      aria-describedby="acceptance-intro"
    >
      <div
        ref={panelRef}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-edge bg-panel shadow-2xl"
      >
        <div className="border-b border-edge px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber/20">
              <AlertTriangle className="h-5 w-5 text-amber" aria-hidden="true" />
            </span>
            <div>
              <h2 id="acceptance-title" className="text-xl font-bold text-fg sm:text-2xl">
                {title}
              </h2>
              <p id="acceptance-intro" className="mt-1.5 text-sm leading-relaxed text-muted">
                {intro}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <p className="text-sm font-medium text-fg-soft">The parts that matter most:</p>

          <ul className="mt-4 space-y-4">
            {points.map((point) => (
              <li key={point.title} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <div>
                  <p className="text-sm font-semibold text-fg">{point.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{point.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <a
            href={docHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-md text-sm font-medium text-brand underline underline-offset-4 transition-colors hover:text-brand-neon focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon"
          >
            {docLabel}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <p className="mt-1 text-xs text-faint">Opens in a new tab · Last updated {updated}</p>
        </div>

        <div className="border-t border-edge bg-canvas-alt/50 px-5 py-5 sm:px-7">
          {error && (
            <div role="alert" className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <label
            htmlFor="acceptance-agree"
            className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-fg-soft"
          >
            <input
              ref={checkboxRef}
              id="acceptance-agree"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-edge-light bg-canvas accent-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon"
            />
            <span>{checkboxLabel}</span>
          </label>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={onSecondary}
              disabled={submitting}
              className="h-12 sm:w-48"
            >
              {secondaryLabel}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleAccept}
              disabled={!agreed || submitting}
              className="h-12 sm:w-56"
              leftIcon={
                submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : undefined
              }
            >
              {submitting ? 'Saving…' : acceptLabel}
            </Button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-faint">{footnote}</p>
        </div>
      </div>
    </div>
  );
};

export default AcceptanceDialog;
