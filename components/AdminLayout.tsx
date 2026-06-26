import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Users, LogOut, Bell } from 'lucide-react';
import Button from './ui/button';
import BrandLogo from './ui/BrandLogo';

interface AdminLayoutProps {
    onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.role === 'super-admin';
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
      isActive
        ? 'bg-[#00a859]/15 text-[#00a859]'
        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
    }`;

    return (
        <div className="flex h-screen bg-[#050505] text-zinc-200">
            <aside className="w-64 flex-shrink-0 bg-black border-r border-zinc-800 p-4 hidden md:flex md:flex-col">
                <div className="px-2 py-4">
                    <BrandLogo
                      variant="text"
                                            loading="eager"
                      className="h-10 w-auto max-w-[220px] object-contain"
                    />
                </div>
                <nav className="mt-8 flex flex-col gap-2">
                    <NavLink to="/admin" end className={navLinkClasses}>
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </NavLink>
                    {!isSuperAdmin && (
                        <>
                            <NavLink to="/admin/competitions" className={navLinkClasses}>
                                <ShieldCheck className="w-5 h-5 mr-3" />
                                Competitions
                            </NavLink>
                            <NavLink to="/admin/challenges" className={navLinkClasses}>
                                <ShieldCheck className="w-5 h-5 mr-3" />
                                Challenges
                            </NavLink>
                            <NavLink to="/admin/announcements" className={navLinkClasses}>
                                <Bell className="w-5 h-5 mr-3" />
                                Announcements
                            </NavLink>
                        </>
                    )}
                    <NavLink to="/admin/users" className={navLinkClasses}>
                        <Users className="w-5 h-5 mr-3" />
                        Users
                    </NavLink>
                </nav>
                <div className="mt-auto">
                    <Button variant="secondary" onClick={onLogout} className="w-full">
                        <LogOut size={16} />
                        <span>Logout</span>
                    </Button>
                </div>
            </aside>
             <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;