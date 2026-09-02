import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code,
  Target,
  Flag,
  BookOpen,
  Activity,
  Award,
  ExternalLink,
} from 'lucide-react';
import { userService } from '../services/userService';
import { activityService } from '../services/activityService';
import { categoryAccent } from '../components/challenges/ChallengeArt';
import BrandLogo from '../components/ui/BrandLogo';

/* ── Colour on this page ──
 * Two meanings, nothing else. Brand green marks what the operator has earned
 * (score, points won, their own progress); a category hue marks which
 * discipline something belongs to, and matches the dot on the Challenges page.
 * Every other surface, icon and number is neutral. The page used to spend five
 * unrelated hues on four stat tiles that all measure the same person. */

interface UserStats {
  points: number;
  solvedCount: number;
  rank?: number;
  totalUsers?: number;
  streak?: number;
  favoriteCategory?: string;
}

interface RecentActivity {
  id: string;
  challengeTitle: string;
  category: string;
  points: number;
  solvedAt: string;
}

/** Most-frequent category across recent solves — the real "focus area". */
const computeFavoriteCategory = (activities: RecentActivity[]): string | undefined => {
  if (!activities || activities.length === 0) return undefined;
  const counts: Record<string, number> = {};
  for (const a of activities) {
    if (a.category) counts[a.category] = (counts[a.category] || 0) + 1;
  }
  let best: string | undefined;
  let bestN = 0;
  for (const [cat, n] of Object.entries(counts)) {
    if (n > bestN) {
      best = cat;
      bestN = n;
    }
  }
  return best;
};

const NewDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<UserStats>({ points: 0, solvedCount: 0 });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Fetch Profile and Activity in parallel
        const [profile, activityData] = await Promise.all([
          userService.getUserProfile(),
          activityService.getRecentActivity(),
        ]);

        // Derive the focus area from real recent activity rather than a placeholder.
        const favoriteCategory = computeFavoriteCategory(activityData);

        setStats({
          points: profile.points || 0,
          solvedCount: profile.solvedChallenges?.length || 0,
          rank: profile.rank,
          totalUsers: profile.totalUsers,
          favoriteCategory,
        });
        setRecentActivity(activityData);

        // Keep the cached user.points (shown in the sidebar/header) in sync with
        // the authoritative recomputed value so they don't disagree with this page.
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          const next = {
            points: profile.points || 0,
            competitionPoints: profile.competitionPoints || 0,
            unlockedHints: profile.unlockedHints || []
          };
          // competitionPoints and unlockedHints were never synced here. Login
          // does not return them either, so they stayed undefined and the
          // competition hint button read "Not enough competition points"
          // regardless of the real balance.
          const changed =
            stored.points !== next.points ||
            stored.competitionPoints !== next.competitionPoints ||
            (stored.unlockedHints || []).length !== next.unlockedHints.length;

          if (changed) {
            const merged = { ...stored, ...next };
            localStorage.setItem('user', JSON.stringify(merged));
            window.dispatchEvent(new CustomEvent('userUpdate', { detail: merged }));
          }
        } catch {
          /* non-fatal */
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-32 bg-panel rounded-2xl animate-pulse border border-edge" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-panel rounded-xl animate-pulse border border-edge" />
          ))}
        </div>
      </div>
    );
  }

  const displayName = user?.fullName || user?.displayName || user?.username || 'Operator';

  // Real percentile from rank/total (e.g. rank 3 of 60 → "Top 5%").
  const topPercent =
    stats.rank && stats.totalUsers && stats.totalUsers > 0
      ? Math.max(1, Math.round((stats.rank / stats.totalUsers) * 100))
      : null;
  const rankBarPct = topPercent !== null ? Math.min(100, Math.max(4, 100 - topPercent)) : 0;

  // Specialization = share of the focus category among recent solves.
  const specializationPct =
    stats.favoriteCategory && recentActivity.length > 0
      ? Math.round(
          (recentActivity.filter((a) => a.category === stats.favoriteCategory).length /
            recentActivity.length) *
            100
        )
      : 0;

  return (
    <div className="text-fg-soft pb-24 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── COMMAND CENTER HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl border border-edge bg-panel overflow-hidden p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(159,239,0,0.05),transparent_60%)] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className="relative z-10 w-full md:w-auto text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-fg tracking-tight">
              Welcome back,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-neon to-brand">
                {displayName}
              </span>
            </h1>
            <p className="mt-3 text-muted font-medium">
              {user?.universityName || user?.universityCode} ·{' '}
              {stats.solvedCount > 0
                ? `${stats.solvedCount} ${stats.solvedCount === 1 ? 'operation' : 'operations'} successful`
                : 'Awaiting first operation'}
            </p>
          </div>

          <div className="relative z-10 flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:w-32 bg-inset border border-edge rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-dim mb-1">Global rank</p>
              <p className="text-2xl font-black text-fg">#{stats.rank || '–'}</p>
            </div>
            <div className="flex-1 md:w-32 bg-inset border border-edge rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-dim mb-1">Total score</p>
              <p className="text-2xl font-black text-brand-neon">{stats.points.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {/* ── METRICS GRID ── */}
        {/* Three tiles, not four: the hero already states the rank, and a grid
            that repeats it is a grid with nothing to say. */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Flags captured', value: stats.solvedCount, icon: Flag },
            { label: 'Percentile', value: topPercent !== null ? `Top ${topPercent}%` : '–', icon: Activity },
            {
              label: 'Focus area',
              value: stats.favoriteCategory ? stats.favoriteCategory.split(' ')[0] : '–',
              icon: Target,
              // The only tile that names a discipline, so the only one that
              // gets to carry that discipline's colour.
              dot: stats.favoriteCategory ? categoryAccent(stats.favoriteCategory) : undefined,
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-panel border border-edge rounded-xl p-4 flex items-center gap-4 min-w-0"
              >
                <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center border border-edge bg-inset">
                  <Icon className="w-5 h-5 text-muted" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-dim">{stat.label}</p>
                  <p className="text-xl font-black text-fg leading-none mt-1 truncate flex items-center gap-2">
                    {stat.dot && (
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: stat.dot }} />
                    )}
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── MAIN DASHBOARD SPLIT ──
            min-w-0 on the columns: a grid item's min-width defaults to auto,
            so the widest thing in either column sets that column's floor and
            pushes the layout past the screen instead of wrapping. */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">

          {/* LEFT COLUMN: Main Focus */}
          <div className="space-y-6 min-w-0">
            
            {/* CyberKhana Academy — external.
                The lockup carries the name, so there is no set-in-caps label
                repeating it, and the book is a full-bleed watermark rather than
                a boxed icon: one framed square next to another framed square
                was two competing objects saying the same thing. */}
            <motion.a
              href="https://academy.cyberkhana.tech"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="group relative block overflow-hidden rounded-2xl border border-edge bg-panel transition-colors hover:border-brand/40"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/8 via-transparent to-transparent" />

              {/* Watermark book — clipped by the card, so it reads as texture
                  rather than as an icon someone forgot to size. */}
              <BookOpen
                aria-hidden
                strokeWidth={1.1}
                className="pointer-events-none absolute -end-12 -top-8 h-56 w-56 text-brand-neon/[0.07] transition-transform duration-500 group-hover:scale-105 sm:-end-8 sm:h-72 sm:w-72"
              />

              <div className="relative z-10 p-6 sm:p-7">
                <BrandLogo
                  variant="academy"
                  className="h-7 w-auto max-w-[190px] object-contain object-left"
                />

                <h3 className="mt-4 text-2xl font-black text-brand-neon">Structured learning paths</h3>
                <p className="mt-2 mb-6 max-w-md text-sm text-muted">
                  Having difficulties with the challenges? Try CyberKhana Academy, where you learn
                  cybersecurity regardless of your level.
                </p>

                <span className="inline-flex items-center gap-2 rounded-lg border border-brand/50 px-5 py-2.5 text-sm font-bold text-brand transition-colors group-hover:bg-brand/10">
                  Open Academy
                  <ExternalLink size={14} />
                </span>
              </div>
            </motion.a>

            {/* Platform Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/competition', icon: Target, title: 'Live competitions', copy: 'Join active CTF tournaments', delay: 0.4 },
                { to: '/challenges', icon: Code, title: 'Practice range', copy: 'Hone your skills offline', delay: 0.45 },
              ].map(({ to, icon: Icon, title, copy, delay }) => (
                <motion.button
                  key={to}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay }}
                  onClick={() => navigate(to)}
                  className="group relative overflow-hidden rounded-2xl border border-edge bg-panel p-6 text-left transition-colors hover:border-edge-light hover:bg-surface-hover"
                >
                  <div className="pointer-events-none absolute end-0 top-0 h-32 w-32 rounded-bl-full bg-brand/0 transition-colors group-hover:bg-brand/[0.06]" />
                  <Icon className="mb-4 h-8 w-8 text-muted transition-colors group-hover:text-brand" />
                  <h3 className="mb-1 text-lg font-bold text-fg">{title}</h3>
                  <p className="text-xs text-muted">{copy}</p>
                </motion.button>
              ))}
            </div>

          </div>

          {/* RIGHT COLUMN: Activity & Analysis */}
          <div className="space-y-6 min-w-0">
            
            {/* Operator Assessment profile snippet */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-panel border border-edge rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4 border-b border-edge pb-3">
                <Award className="w-4 h-4 text-muted" />
                <h3 className="text-sm font-bold text-fg">Operator assessment</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-dim mb-1.5">
                    <span>Rank progression</span>
                    <span className="text-fg-soft">{topPercent !== null ? `Top ${topPercent}%` : 'Unranked'}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-inset overflow-hidden">
                    {/* Green: this bar measures the operator's own standing. */}
                    <div className="h-full bg-brand transition-all" style={{ width: `${rankBarPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between gap-2 text-xs font-semibold text-dim mb-1.5">
                    <span className="truncate">Specialisation: {stats.favoriteCategory || '–'}</span>
                    {stats.favoriteCategory && <span className="text-fg-soft">{specializationPct}%</span>}
                  </div>
                  <div className="h-1.5 rounded-full bg-inset overflow-hidden">
                    {/* Category hue: this bar names a discipline, not a score. */}
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${specializationPct}%`,
                        backgroundColor: categoryAccent(stats.favoriteCategory),
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity Log */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="bg-panel border border-edge rounded-2xl overflow-hidden flex flex-col h-[320px]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-edge bg-inset">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted" />
                  <h3 className="text-sm font-bold text-fg">Activity log</h3>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {recentActivity.length > 0 ? (
                  <div className="space-y-1">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="p-3 rounded-lg hover:bg-surface-hover transition-colors border border-transparent hover:border-edge">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-fg truncate me-4">{activity.challengeTitle}</p>
                          <span className="text-xs font-black text-brand-neon shrink-0">+{activity.points}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="inline-flex min-w-0 items-center gap-1.5 text-dim">
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: categoryAccent(activity.category) }}
                            />
                            <span className="truncate">{activity.category}</span>
                          </span>
                          <span className="shrink-0 text-faint">{activity.solvedAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                    <Flag className="w-8 h-8 text-faint mb-2" />
                    <p className="text-sm font-medium text-muted">No recent activity</p>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDashboardPage;
