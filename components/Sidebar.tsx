import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  UserCircle,
  Code,
  Target,
  BookOpen,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import BrandLogo from './ui/BrandLogo';

const ACADEMY_URL = 'https://academy.cyberkhana.tech';

type NavItem = {
  icon: React.ElementType;
  label: string;
  to?: string;
  href?: string;
  external?: boolean;
};

const Sidebar: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user?.role === 'admin' || user?.role === 'super-admin';

  const navItems: NavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/competition', icon: Target, label: 'Competitions' },
    { to: '/challenges', icon: Code, label: 'Challenges' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    ...(isManager ? [{ to: '/admin', icon: ShieldCheck, label: 'Management' }] : []),
    { href: ACADEMY_URL, external: true, icon: BookOpen, label: 'Academy' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col hidden md:flex h-screen sticky top-0 bg-[#0d1117] border-r border-[#1e293b]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1e293b]">
        <BrandLogo
          variant="text"
          loading="eager"
          className="h-8 w-auto max-w-[160px] object-contain"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-bold tracking-[0.15em] text-[#6e7a94] uppercase">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.external) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-[#9aa5bf] hover:bg-[#182235] hover:text-[#d2d7e3] border border-transparent"
              >
                <Icon
                  className="w-4.5 h-4.5 flex-shrink-0 text-[#6e7a94] group-hover:text-[#9aa5bf] transition-colors"
                  size={17}
                />
                <span className="flex-1">{item.label}</span>
                <ExternalLink
                  size={13}
                  className="text-[#6e7a94] group-hover:text-[#9aa5bf] transition-colors"
                />
              </a>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to!}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#00a859]/12 text-[#00a859] border border-[#00a859]/20'
                    : 'text-[#9aa5bf] hover:bg-[#182235] hover:text-[#d2d7e3] border border-transparent',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active left accent line */}
                  {isActive && (
                    <span className="absolute left-0 w-0.5 h-6 bg-[#00a859] rounded-r" />
                  )}
                  <Icon
                    className={`w-4.5 h-4.5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#00a859]' : 'text-[#6e7a94] group-hover:text-[#9aa5bf]'
                    }`}
                    size={17}
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={13} className="text-[#00a859]/60" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User mini-card */}
      <div className="px-3 py-4 border-t border-[#1e293b]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#121a2a] border border-[#263248]">
          <div className="w-8 h-8 rounded-full bg-[#0e1522] border border-[#263248] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-black text-[#9fef00]">
              {(user?.fullName || user?.displayName || user?.username || 'U')
                .charAt(0)
                .toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#d2d7e3] truncate">
              {user?.fullName || user?.displayName || user?.username}
            </p>
            <p className="text-[10px] text-[#9fef00] font-bold">
              {user?.points ?? 0} pts
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;