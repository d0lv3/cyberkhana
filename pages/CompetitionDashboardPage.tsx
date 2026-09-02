import React, { useState, useEffect, useMemo } from 'react';
import { useNow, isCompetitionOver, formatTimeRemaining } from '../src/hooks/useCompetitionClock';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionService } from '../services/competitionService';
import { refreshCompetitionDashboard } from '../services/competitionRefreshService';
import { announcementService } from '../services/announcementService';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Clock, Users, ArrowLeft, TrendingUp, Activity, CheckCircle,
  ArrowRight, Lock, Bell, Zap, Award, Shield, ChevronDown, Target, Crown, Medal
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  'Web Exploitation': { accent: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)' },
  'Reverse Engineering': { accent: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)' },
  'Cryptography': { accent: '#f3a43a', bg: 'rgba(243,164,58,0.12)', border: 'rgba(243,164,58,0.25)' },
  'Forensics': { accent: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
  'Pwn': { accent: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.25)' },
  'Miscellaneous': { accent: '#ec4899', bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.25)' },
  'Binary Exploitation': { accent: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)' },
  'Social Engineering': { accent: '#22d3ee', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.25)' },
};

const getCatStyle = (cat: string) => CATEGORY_COLORS[cat] || { accent: '#9aa5bf', bg: 'rgba(154,165,191,0.10)', border: 'rgba(154,165,191,0.20)' };

const DIFFICULTY_COLORS: Record<string, string> = {
  'Very Easy': '#34d399',
  'Easy': '#00a859',
  'Medium': '#f3a43a',
  'Hard': '#f43f5e',
  'Expert': '#9fef00',
};

interface CompetitionChallenge {
  _id: string;
  title: string;
  category: string;
  points: number;
  description: string;
  author: string;
  solves: number;
  difficulty?: string;
  currentPoints?: number;
  firstBloodBonus?: number;
  solvers?: Array<{ username: string; isFirstBlood: boolean; solvedAt: string }>;
}

interface LeaderboardEntry {
  _id: string;
  username: string;
  points: number;
  solvedChallenges: number;
  universityCode?: string;
  universityName?: string;
}

interface ActivityEntry {
  username: string;
  challengeTitle: string;
  timestamp: string;
  points: number;
}

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-4 h-4 text-brand-neon" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-[#cbd5e1]" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-[#d6a55a]" />;
  return <span className="text-xs font-bold text-dim">{rank}</span>;
};

const CompetitionDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [solvedChallenges, setSolvedChallenges] = useState<Set<string>>(new Set());
  const [showSecurityCodeModal, setShowSecurityCodeModal] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [securityCodeError, setSecurityCodeError] = useState('');
  const [enteringCode, setEnteringCode] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sortBy, setSortBy] = useState('default');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  const userData = localStorage.getItem('user');
  const currentUser = userData ? JSON.parse(userData) : null;
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'super-admin');

  // Ticks once a second so the countdown moves and the page locks itself when
  // the time runs out, instead of freezing at whatever it read on load.
  const now = useNow();

  const isCompetitionEnded = () => isCompetitionOver(competition, now);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchCompetition();
    fetchLeaderboardAndActivity();
    fetchAnnouncements();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `competition_${id}_refresh`) {
        fetchSolvedChallenges();
        fetchLeaderboardAndActivity();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [id]);

  const getStoredSecurityCode = (): string | null =>
    localStorage.getItem(`competition_${id}_security_code`);

  const fetchCompetition = async () => {
    try {
      setLoading(true);
      const storedCode = getStoredSecurityCode();
      const data = await competitionService.getCompetitionById(id!, storedCode || undefined);
      setCompetition(data);
      await fetchSolvedChallenges();
      setError('');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch competition';
      if (errorMsg.includes('security code')) {
        localStorage.removeItem(`competition_${id}_security_code`);
        setShowSecurityCodeModal(true);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSolvedChallenges = async () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      try {
        const solved = await competitionService.getSolvedChallenges(id!, user.id);
        setSolvedChallenges(new Set(solved));
      } catch {
        setSolvedChallenges(new Set());
      }
    }
  };

  const fetchLeaderboardAndActivity = async () => {
    if (!id) return;
    try {
      const leaderboardResponse = await competitionService.getCompetitionLeaderboard(id);
      const leaderboardData = Array.isArray(leaderboardResponse)
        ? leaderboardResponse
        : leaderboardResponse.leaderboard || [];
      setLeaderboard(leaderboardData);
      const activityData = await competitionService.getCompetitionActivity(id);
      setRecentActivity(activityData);
    } catch {
      setLeaderboard([]);
      setRecentActivity([]);
    }
  };

  const fetchAnnouncements = async () => {
    if (!id) return;
    try {
      const data = await announcementService.getCompetitionAnnouncements(id);
      setAnnouncements(data);
      const storedRead = localStorage.getItem(`competition_${id}_read_announcements`);
      const readIds = storedRead ? JSON.parse(storedRead) : [];
      const unread = data.filter((a: any) => !readIds.includes(a._id));
      setUnreadCount(unread.length);
    } catch {
      setAnnouncements([]);
      setUnreadCount(0);
    }
  };

  const markAnnouncementsAsRead = () => {
    const readIds = announcements.map((a: any) => a._id);
    localStorage.setItem(`competition_${id}_read_announcements`, JSON.stringify(readIds));
    setUnreadCount(0);
  };

  const handleSecurityCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityCodeError('');
    setEnteringCode(true);
    if (!securityCode.trim()) {
      setSecurityCodeError('Please enter a security code');
      setEnteringCode(false);
      return;
    }
    try {
      const data = await competitionService.getCompetitionById(id!, securityCode);
      localStorage.setItem(`competition_${id}_security_code`, securityCode);
      setCompetition(data);
      setShowSecurityCodeModal(false);
      setSecurityCode('');
      await fetchSolvedChallenges();
    } catch {
      setSecurityCodeError('Invalid security code. Please try again.');
    } finally {
      setEnteringCode(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(competition?.challenges?.map((c: CompetitionChallenge) => c.category) || []))];

  const filteredChallenges = selectedCategory === 'all'
    ? competition?.challenges || []
    : competition?.challenges?.filter((c: CompetitionChallenge) => c.category === selectedCategory) || [];

  const sortedChallenges = useMemo(() => {
    const challenges = [...filteredChallenges];
    switch (sortBy) {
      case 'points-desc':
        return challenges.sort((a: CompetitionChallenge, b: CompetitionChallenge) => ((b as any).currentPoints || b.points) - ((a as any).currentPoints || a.points));
      case 'points-asc':
        return challenges.sort((a: CompetitionChallenge, b: CompetitionChallenge) => ((a as any).currentPoints || a.points) - ((b as any).currentPoints || b.points));
      case 'solves-desc':
        return challenges.sort((a: CompetitionChallenge, b: CompetitionChallenge) => b.solves - a.solves);
      case 'solves-asc':
        return challenges.sort((a: CompetitionChallenge, b: CompetitionChallenge) => a.solves - b.solves);
      default:
        return challenges;
    }
  }, [filteredChallenges, sortBy]);

  const userRank = useMemo(() => {
    if (!user || leaderboard.length === 0) return 0;
    const idx = leaderboard.findIndex(e => e.username === user.username);
    return idx >= 0 ? idx + 1 : 0;
  }, [leaderboard, user]);

  const isSharedCompetition = (competition?.universityCodes?.length || 0) > 1;

  const totalChallenges = competition?.challenges?.length || 0;
  const ended = isCompetitionEnded();
  const progressPct = totalChallenges > 0 ? Math.min(100, Math.round((solvedChallenges.size / totalChallenges) * 100)) : 0;

  // Pick hero image based on competition state
  const heroImage = ended
    ? '/mascots/optimized/Gemini_Generated_Image_pj2knxpj2knxpj2k.webp'
    : '/mascots/optimized/Gemini_Generated_Image_x94uvzx94uvzx94u.webp';

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
          <p className="text-muted text-sm">Loading competition...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-danger/10 border border-danger/30 text-danger px-6 py-4 rounded-xl mb-6">{error}</div>
          <Button onClick={() => navigate('/competition')} className="bg-surface-alt border border-edge text-fg-soft hover:bg-surface">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Competitions
          </Button>
        </div>
      </div>
    );
  }

  if (!competition) {
    if (!showSecurityCodeModal) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-muted text-lg mb-4">Competition not found</p>
            <Button onClick={() => navigate('/competition')} className="bg-surface-alt border border-edge text-fg-soft">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Competitions
            </Button>
          </div>
        </div>
      );
    }

    // Security code modal (standalone page)
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-panel border border-edge rounded-2xl max-w-md w-full p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber" />
            </div>
            <h2 className="text-2xl font-black text-fg mb-2">Security Code Required</h2>
            <p className="text-muted text-sm">Enter the code provided by your instructor to access this competition.</p>
          </div>
          <form onSubmit={handleSecurityCodeSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter security code"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
                className="w-full font-mono text-center tracking-widest bg-inset border-edge text-fg"
                autoFocus
              />
              {securityCodeError && <p className="text-danger text-sm mt-2">{securityCodeError}</p>}
            </div>
            <Button type="submit" className="w-full bg-brand text-white hover:bg-[#00c064] font-bold" disabled={enteringCode}>
              {enteringCode ? 'Verifying...' : 'Enter Competition'}
            </Button>
          </form>
          <button onClick={() => navigate('/competition')} className="w-full mt-4 text-faint hover:text-muted text-sm flex items-center justify-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Competitions
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-fg-soft">

      {/* Hero Banner */}
      <div
        className="relative overflow-hidden border-b border-edge"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(13,17,23,1) 0%, rgba(13,17,23,0.85) 40%, rgba(13,17,23,0.3) 100%), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-10">
          <button
            onClick={() => navigate('/competition')}
            className="group flex items-center gap-2 text-muted hover:text-fg mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Competitions
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {ended ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold bg-amber/10 border border-amber/30 text-amber">
                    <Clock className="w-3 h-3" /> Ended
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold bg-brand/10 border border-brand/30 text-brand">
                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse" /> Live
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-fg tracking-tight">{competition.name}</h1>
              {!ended && (
                <p className="text-muted mt-2 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" /> {formatTimeRemaining(competition.endTime, now, competition.hasTimeLimit)} remaining
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(`/competition/${id}/leaderboard`)}
                className="bg-surface-alt border border-edge text-fg-soft hover:bg-surface hover:border-brand/40"
              >
                <TrendingUp className="w-4 h-4 mr-2" /> Leaderboard
              </Button>
              <Button
                onClick={() => {
                  setShowAnnouncements(!showAnnouncements);
                  if (!showAnnouncements) markAnnouncementsAsRead();
                }}
                className="relative bg-surface-alt border border-edge text-fg-soft hover:bg-surface"
              >
                <Bell className="w-4 h-4 mr-2" /> Announcements
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-danger text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* Announcements Panel */}
        <AnimatePresence>
          {showAnnouncements && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-8">
              <div className="bg-panel border border-edge rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-amber" />
                  <h2 className="text-lg font-bold text-fg">Announcements</h2>
                </div>
                {announcements.length > 0 ? (
                  <div className="space-y-3">
                    {announcements.map((a: any) => (
                      <div key={a._id} className="p-4 bg-inset rounded-lg border border-edge">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-[#e5ecfb]">{a.title}</h3>
                          <span className="text-[10px] text-faint">{new Date(a.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted">{a.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-faint text-sm text-center py-4">No announcements yet</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-panel border border-edge rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dim">Progress</span>
              <Target className="w-4 h-4 text-brand" />
            </div>
            <p className="text-2xl font-black text-fg">{solvedChallenges.size}<span className="text-sm text-faint font-normal">/{totalChallenges}</span></p>
            <div className="h-1.5 bg-inset rounded-full border border-edge mt-3 overflow-hidden">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <div className="bg-panel border border-edge rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dim">Your Rank</span>
              <Award className="w-4 h-4 text-amber" />
            </div>
            <p className="text-2xl font-black text-fg">{userRank > 0 ? `#${userRank}` : '-'}</p>
            <p className="text-[10px] text-faint mt-1">of {leaderboard.length} participants</p>
          </div>
          <div className="bg-panel border border-edge rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dim">Your Points</span>
              <Trophy className="w-4 h-4 text-brand-neon" />
            </div>
            <p className="text-2xl font-black text-fg">{user?.competitionPoints || 0}</p>
            <p className="text-[10px] text-faint mt-1">pts earned</p>
          </div>
          <div className="bg-panel border border-edge rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-dim">Time Left</span>
              <Clock className="w-4 h-4 text-info" />
            </div>
            <p className="text-2xl font-black text-fg">{ended ? 'Ended' : formatTimeRemaining(competition.endTime, now, competition.hasTimeLimit)}</p>
            {!ended && competition.endTime && <p className="text-[10px] text-faint mt-1">{new Date(competition.endTime).toLocaleDateString()}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Content */}
          <div>
            {/* Category Tabs + Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => {
                  const isSelected = selectedCategory === category;
                  const catStyle = category === 'all' ? { accent: '#00a859', bg: 'rgba(0,168,89,0.12)', border: 'rgba(0,168,89,0.25)' } : getCatStyle(category);
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="px-4 py-2 text-sm font-semibold rounded-lg transition-all border"
                      style={{
                        backgroundColor: isSelected ? catStyle.bg : '#0e1522',
                        borderColor: isSelected ? catStyle.border : '#263248',
                        color: isSelected ? catStyle.accent : '#8390ac',
                      }}
                    >
                      {category === 'all' ? 'All' : category}
                    </button>
                  );
                })}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-inset border border-edge text-fg-soft text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand"
              >
                <option value="default">Default</option>
                <option value="points-desc">Points ↓</option>
                <option value="points-asc">Points ↑</option>
                <option value="solves-desc">Most Solved</option>
                <option value="solves-asc">Least Solved</option>
              </select>
            </div>

            {/* Challenges List */}
            {sortedChallenges.length === 0 ? (
              <div className="text-center py-16 bg-panel border border-edge rounded-xl">
                <Shield className="w-12 h-12 text-edge mx-auto mb-4" />
                <p className="text-muted text-lg mb-1">No challenges yet</p>
                <p className="text-faint text-sm">Check back later</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedChallenges.map((challenge: CompetitionChallenge, index: number) => {
                  const isSolved = solvedChallenges.has(challenge._id);
                  const firstBloodUser = challenge.solvers?.[0]?.username;
                  const catStyle = getCatStyle(challenge.category);
                  const diffColor = DIFFICULTY_COLORS[challenge.difficulty || ''] || '#9aa5bf';

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      key={challenge._id}
                      onClick={() => {
                        if (!ended || isAdmin) navigate(`/competition/${id}/challenge/${challenge._id}`);
                      }}
                      className={`group border rounded-xl p-4 md:p-5 transition-all ${
                        ended && !isAdmin ? 'cursor-default select-none' : 'cursor-pointer select-none hover:border-brand/40'
                      } ${
                        isSolved && !ended
                          ? 'bg-brand/5 border-brand/20'
                          : 'bg-panel border-edge hover:bg-[#151e2d]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Status Icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSolved && !ended ? 'bg-brand/15' : 'bg-inset border border-edge'
                        }`}>
                          {isSolved && !ended ? (
                            <CheckCircle className="w-5 h-5 text-brand" />
                          ) : (
                            <Target className="w-5 h-5" style={{ color: catStyle.accent }} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-fg truncate group-hover:text-brand transition-colors">{challenge.title}</h3>
                            {isSolved && !ended && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand/15 text-brand border border-brand/30 flex-shrink-0">Solved</span>
                            )}
                            {ended && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-edge text-dim border border-edge flex-shrink-0">Ended</span>
                            )}
                          </div>
                          <div className="flex items-center flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded border font-bold" style={{ backgroundColor: catStyle.bg, borderColor: catStyle.border, color: catStyle.accent }}>
                              {challenge.category}
                            </span>
                            {challenge.difficulty && (
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: diffColor }} />
                                <span className="text-fg-soft font-medium">{challenge.difficulty}</span>
                              </span>
                            )}
                            <span className="text-faint">{challenge.solves} solves</span>
                            {firstBloodUser && (
                              <span className="flex items-center gap-1 text-amber font-medium">
                                <Zap className="w-3 h-3" /> {firstBloodUser}
                              </span>
                            )}
                            {isAdmin && !ended && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm(`Remove "${challenge.title}"?`)) {
                                    try {
                                      await competitionService.removeChallengeFromCompetition(id!, challenge._id);
                                      window.location.reload();
                                    } catch (err: any) {
                                      alert(err.message || 'Failed');
                                    }
                                  }
                                }}
                                className="ml-auto text-danger/70 hover:text-danger text-[10px] font-bold border border-danger/20 hover:border-danger/50 px-2 py-0.5 rounded transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Points */}
                        <div className="text-right flex-shrink-0">
                          <span className="text-lg font-bold text-fg">{challenge.currentPoints || challenge.points}</span>
                          <span className="text-faint text-xs ml-1">pts</span>
                          {!ended && (
                            <div className="mt-1">
                              <ArrowRight className="w-4 h-4 text-edge group-hover:text-brand transition-all group-hover:translate-x-1 ml-auto" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <div className="bg-panel border border-edge rounded-xl overflow-hidden">
              <div className="p-4 border-b border-edge bg-inset flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand" />
                <span className="font-bold text-fg text-sm">Leaderboard</span>
              </div>
              <div className="p-4 space-y-2">
                {leaderboard.slice(0, 5).map((entry, index) => {
                  const isCurrentUser = user && entry.username === user.username;
                  return (
                    <div key={entry._id} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                      isCurrentUser ? 'bg-brand/8 border border-brand/20' : 'hover:bg-inset'
                    }`}>
                      <div className="w-7 h-7 rounded flex items-center justify-center bg-inset border border-edge">
                        {rankIcon(index + 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isCurrentUser ? 'text-brand' : 'text-[#e5ecfb]'}`}>
                          {entry.username}
                          {isCurrentUser && <span className="text-[10px] opacity-70 ml-1">(You)</span>}
                        </p>
                        {isSharedCompetition && (entry.universityName || entry.universityCode) && (
                          <p className="mt-1">
                            <span className="inline-flex items-center rounded-full border border-[#33405c] bg-[#0b1220] px-2 py-0.5 text-[10px] font-semibold text-muted">
                              {entry.universityName || entry.universityCode}
                            </span>
                          </p>
                        )}
                        <p className="text-[10px] text-faint">{entry.solvedChallenges} solved</p>
                      </div>
                      <span className="text-brand font-bold text-sm">{entry.points}</span>
                    </div>
                  );
                })}
                {userRank > 5 && user && (() => {
                  const userEntry = leaderboard[userRank - 1];
                  return userEntry ? (
                    <>
                      <div className="border-t border-edge my-1" />
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-brand/8 border border-brand/20">
                        <div className="w-7 h-7 rounded flex items-center justify-center bg-inset border border-edge">
                          <span className="text-[10px] font-bold text-dim">{userRank}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-brand truncate">{userEntry.username} <span className="text-[10px] opacity-70">(You)</span></p>
                          {isSharedCompetition && (userEntry.universityName || userEntry.universityCode) && (
                            <p className="mt-1">
                              <span className="inline-flex items-center rounded-full border border-[#33405c] bg-[#0b1220] px-2 py-0.5 text-[10px] font-semibold text-muted">
                                {userEntry.universityName || userEntry.universityCode}
                              </span>
                            </p>
                          )}
                          <p className="text-[10px] text-faint">{userEntry.solvedChallenges} solved</p>
                        </div>
                        <span className="text-brand font-bold text-sm">{userEntry.points}</span>
                      </div>
                    </>
                  ) : null;
                })()}
                {leaderboard.length === 0 && <p className="text-faint text-sm text-center py-4">No participants yet</p>}
              </div>
              <div className="p-4 border-t border-edge">
                <Button onClick={() => navigate(`/competition/${id}/leaderboard`)} className="w-full bg-inset border border-edge text-fg-soft hover:bg-surface-alt text-sm">
                  View Full Leaderboard
                </Button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-panel border border-edge rounded-xl overflow-hidden">
              <div className="p-4 border-b border-edge bg-inset flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-neon" />
                <span className="font-bold text-fg text-sm">Recent Activity</span>
              </div>
              <div className="p-4 space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                {recentActivity.length > 0 ? recentActivity.slice(0, 8).map((activity, index) => (
                  <div key={index} className="p-3 bg-inset rounded-lg border border-edge">
                    <p className="text-sm">
                      <span className="font-bold text-brand">{activity.username}</span>
                      <span className="text-dim"> solved </span>
                      <span className="font-medium text-[#e5ecfb]">{activity.challengeTitle}</span>
                    </p>
                    <p className="text-[10px] text-faint mt-1">
                      {activity.timestamp} · <span className="text-brand">+{activity.points} pts</span>
                    </p>
                  </div>
                )) : (
                  <p className="text-faint text-sm text-center py-4">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Code Modal (overlay) */}
      <AnimatePresence>
        {showSecurityCodeModal && competition && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-canvas/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-panel border border-edge rounded-2xl max-w-md w-full p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-amber" />
                </div>
                <h2 className="text-2xl font-black text-fg mb-2">Security Code Required</h2>
                <p className="text-muted text-sm">Enter the code to access this competition.</p>
              </div>
              <form onSubmit={handleSecurityCodeSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter security code"
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value)}
                  className="w-full font-mono text-center tracking-widest bg-inset border-edge text-fg"
                  autoFocus
                />
                {securityCodeError && <p className="text-danger text-sm">{securityCodeError}</p>}
                <Button type="submit" className="w-full bg-brand text-white hover:bg-[#00c064] font-bold" disabled={enteringCode}>
                  {enteringCode ? 'Verifying...' : 'Enter Competition'}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompetitionDashboardPage;
