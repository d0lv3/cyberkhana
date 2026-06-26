import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { competitionService } from '../../services/competitionService';
import { userService } from '../../services/userService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import { useSocket } from '../../src/contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Trophy, Users, Clock, Activity, Target, TrendingUp,
  CheckCircle2, RefreshCw, Zap, Timer, Flame, Eye, BarChart3,
  MousePointer, Medal, Award, Search, ChevronLeft, ChevronRight, Crown, Shield, X
} from 'lucide-react';

interface Competition {
  _id: string;
  name: string;
  status: string;
  startTime: string;
  endTime: string;
  universityCodes?: string[];
  challenges: any[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-[#9fef00]" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-[#cbd5e1]" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-[#d6a55a]" />;
  return <span className="text-sm font-black text-[#9aa5bf]">{rank}</span>;
};

const CompetitionMonitoringPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'students' | 'activity'>('leaderboard');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    averageSolveTime: 0,
    challengeCompletionRate: 0,
    totalParticipants: 0,
    activeParticipants: 0,
    categoryStats: [] as any[],
    hourlyActivity: [] as any[]
  });
  
  const { socket, isConnected, joinCompetition, leaveCompetition } = useSocket();

  useEffect(() => {
    if (id) {
      fetchCompetitionData();
      if (isConnected && id) {
        joinCompetition(id);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (id) leaveCompetition(id);
    };
  }, [id, isConnected, joinCompetition, leaveCompetition]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('competitionActivity', (activity) => {
      setActivities(prev => [activity, ...prev].slice(0, 50));
      setLastUpdate(new Date());
    });

    socket.on('flagSubmitted', () => {
      if (id) {
        competitionService.getCompetitionLeaderboard(id).then((response) => {
          const leaderboardData = Array.isArray(response) ? response : response.leaderboard || [];
          setLeaderboard(leaderboardData);
          setLastUpdate(new Date());
        });
      }
    });

    socket.on('competitionUpdate', (data) => {
      if (data.competitionId === id) fetchCompetitionData(true);
    });

    return () => {
      socket.off('competitionActivity');
      socket.off('flagSubmitted');
      socket.off('competitionUpdate');
    };
  }, [socket, isConnected, id]);

  const fetchCompetitionData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const competitionData = await competitionService.getCompetitionById(id!);
      setCompetition(competitionData);

      const leaderboardResponse = await competitionService.getCompetitionLeaderboard(id!);
      const leaderboardData = Array.isArray(leaderboardResponse) 
        ? leaderboardResponse 
        : leaderboardResponse.leaderboard || [];
      setLeaderboard(leaderboardData);

      const activityData = await competitionService.getCompetitionActivity(id!);
      setActivities(activityData);

      calculateStats(competitionData, leaderboardData, activityData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching competition data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (competition: any, leaderboard: any[], activities: any[]) => {
    const totalChallenges = competition?.challenges?.length || 0;
    const totalSolves = competition?.challenges?.reduce((sum: number, c: any) => sum + (c.solves || 0), 0) || 0;
    const uniqueParticipants = leaderboard.length;

    const challengeCompletionRate = totalChallenges > 0 && uniqueParticipants > 0
      ? ((totalSolves / (uniqueParticipants * totalChallenges)) * 100).toFixed(1)
      : 0;

    const categoryMap = new Map();
    competition?.challenges?.forEach((challenge: any) => {
      const category = challenge.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { name: category, solves: 0, total: 0 });
      }
      const stat = categoryMap.get(category);
      stat.solves += challenge.solves || 0;
      stat.total += 1;
    });
    const categoryStats = Array.from(categoryMap.values());

    const now = new Date();
    const hourlyActivity = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(now.getTime() - (i - 1) * 60 * 60 * 1000);
      const hourActivities = activities.filter((a: any) => {
        const activityTime = new Date(a.timestamp || a.solvedAt);
        return activityTime >= hourStart && activityTime < hourEnd;
      });
      hourlyActivity.push({
        hour: hourStart.getHours(),
        count: hourActivities.length
      });
    }

    setStats({
      averageSolveTime: 0, 
      challengeCompletionRate: Number(challengeCompletionRate),
      totalParticipants: uniqueParticipants,
      activeParticipants: leaderboard.filter((l: any) => l.solvedChallenges > 0).length,
      categoryStats,
      hourlyActivity
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const filteredLeaderboard = useMemo(() => leaderboard.filter((user: any) => {
    const nameToCheck = user.fullName || user.displayName || user.username;
    return nameToCheck?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.username?.toLowerCase().includes(searchTerm.toLowerCase());
  }), [leaderboard, searchTerm]);

  const paginatedLeaderboard = filteredLeaderboard.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);
  const isSharedCompetition = (competition?.universityCodes?.length || 0) > 1;

  const getTierDetails = (rank: number) => {
    if (rank === 1) return { tier: 'Holo', frame: 'bg-[#6f56d9]/75', border: 'border-[#6f56d9]/55', text: 'text-[#d8b4fe]', color: 'from-[#60a5fa] via-[#d8b4fe] to-[#9fef00]' };
    if (rank === 2) return { tier: 'Silver', frame: 'bg-[#94a3b8]/75', border: 'border-[#64748b]/50', text: 'text-[#cbd5e1]', color: 'from-[#cbd5e1] to-[#94a3b8]' };
    if (rank === 3) return { tier: 'Bronze', frame: 'bg-[#d6a55a]/70', border: 'border-[#d6a55a]/45', text: 'text-[#d6a55a]', color: 'from-[#e5b970] to-[#a46b28]' };
    return { tier: 'Player', frame: 'bg-[#2a3346]/50', border: 'border-[#263248]', text: 'text-[#9aa5bf]', color: 'from-[#3a4864] to-[#263248]' };
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
  };

  const handleViewChallenge = (challenge: any) => {
    setSelectedChallenge(challenge);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111622] flex flex-col items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#33405c] border-t-[#9fef00] rounded-full mb-4"></div>
        <p className="text-[#9aa5bf] font-mono tracking-widest text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111622] text-[#d2d7e3] font-sans selection:bg-[#9fef00]/30 selection:text-[#9fef00] overflow-x-hidden">
      <div className="container mx-auto px-4 py-8">
        
        {/* Top Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/competitions')}
              className="group text-[#9aa5bf] hover:text-[#f3f6ff] hover:bg-[#1a2332] pl-0 mb-4 transition-all duration-300"
              leftIcon={<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />}
            >
              Back
            </Button>

            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center rounded border border-[#2a3346] bg-[#1a2332] px-3 py-1 text-xs font-mono text-[#9fef00]">
                MONITORING DASHBOARD
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 border rounded-[4px] text-xs font-mono font-bold transition-all duration-300 ${
                isLive ? 'border-[#9fef00]/50 bg-[#9fef00]/10 text-[#9fef00]' : 'border-[#f3a43a]/50 bg-[#f3a43a]/10 text-[#f3a43a]'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-[#9fef00] animate-pulse' : 'bg-[#f3a43a]'}`}></div>
                {isLive ? 'LIVE' : 'PAUSED'}
              </div>
              {refreshing && <RefreshCw className="w-4 h-4 text-[#9fef00] animate-spin" />}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-[#f3f6ff] tracking-tight uppercase">
              {competition?.name}
            </h1>
            <p className="text-[#8390ac] mt-2 font-mono flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" /> Ends: {competition?.endTime ? new Date(competition.endTime).toLocaleString() : 'No time limit'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-[#6e7a94] font-mono mr-4">
              Last updated: <span className="text-[#9aa5bf]">{formatTimeAgo(lastUpdate)}</span>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsLive(!isLive)}
              className={`border-[#2a3346] bg-[#1a2332] hover:bg-[#1f2a40] ${isLive ? 'text-[#f3a43a]' : 'text-[#9fef00]'}`}
            >
              {isLive ? 'Pause' : 'Resume'}
            </Button>
            <Button
              variant="default"
              onClick={() => fetchCompetitionData(true)}
              disabled={refreshing}
              className="bg-[#9fef00] text-[#111622] hover:bg-[#b0f52b] font-black"
              leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#182130] border border-[#2a3346] p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-[#00a859]" />
              <span className="text-xs text-[#8390ac]">Challenges Solved</span>
            </div>
            <p className="text-2xl font-black text-[#f3f6ff]">
              {competition?.challenges.filter((c: any) => (c.solves || 0) > 0).length}
              <span className="text-sm text-[#6e7a94] font-normal ml-1">/ {competition?.challenges.length || 0}</span>
            </p>
          </div>
          <div className="bg-[#182130] border border-[#2a3346] p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-[#60a5fa]" />
              <span className="text-xs text-[#8390ac]">Participants</span>
            </div>
            <p className="text-2xl font-black text-[#f3f6ff]">
              {stats.activeParticipants}
              <span className="text-sm text-[#6e7a94] font-normal ml-1">/ {stats.totalParticipants}</span>
            </p>
          </div>
          <div className="bg-[#182130] border border-[#2a3346] p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-[#f3a43a]" />
              <span className="text-xs text-[#8390ac]">Completion Rate</span>
            </div>
            <p className="text-2xl font-black text-[#f3f6ff]">{stats.challengeCompletionRate}%</p>
          </div>
          <div className="bg-[#182130] border border-[#2a3346] p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-[#6f56d9]" />
              <span className="text-xs text-[#8390ac]">Total Solves</span>
            </div>
            <p className="text-2xl font-black text-[#f3f6ff]">
              {competition?.challenges.reduce((sum, c) => sum + (c.solves || 0), 0) || 0}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[#263248]">
          {(['leaderboard', 'students', 'activity'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              className={`px-5 py-3 text-sm font-bold capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[#00a859] text-[#00a859]'
                  : 'border-transparent text-[#8390ac] hover:text-[#d2d7e3]'
              }`}
            >
              {tab === 'leaderboard' ? 'Leaderboard' : tab === 'students' ? 'Student Progress' : 'Live Activity'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mb-8">
          <div>
            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                  <h2 className="text-xl font-bold text-[#f3f6ff] flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#f3a43a]" /> Rankings
                  </h2>
                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 text-[#8390ac] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={searchTerm}
                      onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      placeholder="Search participants..."
                      className="w-full bg-[#182130] border border-[#2a3346] rounded px-9 py-2 text-sm text-[#e2e8f6] placeholder:text-[#6e7a94] focus:outline-none focus:border-[#00a859]"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[#263248] bg-[#182130] overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead className="border-b border-[#263248] bg-[#151c29]">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs text-[#8390ac]">Rank</th>
                        <th className="text-left px-5 py-3 text-xs text-[#8390ac]">Participant</th>
                        <th className="text-left px-5 py-3 text-xs text-[#8390ac]">Score</th>
                        <th className="text-left px-5 py-3 text-xs text-[#8390ac]">Challenges Solved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLeaderboard.map((user, index) => {
                        const globalRank = (currentPage - 1) * itemsPerPage + index + 1;
                        const { text, frame, border } = getTierDetails(globalRank);
                        return (
                          <tr
                            key={user._id}
                            onClick={() => handleViewUser(user)}
                            className="border-b border-[#2a3346]/50 hover:bg-[#1f2a40] transition-colors cursor-pointer group"
                          >
                            <td className="px-5 py-4">
                              <div className="text-[#f3f6ff] font-black w-8">
                                {globalRank <= 3 ? rankIcon(globalRank) : <span className="text-[#8390ac]">#{globalRank}</span>}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded border ${border} ${frame} flex items-center justify-center text-xs font-black text-[#f3f6ff]`}>
                                  {user.username?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-[#e5ecfb] group-hover:text-[#00a859] transition-colors">{user.username}</p>
                                  {isSharedCompetition && (user.universityName || user.universityCode) && (
                                    <p className="mt-1">
                                      <span className="inline-flex items-center rounded-full border border-[#33405c] bg-[#111622] px-2 py-0.5 text-[10px] font-semibold text-[#9aa5bf]">
                                        {user.universityName || user.universityCode}
                                      </span>
                                    </p>
                                  )}
                                  {user.fullName && user.fullName !== user.username && <p className="text-[11px] text-[#6e7a94]">{user.fullName}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[#f3a43a] font-bold text-base">{user.points}</td>
                            <td className="px-5 py-4 text-[#dce5f9]">
                              {user.solvedChallenges} <span className="text-[#6e7a94] text-xs">/ {competition?.challenges.length}</span>
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedLeaderboard.length === 0 && (
                        <tr><td colSpan={4} className="px-5 py-8 text-center text-[#6e7a94]">No participants found</td></tr>
                      )}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <div className="p-4 flex justify-between items-center bg-[#151c29]">
                      <span className="text-xs text-[#8390ac]">Page {currentPage} / {totalPages}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" className="border-[#2a3346] text-[#9aa5bf] h-8 w-8 p-0 bg-[#111622] hover:bg-[#1a2332]" disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)}>
                          <ChevronLeft className="w-4 h-4"/>
                        </Button>
                        <Button variant="outline" className="border-[#2a3346] text-[#9aa5bf] h-8 w-8 p-0 bg-[#111622] hover:bg-[#1a2332]" disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)}>
                          <ChevronRight className="w-4 h-4"/>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Student Progress Tab */}
            {activeTab === 'students' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                  <h2 className="text-xl font-bold text-[#f3f6ff] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#60a5fa]" /> Student Progress
                  </h2>
                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 text-[#8390ac] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={searchTerm}
                      onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      placeholder="Search students..."
                      className="w-full bg-[#182130] border border-[#2a3346] rounded px-9 py-2 text-sm text-[#e2e8f6] placeholder:text-[#6e7a94] focus:outline-none focus:border-[#60a5fa]"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[#263248] bg-[#182130] overflow-hidden">
                  {paginatedLeaderboard.map((user, index) => {
                    const globalRank = (currentPage - 1) * itemsPerPage + index + 1;
                    const isExpanded = expandedStudent === user._id;
                    const totalChallenges = competition?.challenges.length || 0;
                    const progressPct = totalChallenges > 0 ? Math.round(((user.solvedChallenges || 0) / totalChallenges) * 100) : 0;

                    // Find activities for this student
                    const studentActivities = activities.filter((a: any) => a.userId === user._id || a.username === user.username);
                    const lastActive = studentActivities.length > 0
                      ? formatTimeAgo(new Date(studentActivities[0].solvedAt || studentActivities[0].timestamp))
                      : 'Never';

                    return (
                      <div key={user._id} className="border-b border-[#2a3346]/50 last:border-b-0">
                        <div
                          onClick={() => setExpandedStudent(isExpanded ? null : user._id)}
                          className="flex items-center gap-4 p-4 hover:bg-[#1f2a40] cursor-pointer transition-colors"
                        >
                          <div className="w-8 text-center font-black text-[#8390ac]">
                            {globalRank <= 3 ? rankIcon(globalRank) : <span>#{globalRank}</span>}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-[#0e1522] border border-[#263248] flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-black text-[#00a859]">{user.username?.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#e5ecfb] truncate">{user.username}</p>
                            {isSharedCompetition && (user.universityName || user.universityCode) && (
                              <p className="mt-1">
                                <span className="inline-flex items-center rounded-full border border-[#33405c] bg-[#111622] px-2 py-0.5 text-[10px] font-semibold text-[#9aa5bf]">
                                  {user.universityName || user.universityCode}
                                </span>
                              </p>
                            )}
                            {user.fullName && user.fullName !== user.username && <p className="text-[11px] text-[#6e7a94]">{user.fullName}</p>}
                          </div>
                          <div className="hidden sm:flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <p className="font-bold text-[#f3a43a]">{user.points} pts</p>
                            </div>
                            <div className="w-32">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-[#8390ac]">{user.solvedChallenges || 0}/{totalChallenges}</span>
                                <span className="text-[#00a859]">{progressPct}%</span>
                              </div>
                              <div className="h-1.5 bg-[#111622] rounded-full border border-[#263248] overflow-hidden">
                                <div className="h-full bg-[#00a859] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                              </div>
                            </div>
                            <div className="text-xs text-[#6e7a94] w-20 text-right">{lastActive}</div>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-[#6e7a94] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>

                        {/* Expanded: per-student solve history */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-[#111622]"
                            >
                              <div className="p-4 border-t border-[#263248]">
                                {/* Summary row */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                  <div className="bg-[#182130] border border-[#2a3346] rounded-lg p-3 text-center">
                                    <p className="text-xl font-black text-[#f3a43a]">{user.points}</p>
                                    <p className="text-[10px] text-[#8390ac]">Score</p>
                                  </div>
                                  <div className="bg-[#182130] border border-[#2a3346] rounded-lg p-3 text-center">
                                    <p className="text-xl font-black text-[#00a859]">{user.solvedChallenges || 0}</p>
                                    <p className="text-[10px] text-[#8390ac]">Solved</p>
                                  </div>
                                  <div className="bg-[#182130] border border-[#2a3346] rounded-lg p-3 text-center">
                                    <p className="text-xl font-black text-[#60a5fa]">#{globalRank}</p>
                                    <p className="text-[10px] text-[#8390ac]">Rank</p>
                                  </div>
                                </div>

                                {/* Solve history */}
                                <p className="text-xs text-[#8390ac] mb-2">Solve History</p>
                                {studentActivities.length > 0 ? (
                                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {studentActivities.map((act: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between p-2.5 rounded bg-[#182130] border border-[#2a3346] text-sm">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle2 className="w-4 h-4 text-[#00a859] flex-shrink-0" />
                                          <span className="text-[#e5ecfb] font-medium">{act.challengeTitle}</span>
                                          <span className="text-[10px] text-[#6e7a94] bg-[#111622] px-1.5 py-0.5 rounded border border-[#263248]">{act.category}</span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                          <span className="text-[#00a859] font-bold text-xs">+{act.points} pts</span>
                                          <span className="text-[10px] text-[#6e7a94]">{formatTimeAgo(new Date(act.solvedAt || act.timestamp))}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-[#6e7a94] py-4 text-center">No solves recorded yet</p>
                                )}

                                <div className="mt-3 flex justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => navigate(`/profile/${user._id}`)}
                                    className="border-[#2a3346] text-[#9aa5bf] hover:text-[#f3f6ff] hover:bg-[#1a2332] text-xs"
                                  >
                                    View Full Profile
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                  {paginatedLeaderboard.length === 0 && (
                    <div className="p-8 text-center text-[#6e7a94]">No students found</div>
                  )}
                  {totalPages > 1 && (
                    <div className="p-4 flex justify-between items-center bg-[#151c29] border-t border-[#263248]">
                      <span className="text-xs text-[#8390ac]">Page {currentPage} / {totalPages}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" className="border-[#2a3346] text-[#9aa5bf] h-8 w-8 p-0 bg-[#111622] hover:bg-[#1a2332]" disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)}>
                          <ChevronLeft className="w-4 h-4"/>
                        </Button>
                        <Button variant="outline" className="border-[#2a3346] text-[#9aa5bf] h-8 w-8 p-0 bg-[#111622] hover:bg-[#1a2332]" disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)}>
                          <ChevronRight className="w-4 h-4"/>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Live Activity Tab */}
            {activeTab === 'activity' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl font-bold text-[#f3f6ff] flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-[#9fef00]" /> Live Activity
                </h2>
                <div className="rounded-xl border border-[#263248] bg-[#182130] overflow-hidden">
                  <div className="max-h-[600px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {activities.length > 0 ? activities.slice(0, 30).map((activity, index) => {
                      const timeAgo = formatTimeAgo(new Date(activity.solvedAt || activity.timestamp));
                      return (
                        <div
                          key={`${activity.challengeId}-${activity.userId}-${activity.solvedAt}-${index}`}
                          className="flex items-center justify-between p-3 rounded bg-[#1f2a40] border border-[#2a3346] hover:border-[#00a859]/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-[#00a859] bg-[#00a859]/10 p-2 rounded">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm">
                                <span onClick={() => handleViewUser(activity)} className="font-bold text-[#f3f6ff] hover:text-[#00a859] cursor-pointer mr-2">{activity.username}</span>
                                <span className="text-[#8390ac] mr-2">solved</span>
                                <span onClick={() => handleViewChallenge(activity)} className="font-semibold text-[#f3a43a] hover:underline cursor-pointer">{activity.challengeTitle}</span>
                              </div>
                              <div className="text-xs text-[#8390ac] mt-1 flex items-center gap-3">
                                <span className="text-[#6e7a94]">{activity.category}</span>
                                <span className="text-[#00a859] font-bold">+{activity.points} pts</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-[#6e7a94] flex-shrink-0">{timeAgo}</span>
                        </div>
                      );
                    }) : (
                      <div className="py-12 flex flex-col items-center justify-center opacity-50">
                        <Activity className="w-8 h-8 text-[#6e7a94] mb-2" />
                        <p className="text-sm text-[#9aa5bf]">No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Categories */}
            <div className="rounded-xl border border-[#263248] bg-[#182130] overflow-hidden">
              <div className="p-4 border-b border-[#263248] bg-[#151c29]">
                <span className="text-sm font-bold text-[#dce5f9]">Categories</span>
              </div>
              <div className="p-5 space-y-5">
                {stats.categoryStats.length > 0 ? stats.categoryStats.map((c, i) => {
                  const pct = c.total > 0 ? (c.solves / c.total) * 100 : 0;
                  const colors = ['bg-[#00a859]', 'bg-[#f3a43a]', 'bg-[#60a5fa]', 'bg-[#6f56d9]', 'bg-[#e5b970]'];
                  const color = colors[i % colors.length];
                  return (
                    <div key={c.name}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-[#e5ecfb] font-bold">{c.name}</span>
                        <span className="text-[#8390ac]">{c.solves}/{c.total} <span className={color.replace('bg-', 'text-')}>{pct.toFixed(0)}%</span></span>
                      </div>
                      <div className="h-1.5 w-full bg-[#111622] rounded-full overflow-hidden border border-[#263248]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full ${color} rounded-full`} />
                      </div>
                    </div>
                  )
                }) : (
                  <p className="text-[#6e7a94] text-sm text-center py-4">No data</p>
                )}
              </div>
            </div>

            {/* Top Performers */}
            <div className="rounded-xl border border-[#263248] bg-[#182130] overflow-hidden">
              <div className="p-4 border-b border-[#263248] bg-[#151c29]">
                <span className="text-sm font-bold text-[#dce5f9]">Top Performers</span>
              </div>
              <div className="p-4 space-y-2">
                {leaderboard.slice(0,5).map((user, i) => {
                  const rank = i + 1;
                  return (
                    <div key={user._id} onClick={() => handleViewUser(user)} className="flex items-center gap-3 p-2.5 rounded cursor-pointer hover:bg-[#1f2a40] transition-colors">
                      <div className="w-7 h-7 flex-shrink-0 rounded bg-[#111622] border border-[#2a3346] flex items-center justify-center">
                        {rankIcon(rank)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#f3f6ff] truncate">{user.username}</p>
                        {isSharedCompetition && (user.universityName || user.universityCode) && (
                          <p className="mt-1">
                            <span className="inline-flex items-center rounded-full border border-[#33405c] bg-[#111622] px-2 py-0.5 text-[10px] font-semibold text-[#9aa5bf]">
                              {user.universityName || user.universityCode}
                            </span>
                          </p>
                        )}
                      </div>
                      <p className="text-[#00a859] font-bold text-sm">{user.points} <span className="text-[10px] text-[#6e7a94]">pts</span></p>
                    </div>
                  )
                })}
                {leaderboard.length === 0 && (
                  <p className="text-[#6e7a94] text-sm text-center py-4">No participants yet</p>
                )}
              </div>
            </div>

            {/* Challenge Overview */}
            <div className="rounded-xl border border-[#263248] bg-[#182130] overflow-hidden">
              <div className="p-4 border-b border-[#263248] bg-[#151c29]">
                <span className="text-sm font-bold text-[#dce5f9]">Challenges</span>
              </div>
              <div className="p-4 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {competition?.challenges.map((challenge: any) => {
                  const isPwned = (challenge.solves || 0) > 0;
                  return (
                    <div key={challenge._id} onClick={() => handleViewChallenge(challenge)} className="flex items-center justify-between p-2.5 rounded cursor-pointer hover:bg-[#1f2a40] transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        {isPwned ? <CheckCircle2 className="w-4 h-4 text-[#00a859] flex-shrink-0" /> : <Target className="w-4 h-4 text-[#6e7a94] flex-shrink-0" />}
                        <span className="text-sm text-[#e5ecfb] truncate">{challenge.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-[#6e7a94]">{challenge.solves || 0} solves</span>
                        <span className="text-xs font-bold text-[#00a859]">{challenge.currentPoints || challenge.points} pts</span>
                      </div>
                    </div>
                  );
                })}
                {(!competition?.challenges || competition.challenges.length === 0) && (
                  <p className="text-[#6e7a94] text-sm text-center py-4">No challenges</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#0d131f]/80 backdrop-blur-sm flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-[#182130] border border-[#3a4864] rounded-xl max-w-lg w-full p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-black text-2xl text-[#f3f6ff] flex items-center gap-2">
                     <span className="text-[#9fef00]">&gt;</span> Profile: {selectedUser.username}
                   </h3>
                   <Button variant="ghost" onClick={() => setSelectedUser(null)} className="text-[#8390ac] hover:text-white p-1 hover:bg-[#2a3346]"><X className="w-5 h-5"/></Button>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#111622] p-4 rounded-xl text-center border border-[#2a3346]">
                     <p className="text-3xl font-black text-[#f3a43a] mb-1">{selectedUser.points}</p>
                     <p className="text-[10px] font-mono text-[#8390ac]">Score</p>
                  </div>
                  <div className="bg-[#111622] p-4 rounded-xl text-center border border-[#2a3346]">
                     <p className="text-3xl font-black text-[#9fef00] mb-1">{selectedUser.solvedChallenges || 0}</p>
                     <p className="text-[10px] font-mono text-[#8390ac]">Solved</p>
                  </div>
                  <div className="bg-[#111622] p-4 rounded-xl text-center border border-[#2a3346]">
                     <p className="text-3xl font-black text-[#60a5fa] mb-1">{leaderboard.findIndex((l: any) => l._id === selectedUser._id) + 1 || '-'}</p>
                     <p className="text-[10px] font-mono text-[#8390ac]">Rank</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <Button variant="default" className="flex-1 bg-[#9fef00] text-[#111622] font-black hover:bg-[#b0f52b]" onClick={() => navigate(`/profile/${selectedUser._id}`)}>
                    FULL PROFILE
                  </Button>
                  <Button variant="outline" className="flex-1 border-[#3a4864] text-[#dce5f9] hover:bg-[#263248]" onClick={() => setSelectedUser(null)}>
                    CLOSE
                  </Button>
                </div>
             </motion.div>
          </motion.div>
        )}
        
        {selectedChallenge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#0d131f]/80 backdrop-blur-sm flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-[#182130] border border-[#3a4864] rounded-xl max-w-2xl w-full p-6 shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                   <div>
                     <h3 className="font-black text-2xl text-[#f3f6ff] mb-2">{selectedChallenge.title}</h3>
                     <span className="text-[#9fef00] font-mono text-xs border border-[#9fef00]/30 px-2 py-0.5 rounded bg-[#9fef00]/10">{selectedChallenge.category}</span>
                   </div>
                   <Button variant="ghost" onClick={() => setSelectedChallenge(null)} className="text-[#8390ac] hover:text-white p-1 hover:bg-[#2a3346]"><X className="w-5 h-5"/></Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#111622] p-4 rounded-xl text-center border border-[#2a3346]">
                     <p className="text-xl font-black text-[#f3a43a] mb-1">{selectedChallenge.currentPoints || selectedChallenge.points}</p>
                     <p className="text-[10px] font-mono text-[#8390ac]">REWARD</p>
                  </div>
                  <div className="bg-[#111622] p-4 rounded-xl text-center border border-[#2a3346]">
                     <p className="text-xl font-black text-[#9fef00] mb-1">{selectedChallenge.solves || 0}</p>
                     <p className="text-[10px] font-mono text-[#8390ac]">Solves</p>
                  </div>
                  <div className="bg-[#111622] p-4 rounded-xl text-center border border-[#2a3346]">
                     <p className="text-xl font-black text-[#60a5fa] mb-1 uppercase">{selectedChallenge.difficulty || 'N/A'}</p>
                     <p className="text-[10px] font-mono text-[#8390ac]">RATING</p>
                  </div>
                  <div className="bg-[#111622] p-4 rounded-xl text-center border border-[#2a3346]">
                     <p className={`text-xl font-black mb-1 ${(selectedChallenge.solves || 0) > 0 ? 'text-[#f3a43a]' : 'text-[#8390ac]'}`}>
                       {(selectedChallenge.solves || 0) > 0 ? 'YES' : 'NO'}
                     </p>
                     <p className="text-[10px] font-mono text-[#8390ac]">Solved</p>
                  </div>
                </div>

                {selectedChallenge.description && (
                  <div className="mb-8 bg-[#111622] border border-[#2a3346] rounded-xl p-4">
                    <p className="text-xs font-mono text-[#6e7a94] mb-3 pb-2 border-b border-[#2a3346]">Description</p>
                    <p className="text-[#dce5f9] text-sm leading-relaxed whitespace-pre-wrap font-mono">
                      {selectedChallenge.description}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button variant="default" className="flex-1 bg-[#f3a43a] text-[#111622] font-black hover:bg-[#ffb041]" onClick={() => navigate(`/competitions/${id}/challenges/${selectedChallenge._id}`)}>
                    View Challenge
                  </Button>
                  <Button variant="outline" className="flex-1 border-[#3a4864] text-[#dce5f9] hover:bg-[#263248]" onClick={() => setSelectedChallenge(null)}>
                    CANCEL
                  </Button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompetitionMonitoringPage;
