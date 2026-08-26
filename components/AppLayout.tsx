
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';

interface AppLayoutProps {
    onLogout: () => void;
    /** Live user from App state; falls back to localStorage if not passed. */
    user?: any;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout, user: userProp }) => {
  const user = userProp ?? JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();
  const isEdgeToEdge = location.pathname.match(/^\/(challenges|dashboard)/);

  return (
    <div className="flex app-shell text-fg-soft bg-canvas">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header user={user} onLogout={onLogout} />
        {/* overflow-x-hidden, not auto: a child that outgrows the phone should
            scroll inside its own box, never pan the whole shell sideways and
            take the header with it. */}
        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden scroll-contain ${
            isEdgeToEdge ? 'p-0' : 'p-4 sm:p-6 md:p-8'
          }`}
        >
          {/* Clears the fixed bottom nav (56px) plus the home indicator. */}
          <div
            className={`${isEdgeToEdge ? 'max-w-none' : 'max-w-7xl'} mx-auto min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0`}
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