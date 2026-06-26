import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userService } from '../services/userService';
import { Target, Calendar, Edit2, Check, X, Shield, Zap, Flag, Trophy, Award } from 'lucide-react';
import AchievementsSystem from '../components/AchievementsSystem';

interface UserStats {
  points: number;
  solvedCount: number;
  rank?: number;
  totalUsers?: number;
  streak?: number;
  lastSolveDate?: string;
  favoriteCategory?: string;
  joinDate?: string;
  achievements?: string[];
}

interface CategoryStats {
  category: string;
  count: number;
  points: number;
}

const categoryAccents: Record<string, string> = {
  'Web Exploitation': '#60a5fa',
  'Reverse Engineering': '#a855f7',
  Cryptography: '#f97316',
  'Binary Exploitation': '#f43f5e',
  Forensics: '#34d399',
  'Social Engineering': '#fbbf24',
  Miscellaneous: '#9aa5bf',
};

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<UserStats>({ points: 0, solvedCount: 0 });
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedFullName, setEditedFullName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const MAX_FULLNAME_LENGTH = 50;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        const profile = await userService.getUserProfile();
        setStats({
          points: profile.points || 0,
          solvedCount: profile.solvedChallenges?.length || 0,
          rank: profile.rank,
          totalUsers: profile.totalUsers,
          streak: profile.streak || 0,
          lastSolveDate: profile.lastSolveDate,
          favoriteCategory: profile.favoriteCategory,
          joinDate: profile.createdAt,
          achievements: profile.achievements || [],
        });
        setUser({ ...parsedUser, ...profile });

        if (profile.solvedChallengesDetails?.length > 0) {
          const map = new Map<string, { count: number; points: number }>();
          profile.solvedChallengesDetails.forEach((s: any) => {
            const cat = s.category || 'Miscellaneous';
            const cur = map.get(cat) || { count: 0, points: 0 };
            map.set(cat, { count: cur.count + 1, points: cur.points + (s.points || 0) });
          });
          setCategoryStats(
            Array.from(map.entries()).map(([category, s]) => ({ category, ...s }))
          );
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    const trimmed = editedFullName.trim();
    if (trimmed.length > MAX_FULLNAME_LENGTH) {
      setNameError(`Max ${MAX_FULLNAME_LENGTH} characters`);
      return;
    }
    if (trimmed.length > 0 && trimmed.length < 2) {
      setNameError('Min 2 characters');
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      await userService.updateProfile({ fullName: trimmed });
      const updated = { ...user, fullName: trimmed };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setIsEditingName(false);
    } catch (err: any) {
      setNameError(err.message || 'Failed to update');
    } finally {
      setSavingName(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-[#121a2a] rounded-xl animate-pulse border border-[#263248]" />
        ))}
      </div>
    );
  }

  const displayName = user?.fullName || user?.displayName || user?.username || 'Operator';
  const initial = displayName.charAt(0).toUpperCase();
  const maxCategoryCount = Math.max(...categoryStats.map((c) => c.count), 1);
  const shapePath = 'polygon(25% 6%,75% 6%,94% 25%,94% 75%,75% 94%,25% 94%,6% 75%,6% 25%)';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8 space-y-6">

      {/* ── PROFILE HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl border border-[#263248] bg-[#121a2a] overflow-hidden p-6 md:p-8"
      >
        {/* BG glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#6f56d9]/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00a859]/4 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Octagon avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-24 h-24 md:w-28 md:h-28 bg-[#0e1522] border-2 border-[#6f56d9]/40 flex items-center justify-center"
              style={{ clipPath: shapePath }}
            >
              <span className="text-4xl font-black text-[#9fef00]">{initial}</span>
            </div>
            {/* Frame glow */}
            <div
              className="absolute inset-0 bg-[#6f56d9]/20 pointer-events-none"
              style={{ clipPath: shapePath }}
            />
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedFullName}
                    onChange={(e) => setEditedFullName(e.target.value)}
                    placeholder="Enter your full name"
                    maxLength={MAX_FULLNAME_LENGTH}
                    className="flex-1 px-3 py-2 bg-[#0e1522] border border-[#263248] rounded text-[#f3f6ff] text-xl font-bold focus:outline-none focus:border-[#00a859]/60"
                    autoFocus
                    disabled={savingName}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-2 bg-[#00a859] hover:bg-[#007a42] rounded text-white transition-colors disabled:opacity-50"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => { setIsEditingName(false); setNameError(''); }}
                    disabled={savingName}
                    className="p-2 bg-[#1a2332] hover:bg-[#182235] rounded text-[#9aa5bf] transition-colors border border-[#263248]"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex justify-between mt-1">
                  {nameError
                    ? <p className="text-red-400 text-xs">{nameError}</p>
                    : <p className="text-[#6e7a94] text-xs">Max {MAX_FULLNAME_LENGTH} chars</p>
                  }
                  <p className="text-[#6e7a94] text-xs">{editedFullName.length}/{MAX_FULLNAME_LENGTH}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-black text-[#f3f6ff] truncate max-w-sm" title={displayName}>
                  {displayName}
                </h1>
                <button
                  onClick={() => { setEditedFullName(user?.fullName || ''); setIsEditingName(true); setNameError(''); }}
                  className="p-1.5 text-[#6e7a94] hover:text-[#00a859] hover:bg-[#182235] rounded transition-colors"
                  title="Edit name"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#9aa5bf]">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                Joined {stats.joinDate ? new Date(stats.joinDate).toLocaleDateString() : '–'}
              </span>
              <span className="flex items-center gap-1.5">
                <Target size={13} />
                {user?.universityName || user?.universityCode || 'CyberKhana'}
              </span>
              {user?.username && (
                <span className="text-[#6e7a94] text-xs">@{user.username}</span>
              )}
            </div>
          </div>

          {/* Stat pillars */}
          <div className="flex items-center gap-4">
            <div className="text-center px-5 py-4 rounded-xl bg-[#0e1522] border border-[#263248]">
              <p className="text-2xl font-black text-[#9fef00]">{stats.points.toLocaleString()}</p>
              <p className="text-[10px] text-[#8390ac] uppercase tracking-wider mt-0.5">Points</p>
            </div>
            <div className="text-center px-5 py-4 rounded-xl bg-[#0e1522] border border-[#263248]">
              <p className="text-2xl font-black text-[#60a5fa]">{stats.solvedCount}</p>
              <p className="text-[10px] text-[#8390ac] uppercase tracking-wider mt-0.5">Solved</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── OPERATOR BRIEFING ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-xl border border-[#263248] bg-[#121a2a] overflow-hidden"
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#263248]">
          <Shield size={15} className="text-[#00a859]" />
          <h2 className="text-sm font-bold text-[#f3f6ff] uppercase tracking-wider">Operator Briefing</h2>
        </div>
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#263248]">
          <div className="p-5">
            <p className="text-[10px] text-[#8390ac] uppercase tracking-wider mb-2">Standing</p>
            <p className="text-xl font-black text-[#f3a43a]">
              #{stats.rank || '–'} <span className="text-sm font-normal text-[#6e7a94]">of {stats.totalUsers || '–'}</span>
            </p>
            <p className="text-xs text-[#9aa5bf] mt-1">Global rank</p>
          </div>
          <div className="p-5">
            <p className="text-[10px] text-[#8390ac] uppercase tracking-wider mb-2">Streak</p>
            <p className="text-xl font-black text-[#a855f7]">
              {stats.streak || 0} <span className="text-sm font-normal text-[#6e7a94]">days</span>
            </p>
            <p className="text-xs text-[#9aa5bf] mt-1">
              Last solve: {stats.lastSolveDate ? new Date(stats.lastSolveDate).toLocaleDateString() : 'None'}
            </p>
          </div>
          <div className="p-5">
            <p className="text-[10px] text-[#8390ac] uppercase tracking-wider mb-2">Focus Area</p>
            <p className="text-xl font-black text-[#60a5fa] truncate">
              {stats.favoriteCategory || '–'}
            </p>
            <p className="text-xs text-[#9aa5bf] mt-1">Most solved category</p>
          </div>
        </div>
      </motion.div>

      {/* ── CATEGORY BREAKDOWN ── */}
      {categoryStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl border border-[#263248] bg-[#121a2a] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#263248]">
            <Flag size={15} className="text-[#60a5fa]" />
            <h2 className="text-sm font-bold text-[#f3f6ff] uppercase tracking-wider">Category Breakdown</h2>
          </div>
          <div className="p-5 space-y-4">
            {categoryStats
              .sort((a, b) => b.count - a.count)
              .map((stat, i) => {
                const accent = categoryAccents[stat.category] || '#9aa5bf';
                const pct = Math.round((stat.count / maxCategoryCount) * 100);
                return (
                  <motion.div
                    key={stat.category}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                  >
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-[#d2d7e3] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
                        {stat.category}
                      </span>
                      <span className="text-[#6e7a94] text-xs">
                        {stat.count} flags · {stat.points} pts
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#0e1522] rounded-full overflow-hidden border border-[#2a3346]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: accent }}
                      />
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* ── ACHIEVEMENTS ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <AchievementsSystem
          userStats={stats}
          onClaimReward={(id, reward) => {
            console.log('Claimed reward:', id, reward);
          }}
        />
      </motion.div>
    </div>
  );
};

export default ProfilePage;
