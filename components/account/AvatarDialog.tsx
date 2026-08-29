import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import AvatarPicker from './AvatarPicker';
import CyberAvatar, { presetFor } from '../ui/CyberAvatar';

interface AvatarDialogProps {
  open: boolean;
  /** The picture currently saved on the account. */
  value: string;
  displayName: string;
  saving?: boolean;
  error?: string;
  onClose: () => void;
  /** Called with the chosen value when the member commits. */
  onSave: (value: string) => void;
}

/**
 * Picture chooser, behind a deliberate open.
 *
 * The grid used to sit open on the profile as its own card, which put fourteen
 * tiles of chrome in front of everyone permanently to serve a decision most
 * people make once. It is an edit, so it lives behind an edit control and gets
 * the shape an edit has: a draft you can see, Save to commit, Cancel to put the
 * old picture back — the same contract as the name field further down the page.
 */
const AvatarDialog: React.FC<AvatarDialogProps> = ({
  open,
  value,
  displayName,
  saving,
  error,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState(value);

  // Re-open always starts from what is actually saved, never from a discarded
  // draft left behind by the last Cancel.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const preset = presetFor(draft);
  const dirty = draft !== value;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-dialog-title"
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm animate-fade-in"
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-edge bg-panel shadow-2xl animate-modal-enter">
        <div className="flex items-center gap-3 border-b border-edge px-5 py-4">
          {/* Live preview, in the frame the profile actually uses. */}
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden border-2 border-brand/40 bg-inset"
            style={{ clipPath: 'polygon(25% 6%,75% 6%,94% 25%,94% 75%,75% 94%,25% 94%,6% 75%,6% 25%)' }}
          >
            {preset ? (
              <CyberAvatar preset={preset} className="h-full w-full" title={displayName} />
            ) : (
              <span className="text-lg font-black text-brand-neon">
                {(displayName || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="avatar-dialog-title" className="text-base font-bold text-fg">
              Choose your picture
            </h2>
            <p className="truncate text-xs text-muted">
              Shown on your profile, in the sidebar and on the leaderboard.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-shrink-0 touch:h-11 touch:w-11 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-hover hover:text-fg-soft"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-5">
          <AvatarPicker
            value={preset ? draft : ''}
            onChange={setDraft}
            displayName={displayName}
            disabled={saving}
          />
        </div>

        <div className="flex items-center gap-3 border-t border-edge px-5 py-4">
          {error ? <p className="min-w-0 flex-1 truncate text-xs text-red-400">{error}</p> : <div className="flex-1" />}
          {/* Equal widths, one row, matched heights. */}
          <div className="grid w-full max-w-[15rem] grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-10 items-center justify-center rounded-lg border border-edge text-sm font-semibold text-muted transition-colors hover:border-edge-light hover:text-fg-soft disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              disabled={saving || !dirty}
              className="flex h-10 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white transition-colors hover:bg-brand-deep disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarDialog;
