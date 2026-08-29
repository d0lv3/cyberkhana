import React from 'react';
import CyberAvatar, { presetFor } from './CyberAvatar';

interface AvatarProps {
  /** The user's `profileIcon`: `avatar:<id>`, a legacy key, or nothing. */
  profileIcon?: string | null;
  /** Falls back to this name's first letter when there is no preset. */
  name?: string | null;
  /** Tailwind sizing/rounding for the frame, e.g. "w-10 h-10 rounded-lg". */
  className?: string;
  /** Font size for the initial fallback, e.g. "text-3xl". */
  initialClassName?: string;
}

/**
 * The one place that decides what a member's picture is: a built-in preset if
 * they picked one, otherwise the first letter of their name. Accounts created
 * before the preset set existed carry keys like 'default' or 'hacker', which
 * resolve to no preset and so land on the initial rather than a broken image —
 * the /avatars/*.svg files those keys pointed at were never shipped.
 */
const Avatar: React.FC<AvatarProps> = ({
  profileIcon,
  name,
  className = 'w-10 h-10 rounded-lg',
  initialClassName = 'text-base',
}) => {
  const preset = presetFor(profileIcon);
  const frame = `${className} overflow-hidden border border-edge flex-shrink-0`;

  if (preset) {
    return (
      <div className={frame}>
        <CyberAvatar preset={preset} className="w-full h-full" title={name ?? undefined} />
      </div>
    );
  }

  return (
    <div className={`${frame} bg-inset flex items-center justify-center`}>
      <span className={`${initialClassName} font-black text-brand-neon`}>
        {(name || 'U').charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

export default Avatar;
