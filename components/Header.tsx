import React from 'react';
import { User } from '../types';
import { LogOut, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from './ui/BrandLogo';
import Avatar from './ui/Avatar';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const displayName = user.fullName || user.displayName || user.username || user.name;

  return (
    <header className="flex-shrink-0 bg-canvas/95 border-b border-edge-strong backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Mobile logo */}
        <Link to="/dashboard" aria-label="CyberKhana" className="md:hidden inline-flex items-center justify-center touch:min-h-tap touch:min-w-tap">
          <BrandLogo variant="mark" loading="eager" className="h-7 w-7 object-contain" />
        </Link>

        {/* Spacer on desktop (sidebar has logo) */}
        <div className="hidden md:block" />

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Announcements */}
          {/* All three controls share one height so the row has a flat top and
              bottom edge. The profile pill's height used to be whatever its
              padding plus a 32px avatar came to (42px), leaving the two icon
              buttons 6px shorter beside it. */}
          <Link
            to="/announcements"
            aria-label="Announcements"
            className="w-10 h-10 touch:w-11 touch:h-11 rounded-lg bg-panel border border-edge flex items-center justify-center text-dim hover:text-brand hover:border-brand/40 transition-all"
          >
            <Bell size={16} />
          </Link>

          {/* Profile.
              One control, not three: the picture, the name and the score were
              a label, a link and a button sitting next to each other and all
              standing for the same person. They are now the single thing you
              press to reach your profile — which is also where the picture is
              chosen, so this is where you see the choice took effect.
              Below sm the name and score drop and the avatar carries it. */}
          <Link
            to="/profile"
            aria-label="My profile"
            className="group flex h-10 touch:h-11 items-center gap-2.5 rounded-lg border border-edge bg-panel p-1 pe-1 sm:pe-3 transition-colors hover:border-brand/40 hover:bg-surface-hover"
          >
            <Avatar
              profileIcon={(user as any)?.profileIcon}
              name={displayName}
              className="w-7 h-7 touch:w-8 touch:h-8 rounded-md border-0"
              initialClassName="text-sm"
            />
            <span className="hidden sm:flex min-w-0 flex-col leading-tight">
              <span
                className="truncate max-w-[140px] text-xs font-semibold text-fg-soft transition-colors group-hover:text-fg"
                title={displayName}
              >
                {displayName}
              </span>
              <span className="text-[11px] font-bold text-brand-neon">{user.points ?? 0} pts</span>
            </span>
          </Link>

          {/* Logout */}
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="w-10 h-10 touch:w-11 touch:h-11 rounded-lg bg-panel border border-edge flex items-center justify-center text-dim hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;