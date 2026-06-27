import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Code,
  Target,
  Flag,
  Shield,
  BookOpen,
  ArrowRight,
  TerminalSquare,
  Activity,
  Award,
  ExternalLink
} from 'lucide-react';
import { userService } from '../services/userService';
import { activityService } from '../services/activityService';

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

const categoryColors: Record<string, string> = {
  'Web Exploitation': '#60a5fa',
  'Reverse Engineering': '#a855f7',
  Cryptography: '#f3a43a',
  'Binary Exploitation': '#f43f5e',
  Forensics: '#34d399',
  'Social Engineering': '#fbbf24',
  Miscellaneous: '#9aa5bf',
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

        setStats({
          points: profile.points || 0,
          solvedCount: profile.solvedChallenges?.length || 0,
          rank: profile.rank,
          totalUsers: profile.totalUsers,
          streak: profile.streak || 0,
          favoriteCategory: profile.favoriteCategory || 'Web Exploitation',
        });
        setRecentActivity(activityData);
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
        <div className="h-32 bg-[#121a2a] rounded-2xl animate-pulse border border-[#263248]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#121a2a] rounded-xl animate-pulse border border-[#263248]" />
          ))}
        </div>
      </div>
    );
  }

  const displayName = user?.fullName || user?.displayName || user?.username || 'Operator';

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#d2d7e3] pb-24 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── COMMAND CENTER HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl border border-[#263248] bg-[#121a2a] overflow-hidden p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(159,239,0,0.05),transparent_60%)] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className="relative z-10 w-full md:w-auto text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-[#f3f6ff] tracking-tight">
              Welcome back,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9fef00] to-[#00a859]">
                {displayName}
              </span>
            </h1>
            <p className="mt-3 text-[#9aa5bf] font-medium">
              {user?.universityName || user?.universityCode} — {stats.solvedCount > 0 ? `${stats.solvedCount} Operations Successful` : 'Awaiting First Operation'}
            </p>
          </div>

          <div className="relative z-10 flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:w-32 bg-[#0e1522] border border-[#263248] rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-[#8390ac] mb-1">Global Rank</p>
              <p className="text-2xl font-black text-[#f3a43a]">#{stats.rank || '—'}</p>
            </div>
            <div className="flex-1 md:w-32 bg-[#0e1522] border border-[#263248] rounded-xl p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-[#8390ac] mb-1">Total Score</p>
              <p className="text-2xl font-black text-[#9fef00]">{stats.points.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {/* ── METRICS GRID ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Flags Captured', value: stats.solvedCount, icon: <Flag className="w-5 h-5 text-[#60a5fa]" />, bg: 'bg-[#60a5fa]/10', border: 'border-[#60a5fa]/20' },
            { label: 'Active Streak', value: `${stats.streak} Days`, icon: <Activity className="w-5 h-5 text-[#a855f7]" />, bg: 'bg-[#a855f7]/10', border: 'border-[#a855f7]/20' },
            { label: 'Global Rank', value: stats.rank ? `#${stats.rank}` : 'Unranked', icon: <Trophy className="w-5 h-5 text-[#9fef00]" />, bg: 'bg-[#9fef00]/10', border: 'border-[#9fef00]/20' },
            { label: 'Focus Area', value: stats.favoriteCategory?.split(' ')[0] || 'N/A', icon: <Target className="w-5 h-5 text-[#f3a43a]" />, bg: 'bg-[#f3a43a]/10', border: 'border-[#f3a43a]/20' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-[#121a2a] border border-[#263248] rounded-xl p-4 flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${stat.bg} ${stat.border}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#8390ac]">{stat.label}</p>
                <p className="text-xl font-black text-[#f3f6ff] leading-none mt-1">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── MAIN DASHBOARD SPLIT ── */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          
          {/* LEFT COLUMN: Main Focus */}
          <div className="space-y-6">
            
            {/* CyberKhana Academy — external */}
            <motion.a
              href="https://academy.cyberkhana.tech"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="block bg-[#121a2a] border border-[#263248] rounded-2xl overflow-hidden relative group hover:border-[#9fef00]/40 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#9fef00]/5 to-transparent pointer-events-none" />
              <div className="p-6 relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">

                <div className="flex-1 w-full text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <TerminalSquare className="w-5 h-5 text-[#9fef00]" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-[#f3f6ff]">CyberKhana Academy</h2>
                  </div>
                  <h3 className="text-2xl font-black text-[#9fef00]">Structured Learning Paths</h3>
                  <p className="text-sm text-[#9aa5bf] mt-2 mb-6 max-w-md">Go deeper with guided theory and hands-on labs on the CyberKhana Academy — build the foundations behind every flag you capture.</p>

                  <span className="inline-flex items-center gap-2 px-6 py-2 rounded border border-[#9fef00]/50 text-[#9fef00] group-hover:bg-[#9fef00]/10 text-xs font-bold uppercase tracking-widest transition-colors">
                    Open Academy
                    <ExternalLink size={14} />
                  </span>
                </div>

                <div className="flex-shrink-0 hidden sm:flex w-24 h-24 rounded-2xl border border-[#263248] bg-[#0f172a] items-center justify-center shadow-xl">
                  <BookOpen className="w-10 h-10 text-[#9fef00]" />
                </div>

              </div>
            </motion.a>

            {/* Platform Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <motion.button 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                onClick={() => navigate('/competition')}
                className="group relative p-6 rounded-2xl border border-[#263248] bg-[#121a2a] hover:bg-[#1e293b] transition-colors text-left overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-32 h-32 bg-[#ff3366]/5 rounded-bl-full pointer-events-none group-hover:bg-[#ff3366]/10 transition-colors" />
                <Target className="w-8 h-8 text-[#ff3366] mb-4" />
                <h3 className="text-lg font-black text-[#f3f6ff] mb-1">Live Competitions</h3>
                <p className="text-xs text-[#9aa5bf]">Join active CTF tournaments</p>
              </motion.button>

              <motion.button 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45 }}
                onClick={() => navigate('/challenges')}
                className="group relative p-6 rounded-2xl border border-[#263248] bg-[#121a2a] hover:bg-[#1e293b] transition-colors text-left overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-32 h-32 bg-[#60a5fa]/5 rounded-bl-full pointer-events-none group-hover:bg-[#60a5fa]/10 transition-colors" />
                <Code className="w-8 h-8 text-[#60a5fa] mb-4" />
                <h3 className="text-lg font-black text-[#f3f6ff] mb-1">Practice Range</h3>
                <p className="text-xs text-[#9aa5bf]">Hone your skills offline</p>
              </motion.button>
            </div>

          </div>

          {/* RIGHT COLUMN: Activity & Analysis */}
          <div className="space-y-6">
            
            {/* Operator Assessment profile snippet */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-[#121a2a] border border-[#263248] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4 border-b border-[#263248] pb-3">
                <Award className="w-4 h-4 text-[#d8b4fe]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#f3f6ff]">Operator Assessment</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] uppercase font-bold text-[#8390ac] mb-1">
                    <span>Rank Progression</span>
                    <span className="text-[#f3a43a]">Top 15%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
                    <div className="h-full bg-[#f3a43a] w-[85%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] uppercase font-bold text-[#8390ac] mb-1">
                    <span>Specialization: {stats.favoriteCategory}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
                    <div className="h-full bg-[#60a5fa] w-[60%]" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity Log */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="bg-[#121a2a] border border-[#263248] rounded-2xl overflow-hidden flex flex-col h-[320px]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#263248] bg-[#0d1422]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#9fef00]" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#f3f6ff]">Activity Log</h3>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {recentActivity.length > 0 ? (
                  <div className="space-y-1">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="p-3 rounded-lg hover:bg-[#1e293b] transition-colors border border-transparent hover:border-[#334155]">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-[#f3f6ff] truncate mr-4">{activity.challengeTitle}</p>
                          <span className="text-xs font-black text-[#9fef00] shrink-0">+{activity.points}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#8390ac] uppercase tracking-wider">{activity.category}</span>
                          <span className="text-[#64748b]">{activity.solvedAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                    <Flag className="w-8 h-8 text-[#64748b] mb-2" />
                    <p className="text-sm font-medium text-[#9aa5bf]">No recent activity</p>
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
