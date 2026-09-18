
import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

/** Collapsed state is a workspace preference, so it survives a reload. */
const SIDEBAR_KEY = 'platform-sidebar-collapsed';

interface AppLayoutProps {
    onLogout: () => void;
    /** Live user from App state; falls back to localStorage if not passed. */
    user?: any;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout, user: userProp }) => {
  const user = userProp ?? JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();
  const isEdgeToEdge = location.pathname.match(/^\/(challenges|dashboard)/);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === 'true');

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0, left: 0 }); }, [location.pathname]);

  return (
    <div className="flex app-shell text-fg-soft bg-canvas">
      <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header user={user} onLogout={onLogout} />
        {/* overflow-x-hidden, not auto: a child that outgrows the phone should
            scroll inside its own box, never pan the whole shell sideways and
            take the header with it. */}
        <main
          ref={mainRef}
          className={`app-main min-h-0 flex-1 overflow-y-auto overflow-x-hidden scroll-contain ${
            isEdgeToEdge ? 'p-0' : 'p-4 sm:p-6 md:p-8'
          }`}
        >
          {/* Clears the fixed bottom nav (56px) plus the home indicator. */}
          <div
            className={`${isEdgeToEdge ? 'max-w-none' : 'max-w-7xl'} mx-auto min-w-0 mobile-nav-clearance md:pb-0`}
          >
             <Outlet />
          </div>
        </main>
      </div>
      <MobileNav user={user} onLogout={onLogout} />
    </div>
  );
};

export default AppLayout;