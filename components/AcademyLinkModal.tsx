import React, { useEffect, useRef } from 'react';
import { BookOpen, ExternalLink, Languages, Route, Terminal, X } from 'lucide-react';
import BrandLogo from './ui/BrandLogo';

export const ACADEMY_URL = 'https://academy.cyberkhana.tech';

/* What the Academy is, in the words the marketing site already uses for it —
 * so a student who read cyberkhana.tech and a student who only ever sees this
 * dialog are told the same thing. */
const POINTS = [
  { icon: Route, text: 'Fundamentals, then modules, then career paths' },
  { icon: Terminal, text: 'Real Python, C and Bash, run in the browser' },
  { icon: Languages, text: 'Full Arabic and English support' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Interstitial for the one navigation item that leaves the platform.
 *
 * It exists because "Academy" sits in the sidebar next to five in-app routes
 * and looks exactly like them, so following it silently swaps the tab out from
 * under someone mid-session. Naming the destination and what is on the other
 * side turns that into a choice.
 */
const AcademyLinkModal: React.FC<Props> = ({ open, onClose }) => {
  const confirmRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // The dialog is a modal surface, so the page behind it must not scroll.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    confirmRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="academy-modal-title"
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm animate-fade-in"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-edge bg-panel shadow-2xl animate-modal-enter">
        {/* Masthead: the lockup over its own glow, so the brand is the first
            thing read rather than a line of text describing it. */}
        <div className="relative overflow-hidden border-b border-edge bg-inset px-6 pb-6 pt-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_50%_0%,rgba(159,239,0,0.16),transparent_65%)]" />
          <BookOpen
            aria-hidden
            strokeWidth={1.1}
            className="pointer-events-none absolute -end-6 -top-4 h-40 w-40 text-brand-neon/[0.07]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute end-3 top-3 z-10 flex h-8 w-8 touch:h-11 touch:w-11 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-hover hover:text-fg-soft"
          >
            <X size={16} />
          </button>

          <div className="relative flex flex-col items-center text-center">
            <BrandLogo
              variant="academy"
              loading="eager"
              className="h-9 w-auto max-w-[220px] object-contain"
            />
            <h2 id="academy-modal-title" className="mt-4 text-lg font-bold text-fg">
              Learn cybersecurity. Your way. Your language.
            </h2>
            <p className="mt-2 text-sm text-muted">
              A weekly workshop cannot build a security engineer. The Academy is where you go the
              other six days of the week — everything hands-on, everything in the browser.
            </p>
          </div>
        </div>

        <div className="p-6">
          <ul className="space-y-2.5">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-fg-soft">
                <Icon size={15} className="mt-0.5 flex-shrink-0 text-brand" />
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-lg border border-edge bg-inset px-3 py-2.5">
            <p className="text-xs text-faint">You are leaving the platform for</p>
            <p className="truncate font-mono text-sm font-semibold text-fg-soft" dir="ltr">
              academy.cyberkhana.tech
            </p>
          </div>

          {/* Equal widths, one row, matched heights — the two buttons are one
              control pair, not a primary with a link stuck beside it. */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 items-center justify-center rounded-lg border border-edge text-sm font-semibold text-muted transition-colors hover:border-edge-light hover:text-fg-soft"
            >
              Stay here
            </button>
            <a
              ref={confirmRef}
              href={ACADEMY_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-deep text-sm font-bold text-white transition-colors hover:bg-brand-press focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              Open Academy
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademyLinkModal;
