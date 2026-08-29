import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userService } from '../services/userService';
import { Target, Calendar, Edit2, Check, X, Shield, Flag, UserRound } from 'lucide-react';
import AchievementsSystem from '../components/AchievementsSystem';
import { categoryAccent } from '../components/challenges/ChallengeArt';
import AvatarPicker from '../components/account/AvatarPicker';
import CyberAvatar, { presetFor } from '../components/ui/CyberAvatar';

/* `profileIcon` is required by the API and defaults to 'default' on the model,
   so "no picture" is that sentinel rather than an empty string — which the
   endpoint rejects outright. Neither resolves to a preset, so both land on the
   initial. */
const NO_PICTURE = 'default';

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

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<UserStats>({ points: 0, solvedCount: 0 });
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  const [profileIcon, setProfileIcon] = useState(NO_PICTURE);
  const [savingIcon, setSavingIcon] = useState(false);
  const [iconError, setIconError] = useState('');

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
        setProfileIcon(profile.profileIcon || NO_PICTURE);

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

  /* Saves on selection rather than behind a Save button: one field, one
     action, and the picture the member just tapped is already the preview. */
  const handlePickIcon = async (next: string) => {
    const value = next || NO_PICTURE;
    const previous = profileIcon;
    setProfileIcon(value);
    setSavingIcon(true);
    setIconError('');
    try {
      await userService.updateProfileIcon(value);
      const updated = { ...user, profileIcon: value };
      setUser(updated);
      // Header, sidebar and leaderboard all read the cached user, so they need
      // to hear about this without a reload.
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const merged = { ...stored, profileIcon: value };
      localStorage.setItem('user', JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('userUpdate', { detail: merged }));
    } catch (err: any) {
      setProfileIcon(previous);
      setIconError(err?.message || 'Could not save your picture');
    } finally {
      setSavingIcon(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-panel rounded-xl animate-pulse border border-edge" />
        ))}
      </div>
    );
  }

  const displayName = user?.fullName || user?.displayName || user?.username || 'Operator';
  const initial = displayName.charAt(0).toUpperCase();
  const selectedPreset = presetFor(profileIcon);
  const maxCategoryCount = Math.max(...categoryStats.map((c) => c.count), 1);
  const shapePath = 'polygon(25% 6%,75% 6%,94% 25%,94% 75%,75% 94%,25% 94%,6% 75%,6% 25%)';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8 space-y-6">

      {/* ── PROFILE HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl border border-edge bg-panel overflow-hidden p-4 sm:p-6 md:p-8"
      >
        {/* BG glow */}
        <div className="absolute top-0 end-0 w-72 h-72 bg-brand/[0.06] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Octagon avatar — the picture chosen below, in the frame. */}
          <div className="relative flex-shrink-0">
            <div
              className="w-24 h-24 md:w-28 md:h-28 overflow-hidden bg-inset border-2 border-brand/40 flex items-center justify-center"
              style={{ clipPath: shapePath }}
            >
              {selectedPreset ? (
                <CyberAvatar preset={selectedPreset} className="w-full h-full" title={displayName} />
              ) : (
                <span className="text-4xl font-black text-brand-neon">{initial}</span>
              )}
            </div>
          </div>

          {/* Name + meta.
              w-full matters on mobile: the parent is flex-col there, so
              flex-1 governs height and `items-start` lets this block size to
              its own content on the cross axis — which is how it ended up
              wider than the card. */}
          <div className="flex-1 w-full min-w-0">
            {isEditingName ? (
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedFullName}
                    onChange={(e) => setEditedFullName(e.target.value)}
                    placeholder="Enter your full name"
                    maxLength={MAX_FULLNAME_LENGTH}
                    className="flex-1 px-3 py-2 bg-inset border border-edge rounded text-fg text-xl font-bold focus:outline-none focus:border-brand/60"
                    autoFocus
                    disabled={savingName}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-2 bg-brand hover:bg-brand-deep rounded text-white transition-colors disabled:opacity-50"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => { setIsEditingName(false); setNameError(''); }}
                    disabled={savingName}
                    className="p-2 bg-surface hover:bg-surface-hover rounded text-muted transition-colors border border-edge"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex justify-between mt-1">
                  {nameError
                    ? <p className="text-red-400 text-xs">{nameError}</p>
                    : <p className="text-faint text-xs">Max {MAX_FULLNAME_LENGTH} chars</p>
                  }
                  <p className="text-faint text-xs">{editedFullName.length}/{MAX_FULLNAME_LENGTH}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2 min-w-0">
                {/* max-w-sm is 384px, wider than this card's content box on a
                    phone, so truncate never engaged and a long name pushed the
                    whole row out of the card instead. */}
                <h1 className="text-2xl sm:text-3xl font-black text-fg truncate max-w-full" title={displayName}>
                  {displayName}
                </h1>
                <button
                  onClick={() => { setEditedFullName(user?.fullName || ''); setIsEditingName(true); setNameError(''); }}
                  className="shrink-0 inline-flex items-center justify-center p-1.5 touch:min-h-tap touch:min-w-tap text-faint hover:text-brand hover:bg-surface-hover rounded transition-colors"
                  title="Edit name"
                  aria-label="Edit name"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                Joined {stats.joinDate ? new Date(stats.joinDate).toLocaleDateString() : '–'}
              </span>
              <span className="flex items-center gap-1.5">
                <Target size={13} />
                {user?.universityName || user?.universityCode || 'CyberKhana'}
              </span>
              {user?.username && (
                <span className="text-faint text-xs">@{user.username}</span>
              )}
            </div>
          </div>

          {/* Stat pillars. Full width and split evenly on a phone, where they
              sit under the name rather than beside it. */}
          <div className="grid grid-cols-2 md:flex md:items-center gap-3 sm:gap-4 w-full md:w-auto">
            <div className="text-center px-4 sm:px-5 py-4 rounded-xl bg-inset border border-edge">
              <p className="text-2xl font-black text-brand-neon">{stats.points.toLocaleString()}</p>
              <p className="text-xs text-dim mt-0.5">Points</p>
            </div>
            <div className="text-center px-4 sm:px-5 py-4 rounded-xl bg-inset border border-edge">
              <p className="text-2xl font-black text-fg">{stats.solvedCount}</p>
              <p className="text-xs text-dim mt-0.5">Solved</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── PROFILE PICTURE ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="rounded-xl border border-edge bg-panel overflow-hidden"
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-edge">
          <UserRound size={15} className="text-muted" />
          <h2 className="text-sm font-bold text-fg">Profile picture</h2>
          {savingIcon && <span className="ms-auto text-xs text-muted">Saving…</span>}
          {!savingIcon && iconError && <span className="ms-auto text-xs text-red-400">{iconError}</span>}
        </div>
        <div className="p-5">
          <p className="mb-4 text-sm text-muted">
            Shown on your profile, in the sidebar and on the leaderboard.
          </p>
          <AvatarPicker
            value={selectedPreset ? profileIcon : ''}
            onChange={handlePickIcon}
            displayName={displayName}
            disabled={savingIcon}
          />
        </div>
      </motion.div>

      {/* ── OPERATOR BRIEFING ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-xl border border-edge bg-panel overflow-hidden"
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-edge">
          <Shield size={15} className="text-muted" />
          <h2 className="text-sm font-bold text-fg">Operator briefing</h2>
        </div>
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-edge">
          <div className="p-5">
            <p className="text-xs text-dim mb-2">Standing</p>
            <p className="text-xl font-black text-fg">
              #{stats.rank || '–'} <span className="text-sm font-normal text-faint">of {stats.totalUsers || '–'}</span>
            </p>
            <p className="text-xs text-muted mt-1">Global rank</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-dim mb-2">Streak</p>
            <p className="text-xl font-black text-fg">
              {stats.streak || 0} <span className="text-sm font-normal text-faint">days</span>
            </p>
            <p className="text-xs text-muted mt-1">
              Last solve: {stats.lastSolveDate ? new Date(stats.lastSolveDate).toLocaleDateString() : 'None'}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-dim mb-2">Focus area</p>
            <p className="flex items-center gap-2 text-xl font-black text-fg truncate">
              {stats.favoriteCategory && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: categoryAccent(stats.favoriteCategory) }}
                />
              )}
              <span className="truncate">{stats.favoriteCategory || '–'}</span>
            </p>
            <p className="text-xs text-muted mt-1">Most solved category</p>
          </div>
        </div>
      </motion.div>

      {/* ── CATEGORY BREAKDOWN ── */}
      {categoryStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl border border-edge bg-panel overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b border-edge">
            <Flag size={15} className="text-muted" />
            <h2 className="text-sm font-bold text-fg">Category breakdown</h2>
          </div>
          <div className="p-5 space-y-4">
            {categoryStats
              .sort((a, b) => b.count - a.count)
              .map((stat, i) => {
                const accent = categoryAccent(stat.category);
                const pct = Math.round((stat.count / maxCategoryCount) * 100);
                return (
                  <motion.div
                    key={stat.category}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                  >
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-fg-soft flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
                        {stat.category}
                      </span>
                      <span className="text-faint text-xs">
                        {stat.count} flags · {stat.points} pts
                      </span>
                    </div>
                    <div className="h-1.5 bg-inset rounded-full overflow-hidden border border-edge-soft">
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
