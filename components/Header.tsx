import React from 'react';
import { User } from '../types';
import { LogOut, Bell, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from './ui/BrandLogo';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="flex-shrink-0 bg-[#0d1117]/95 border-b border-[#1e293b] backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Mobile logo */}
        <Link to="/dashboard" className="md:hidden">
          <BrandLogo variant="mark" loading="eager" className="h-7 w-7 object-contain" />
        </Link>

        {/* Spacer on desktop (sidebar has logo) */}
        <div className="hidden md:block" />

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* User info */}
          <div className="hidden sm:flex flex-col items-end mr-1">
            <p className="text-xs font-semibold text-[#d2d7e3] truncate max-w-[140px]" title={user.fullName || user.displayName || user.username || user.name}>
              {user.fullName || user.displayName || user.username || user.name}
            </p>
            <p className="text-[10px] text-[#9fef00] font-bold">{user.points ?? 0} pts</p>
          </div>

          {/* Announcements */}
          <Link
            to="/announcements"
            aria-label="Announcements"
            className="w-9 h-9 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-[#00a859] hover:border-[#00a859]/40 transition-all"
          >
            <Bell size={16} />
          </Link>

          {/* Profile */}
          <Link
            to="/profile"
            aria-label="My Profile"
            className="w-9 h-9 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-[#00a859] hover:border-[#00a859]/40 transition-all"
          >
            <UserIcon size={16} />
          </Link>

          {/* Logout */}
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="w-9 h-9 rounded-lg bg-[#121a2a] border border-[#263248] flex items-center justify-center text-[#8390ac] hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;