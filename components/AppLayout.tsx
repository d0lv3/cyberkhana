
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
    onLogout: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();
  const isEdgeToEdge = location.pathname.match(/^\/(challenges|dashboard)/);

  return (
    <div className="flex h-screen text-[#d2d7e3] bg-[#0d1117]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={user} onLogout={onLogout} />
        <main className={`flex-1 overflow-y-auto ${isEdgeToEdge ? 'p-0' : 'p-4 sm:p-6 md:p-8'}`}>
          <div className={isEdgeToEdge ? 'max-w-none mx-auto' : 'max-w-7xl mx-auto'}>
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;