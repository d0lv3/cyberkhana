
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
    <div className="flex h-screen text-[#d2d7e3] bg-[#0d1117]">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={user} onLogout={onLogout} />
        <main className={`flex-1 overflow-y-auto ${isEdgeToEdge ? 'p-0' : 'p-4 sm:p-6 md:p-8'}`}>
          {/* pb on mobile keeps content clear of the fixed bottom nav */}
          <div className={`${isEdgeToEdge ? 'max-w-none' : 'max-w-7xl'} mx-auto pb-16 md:pb-0`}>
             <Outlet />
          </div>
        </main>
      </div>
      <MobileNav user={user} />
    </div>
  );
};

export default AppLayout;