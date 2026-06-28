import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Code,
  Trophy,
  UserCircle,
  BookOpen,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import Button from './EnhancedButton';
import BrandLogo from './BrandLogo';

const ACADEMY_URL = 'https://academy.cyberkhana.tech';

type MobileNavItem = {
  icon: React.ElementType;
  label: string;
  to?: string;
  href?: string;
  external?: boolean;
};

interface MobileNavigationProps {
  user: any;
  onLogout: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isManager = user?.role === 'admin' || user?.role === 'super-admin';
  const navItems: MobileNavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/competition', icon: Target, label: 'Competitions' },
    { to: '/challenges', icon: Code, label: 'Challenges' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    ...(isManager ? [{ to: '/admin', icon: ShieldCheck, label: 'Manage' }] : []),
    { href: ACADEMY_URL, external: true, icon: BookOpen, label: 'Academy' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-b border-zinc-800">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <BrandLogo variant="text" loading="eager" className="h-8 w-auto max-w-[180px] object-contain" />
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed top-16 left-0 bottom-0 z-30 w-80 max-w-[85vw] bg-black border-r border-zinc-800 transform transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* User Info */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00a859] to-[#007a42] flex items-center justify-center">
                <span className="text-xl text-white font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-zinc-100">{user?.fullName || user?.displayName || user?.username}</p>
                <p className="text-sm text-zinc-400">{user?.points} pts</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              if (item.external) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    <Icon size={20} />
                    <span className="font-medium flex-1">{item.label}</span>
                    <ExternalLink size={16} className="text-zinc-500" />
                  </a>
                );
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to!}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#00a859]/20 text-[#00a859] border border-[#00a859]/30'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-zinc-800">
            <Button variant="ghost" fullWidth onClick={onLogout} leftIcon={<LogOut size={18} />}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-zinc-800">
        <div className="grid gap-1 p-2" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-zinc-400 hover:text-zinc-100"
                >
                  <span className="relative">
                    <Icon size={20} />
                    <ExternalLink size={9} className="absolute -top-1 -right-1.5 text-zinc-500" />
                  </span>
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </a>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to!}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-[#00a859]'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`
                }
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
