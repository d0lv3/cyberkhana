
import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * The shared modal. Every caller supplies its own surface (background, border,
 * radius, padding) in its first child, so this component contributes only the
 * backdrop, the centring, and the dialog behaviour — it used to paint a
 * `bg-zinc-800 rounded-lg` panel of its own behind the caller's, which showed
 * as a second, lighter frame with a mismatched corner radius.
 *
 * Behaviour matches AcademyLinkModal, which already got this right: labelled
 * dialog role, Escape to close, the page behind it locked, focus moved in on
 * open and returned to the trigger on close, and Tab kept inside.
 */
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  /* A click only counts as "on the backdrop" if it STARTED there. Without this,
     selecting text inside a form and releasing past the panel edge resolves the
     click on the backdrop and throws the entry away. */
  const pressStartedOnBackdrop = useRef(false);
  const titleId = useId();

  /* Callers pass an inline arrow for onClose, so its identity changes on every
     render. Depending on it directly would re-run the effect below constantly —
     re-focusing the panel out from under whatever the user was typing in, and
     firing the focus-restore cleanup on every keystroke. Read it through a ref
     so the effect depends on isOpen alone. */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the panel itself rather than guessing at a control inside it, so a
    // screen reader announces the dialog before its contents.
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      // Queried on every Tab, not cached, so content that appears after open
      // (an expanded section, a newly rendered row) is included.
      const focusable = (
        Array.from(
          panel.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ) as HTMLElement[]
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4"
      onMouseDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressStartedOnBackdrop.current) onClose();
        pressStartedOnBackdrop.current = false;
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : 'Dialog'}
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`w-full ${className || 'max-w-md'} animate-modal-enter relative focus:outline-none`}
      >
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h2 id={titleId} className="text-xl font-bold text-fg">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="flex min-h-tap min-w-tap items-center justify-center rounded-lg text-muted transition-colors hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon"
            >
              <X size={24} />
            </button>
          </div>
        )}
        {!title && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            /* top-1.5/right-1.5 with a 44px box puts the glyph's centre exactly
               where the old 24px icon at top-4/right-4 sat, so nothing moves —
               only the hit region grows to a usable size. */
            className="absolute top-1.5 right-1.5 z-10 flex h-11 w-11 items-center justify-center rounded-lg text-muted transition-colors hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon"
          >
            <X size={24} />
          </button>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
