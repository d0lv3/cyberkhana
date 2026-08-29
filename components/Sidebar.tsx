import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  UserCircle,
  Code,
  Target,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import BrandLogo from './ui/BrandLogo';
import Avatar from './ui/Avatar';
import AcademyLinkModal from './AcademyLinkModal';

type NavItem = {
  icon: React.ElementType;
  label: string;
  to?: string;
  /** Leaves the platform — routed through the interstitial, not a bare link. */
  external?: boolean;
};

interface SidebarProps {
  /** Live user from App state; falls back to localStorage if not passed. */
  user?: any;
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user: userProp, collapsed, onToggle }) => {
  const user = userProp ?? JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user?.role === 'admin' || user?.role === 'super-admin';
  /* Which icon is mid-shake, plus a bumping sequence number. The number is the
     point: without it, tapping the tab you are already on sets the same state,
     React re-renders nothing, and the animation never restarts. Feeding it to
     the icon's key remounts the element, which does. */
  const [shake, setShake] = useState<{ key: string; seq: number }>({ key: '', seq: 0 });
  const kick = (key: string) => setShake((s) => ({ key, seq: s.seq + 1 }));
  const [academyOpen, setAcademyOpen] = useState(false);

  const navItems: NavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/competition', icon: Target, label: 'Competitions' },
    { to: '/challenges', icon: Code, label: 'Challenges' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    ...(isManager ? [{ to: '/admin', icon: ShieldCheck, label: 'Management' }] : []),
    { external: true, icon: BookOpen, label: 'Academy' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const displayName = user?.fullName || user?.displayName || user?.username || 'Operator';

  const iconClass = (extra: string, key: string) =>
    `flex-shrink-0 transition-colors ${shake.key === key ? 'nav-shake' : ''} ${extra}`;

  /* The aside's own z-40 is load-bearing, not decoration. `position: sticky`
     makes this element a stacking context, so the toggle's z-40 is trapped
     inside it and counts for nothing against the page: the Challenges hero
     (z-10) and its sticky category bar (z-30) painted straight over the half of
     the button that overhangs the rail. Raising the aside lifts the whole
     subtree above them; the header is z-30 and the Academy dialog z-80, so
     nothing else moves. */
  return (
    <>
      <aside
        className={`hidden md:flex relative z-40 flex-col flex-shrink-0 h-screen sticky top-0 bg-canvas border-r border-edge-strong transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        {/* Logo — the full wordmark has nowhere to go at 68px, so the collapsed
            rail wears the mark on its own. */}
        <div
          className={`flex items-center border-b border-edge-strong ${
            collapsed ? 'justify-center px-2 py-5' : 'px-5 py-5'
          }`}
        >
          <BrandLogo
            variant={collapsed ? 'collapsed' : 'text'}
            loading="eager"
            className={collapsed ? 'h-8 w-8 object-contain' : 'h-8 w-auto max-w-[160px] object-contain'}
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.external) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    kick(item.label);
                    setAcademyOpen(true);
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`group w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 text-muted hover:bg-surface-hover hover:text-fg-soft border border-transparent ${
                    collapsed ? 'justify-center px-2.5 py-2.5' : 'px-3 py-2.5'
                  }`}
                >
                  <Icon
                    key={shake.key === item.label ? shake.seq : 'idle'}
                    onAnimationEnd={() => setShake({ key: '', seq: shake.seq })}
                    className={iconClass('text-faint group-hover:text-muted', item.label)}
                    size={collapsed ? 20 : 17}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ExternalLink
                        size={13}
                        className="text-faint group-hover:text-muted transition-colors"
                      />
                    </>
                  )}
                </button>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to!}
                onClick={() => kick(item.to!)}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    'group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                    collapsed ? 'justify-center px-2.5 py-2.5' : 'px-3 py-2.5',
                    isActive
                      ? 'bg-brand/12 text-brand border border-brand/20'
                      : 'text-muted hover:bg-surface-hover hover:text-fg-soft border border-transparent',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active left accent line */}
                    {isActive && <span className="absolute left-0 w-0.5 h-6 bg-brand rounded-r" />}
                    <Icon
                      key={shake.key === item.to ? shake.seq : 'idle'}
                      // Active tabs read as "filled": the glyph gets a
                      // translucent wash of the accent while the stroke keeps
                      // it legible.
                      fill={isActive ? 'currentColor' : 'none'}
                      fillOpacity={isActive ? 0.2 : 0}
                      onAnimationEnd={() => setShake({ key: '', seq: shake.seq })}
                      className={iconClass(
                        isActive ? 'text-brand' : 'text-faint group-hover:text-muted',
                        item.to!,
                      )}
                      size={collapsed ? 20 : 17}
                    />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {!collapsed && isActive && <ChevronRight size={13} className="text-brand/60" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User mini-card */}
        <div className="px-3 py-4 border-t border-edge-strong">
          {collapsed ? (
            <div className="flex justify-center">
              <Avatar
                profileIcon={user?.profileIcon}
                name={displayName}
                className="w-9 h-9 rounded-full"
                initialClassName="text-sm"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-panel border border-edge">
              <Avatar
                profileIcon={user?.profileIcon}
                name={displayName}
                className="w-8 h-8 rounded-full"
                initialClassName="text-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-fg-soft truncate">{displayName}</p>
                <p className="text-[11px] text-brand-neon font-bold">{user?.points ?? 0} pts</p>
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle — rides the sidebar's inner edge so it never covers
            a nav row and never moves when the rail resizes. */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-[68px] -right-3 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-edge bg-panel text-faint shadow-md shadow-black/40 transition-all duration-200 hover:scale-110 hover:border-brand/60 hover:bg-inset hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      <AcademyLinkModal open={academyOpen} onClose={() => setAcademyOpen(false)} />
    </>
  );
};

export default Sidebar;
