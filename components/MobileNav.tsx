import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Code,
  Trophy,
  UserCircle,
  ShieldCheck,
  BookOpen,
  Bell,
  LogOut,
  MoreHorizontal,
  X,
  ExternalLink,
} from 'lucide-react';

const ACADEMY_URL = 'https://academy.cyberkhana.tech';

type MobileNavItem = { icon: React.ElementType; label: string; to: string };

interface MobileNavProps {
  user?: any;
  onLogout?: () => void;
}

/**
 * Bottom navigation for mobile only. The desktop Sidebar is `hidden md:flex`,
 * so without this phones have no primary nav. The top bar is still <Header>.
 *
 * Four fixed destinations plus a More sheet. The sheet is there because the
 * sidebar carries seven entries and a bottom bar holds about five before the
 * labels stop being readable — the previous five-slot version simply dropped
 * Academy and Announcements, leaving them unreachable on a phone.
 */
const MobileNav: React.FC<MobileNavProps> = ({ user, onLogout }) => {
  const isManager = user?.role === 'admin' || user?.role === 'super-admin';
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();

  // Any navigation closes the sheet.
  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  // The sheet is a modal surface, so the page behind it must not scroll.
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const items: MobileNavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/challenges', icon: Code, label: 'Challenges' },
    { to: '/competition', icon: Target, label: 'Compete' },
    { to: '/leaderboard', icon: Trophy, label: 'Ranks' },
  ];

  const sheetLinks = [
    ...(isManager ? [{ to: '/admin', icon: ShieldCheck, label: 'Management' }] : []),
    { to: '/profile', icon: UserCircle, label: 'Profile' },
    { to: '/announcements', icon: Bell, label: 'Announcements' },
  ];

  const moreIsActive =
    sheetOpen ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/announcements');

  return (
    <>
      {/* ── More sheet ── */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="More">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 w-full bg-black/60 backdrop-blur-sm animate-fade-in"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-edge-strong bg-base pb-safe animate-slide-in">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-faint">More</p>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close menu"
                className="min-h-tap min-w-tap -me-2 flex items-center justify-center rounded-lg text-dim hover:text-fg-soft"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="px-2 pb-3">
              {sheetLinks.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-xl px-3 min-h-tap text-sm font-semibold transition-colors select-none',
                      isActive ? 'text-brand bg-brand/10' : 'text-fg-soft hover:bg-surface-hover',
                    ].join(' ')
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}

              <a
                href={ACADEMY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 min-h-tap text-sm font-semibold text-fg-soft hover:bg-surface-hover transition-colors select-none"
              >
                <BookOpen size={18} className="shrink-0" />
                <span className="flex-1 truncate">Academy</span>
                <ExternalLink size={14} className="shrink-0 text-faint" />
              </a>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 rounded-xl px-3 min-h-tap text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors select-none"
                >
                  <LogOut size={18} className="shrink-0" />
                  <span className="truncate">Log out</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* ── Bottom bar ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-base/95 backdrop-blur-md border-t border-edge-strong pb-safe"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 min-h-tap py-2 text-[10px] font-semibold transition-colors select-none',
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

          <button
            type="button"
            onClick={() => setSheetOpen((v) => !v)}
            aria-expanded={sheetOpen}
            aria-label="More"
            className={[
              'flex flex-col items-center justify-center gap-1 min-h-tap py-2 text-[10px] font-semibold transition-colors select-none',
              moreIsActive ? 'text-brand' : 'text-faint hover:text-muted',
            ].join(' ')}
          >
            <MoreHorizontal size={20} />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
