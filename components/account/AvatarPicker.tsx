import React from 'react';
import { Check } from 'lucide-react';
import CyberAvatar, { AVATAR_PRESETS, avatarValue } from '../ui/CyberAvatar';

interface AvatarPickerProps {
  /** Current selection: `avatar:<id>`, a legacy key, or '' for none. */
  value: string;
  onChange: (value: string) => void;
  displayName: string;
  disabled?: boolean;
}

/**
 * Picture chooser for the profile.
 *
 * Every option is a tile in one grid, "no picture" included — it is drawn the
 * way the initial will actually appear rather than hidden behind a Remove
 * button, because choosing the letter is the same decision as choosing the
 * ghost. Selection saves immediately; there is no form around this to submit.
 *
 * The same thirteen drawings the Academy offers, so a member who picked one
 * there finds themselves here.
 */
const AvatarPicker: React.FC<AvatarPickerProps> = ({ value, onChange, displayName, disabled }) => {
  const tileClass = (active: boolean) =>
    `group relative aspect-square overflow-hidden rounded-xl border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50 ${
      active
        ? 'border-brand ring-2 ring-brand/30'
        : 'border-edge hover:border-edge-light hover:-translate-y-0.5'
    }`;

  const Tick = () => (
    <span className="absolute end-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white shadow">
      <Check size={11} strokeWidth={3} />
    </span>
  );

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 lg:grid-cols-7">
      {/* No picture — the initial, drawn the way it will actually appear */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('')}
        aria-pressed={value === ''}
        title="No picture"
        className={tileClass(value === '')}
      >
        <span className="flex h-full w-full items-center justify-center bg-inset text-2xl font-black text-brand-neon">
          {(displayName || 'U').charAt(0).toUpperCase()}
        </span>
        {value === '' && <Tick />}
      </button>

      {AVATAR_PRESETS.map((preset) => {
        const presetValue = avatarValue(preset.id);
        const active = value === presetValue;
        return (
          <button
            key={preset.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(presetValue)}
            aria-pressed={active}
            title={preset.label}
            className={tileClass(active)}
          >
            <CyberAvatar preset={preset} className="h-full w-full" />
            {active && <Tick />}
          </button>
        );
      })}
    </div>
  );
};

export default AvatarPicker;
