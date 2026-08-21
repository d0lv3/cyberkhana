import React from 'react';
import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Flag, Bell, Users, Building2 } from 'lucide-react';

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

/** Only admins and super-admins may enter the management area. */
export const ManagementGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const role = getUser()?.role;
  if (role !== 'admin' && role !== 'super-admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

interface Tab {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
}

const ManagementLayout: React.FC = () => {
  const user = getUser();
  const isSuperAdmin = user?.role === 'super-admin';

  const tabs: Tab[] = isSuperAdmin
    ? [
        { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
        { to: '/admin/users', label: 'Users', icon: Users },
      ]
    : [
        { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
        { to: '/admin/competitions', label: 'Competitions', icon: ShieldCheck },
        { to: '/admin/challenges', label: 'Challenges', icon: Flag },
        { to: '/admin/announcements', label: 'Announcements', icon: Bell },
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/university', label: 'University', icon: Building2 },
      ];

  return (
    <div className="space-y-6 min-w-0">
      <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-panel px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-neon">
        <ShieldCheck size={12} />
        Management
      </div>

      {/* Sub-nav tabs. Six of them never fit a phone, so the strip scrolls
          horizontally rather than wrapping into a second row that would push
          the page content down on every admin screen. */}
      <div className="scroll-x flex gap-1 border-b border-edge">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition-colors select-none touch:min-h-tap',
                isActive
                  ? 'border-brand text-brand bg-brand/8'
                  : 'border-transparent text-muted hover:text-fg-soft hover:bg-surface-hover',
              ].join(' ')
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
};

export default ManagementLayout;
