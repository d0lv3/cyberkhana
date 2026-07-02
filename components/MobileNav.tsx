import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, Code, Trophy, UserCircle, ShieldCheck } from 'lucide-react';

type MobileNavItem = { icon: React.ElementType; label: string; to: string };

interface MobileNavProps {
  user?: any;
}

/**
 * Bottom navigation for mobile only. The desktop Sidebar is `hidden md:flex`,
 * so without this phones had no primary nav. Palette matches the app shell
 * (navy + brand green); the top bar is still handled by <Header>.
 */
const MobileNav: React.FC<MobileNavProps> = ({ user }) => {
  const isManager = user?.role === 'admin' || user?.role === 'super-admin';

  const items: MobileNavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/competition', icon: Target, label: 'Compete' },
    { to: '/challenges', icon: Code, label: 'Challenges' },
    { to: '/leaderboard', icon: Trophy, label: 'Ranks' },
    ...(isManager
      ? [{ to: '/admin', icon: ShieldCheck, label: 'Manage' } as MobileNavItem]
      : [{ to: '/profile', icon: UserCircle, label: 'Profile' } as MobileNavItem]),
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-base/95 backdrop-blur-md border-t border-edge-strong"
      aria-label="Primary"
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-colors',
                isActive ? 'text-brand' : 'text-faint hover:text-muted',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-brand' : 'text-faint'} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
