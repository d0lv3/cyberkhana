import React, { useEffect, useRef } from 'react';

/** Native modal semantics keep focus and touch interaction inside the sheet. */
export default function MobileSheet({ open, onClose, label, children }: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const panel = dialog.current!;
    const trigger = document.activeElement as HTMLElement | null;
    const scroller = document.querySelector<HTMLElement>('.app-main');
    const overflow = scroller?.style.overflow;
    if (scroller) scroller.style.overflow = 'hidden';
    panel.showModal();
    const desktop = window.matchMedia('(min-width: 768px)');
    const onResize = () => { if (desktop.matches) close.current(); };
    desktop.addEventListener('change', onResize);
    onResize();
    return () => {
      desktop.removeEventListener('change', onResize);
      panel.close();
      if (scroller) scroller.style.overflow = overflow ?? '';
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return (
    <dialog ref={dialog} className="mobile-sheet" aria-label={label}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="mobile-sheet-panel">
        <div className="mobile-sheet-handle" aria-hidden="true" />
        {children}
      </div>
    </dialog>
  );
}
