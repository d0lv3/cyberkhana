import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trophy, Target, Clock, Award, Flag, Zap, Shield } from 'lucide-react';
import { userService } from '../../services/userService';

interface SolvedChallenge {
  _id: string;
  title: string;
  category: string;
  points: number;
  solvedAt: string;
  competitionName?: string;
}

interface UserProfile {
  _id: string;
  username: string;
  fullName?: string;
  displayName?: string;
  universityName?: string;
  totalPoints: number;
  rank: number;
  totalUsers: number;
  totalSolved: number;
  regularSolvedCount: number;
  competitionSolvedCount: number;
  regularSolvedChallenges: SolvedChallenge[];
  competitionSolvedChallenges: SolvedChallenge[];
}

interface ProfileSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    username: string;
    points: number;
    solvedChallenges: number;
    universityCode?: string;
    fullName?: string;
    displayName?: string;
    totalTimeHours?: number;
    averageSolveTimeHours?: number;
    _id?: string;
  } | null;
  rank?: number;
  totalChallenges?: number;
}

const ProfileSlidePanel: React.FC<ProfileSlidePanelProps> = ({ isOpen, onClose, user, rank, totalChallenges }) => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (isOpen && user?._id) {
      fetchUserProfile();
    }
  }, [isOpen, user?._id]);

  const fetchUserProfile = async () => {
    if (!user?._id) return;
    setLoadingProfile(true);
    try {
      const profile = await userService.getPublicProfile(user._id);
      setUserProfile(profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Web: 'bg-blue-500/20 text-blue-400',
      'Web Exploitation': 'bg-blue-500/20 text-blue-400',
      Crypto: 'bg-purple-500/20 text-purple-400',
      Cryptography: 'bg-purple-500/20 text-purple-400',
      Pwn: 'bg-red-500/20 text-red-400',
      'Binary Exploitation': 'bg-red-500/20 text-red-400',
      Reverse: 'bg-orange-500/20 text-orange-400',
      'Reverse Engineering': 'bg-orange-500/20 text-orange-400',
      Forensics: 'bg-green-500/20 text-green-400',
      Misc: 'bg-zinc-500/20 text-zinc-400',
      Miscellaneous: 'bg-zinc-500/20 text-zinc-400',
      OSINT: 'bg-cyan-500/20 text-cyan-400',
    };
    return colors[category] || 'bg-zinc-500/20 text-zinc-400';
  };

  if (!user) return null;

  const displayName = user.fullName || user.displayName || user.username;
  const podiumShape = 'polygon(4% 0%,96% 0%,100% 9%,100% 84%,50% 100%,0% 84%,0% 9%)';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-[#121212] border-l border-[#263248] z-50 transform transition-transform duration-500 ease-out overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="sticky top-0 z-20 flex justify-end p-3 bg-gradient-to-b from-[#121212] to-transparent">
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-[#2a3346] bg-[#1a2332] text-[#9aa5bf] hover:text-[#f3f6ff] hover:border-[#3a4864] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 px-5 pb-5">
            <div className="space-y-6">
              <div className="relative pt-2">
                <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-20 px-3 py-1 rounded bg-[#f3a43a] text-[#1a2332] text-xs font-black shadow-sm">
                  RANK #{rank || '-'}
                </div>

                <div className="relative h-64 drop-shadow-[0_10px_26px_rgba(0,0,0,0.38)]">
                  <div className="absolute inset-0 bg-[#6f56d9]/70" style={{ clipPath: podiumShape }} />
                  <div className="absolute inset-[1.5px] overflow-hidden bg-[#1a2332]" style={{ clipPath: podiumShape }}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_22%,rgba(159,239,0,0.2),transparent_46%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_82%,rgba(111,86,217,0.22),transparent_44%)]" />

                    <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
                      <div className="w-24 h-24 rounded-full border border-[#6f56d9]/60 bg-[#121a2a] flex items-center justify-center text-3xl font-black text-[#9fef00] overflow-hidden">
                        {displayName.charAt(0).toUpperCase()}
                      </div>

                      <p className="mt-4 text-xl font-black text-[#f3f6ff] truncate max-w-[240px]" title={displayName}>
                        {displayName}
                      </p>
                      <p className="text-[#9aa5bf] text-sm">@{user.username}</p>
                      {userProfile?.universityName ? (
                        <p className="text-[#7d8aa5] text-xs mt-1 truncate max-w-[240px]">{userProfile.universityName}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#263248] bg-[#1a2332] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-[#d8b4fe]" />
                    <span className="text-[#8390ac] text-xs">Rank</span>
                  </div>
                  <div className="text-xl font-black text-[#f3f6ff]">#{rank || '-'}</div>
                </div>

                <div className="rounded-xl border border-[#263248] bg-[#1a2332] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-[#9fef00]" />
                    <span className="text-[#8390ac] text-xs">Points</span>
                  </div>
                  <div className="text-xl font-black text-[#9fef00]">{user.points}</div>
                </div>

                <div className="rounded-xl border border-[#263248] bg-[#1a2332] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[#60a5fa]" />
                    <span className="text-[#8390ac] text-xs">Solved</span>
                  </div>
                  <div className="text-xl font-black text-[#f3f6ff]">
                    {user.solvedChallenges}
                    {totalChallenges ? <span className="text-xs text-[#7d8aa5]">/{totalChallenges}</span> : null}
                  </div>
                </div>

                {user.totalTimeHours && user.totalTimeHours > 0 ? (
                  <div className="rounded-xl border border-[#263248] bg-[#1a2332] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-[#c084fc]" />
                      <span className="text-[#8390ac] text-xs">Avg Time</span>
                    </div>
                    <div className="text-xl font-black text-[#f3f6ff]">
                      {user.averageSolveTimeHours?.toFixed(1) || '0.0'}h
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-2 rounded-xl border border-[#263248] bg-[#1a2332] p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Flag className="w-5 h-5 text-[#9fef00]" />
                  <h3 className="text-lg font-black tracking-tight text-[#f3f6ff]">Challenges Solved</h3>
                </div>

                {loadingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-[#3a4864] border-t-[#9fef00] rounded-full animate-spin" />
                  </div>
                ) : userProfile ? (
                  <div className="space-y-4">
                    {userProfile.regularSolvedChallenges && userProfile.regularSolvedChallenges.length > 0 && (
                      <div>
                        <div className="text-sm text-[#9aa5bf] mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Practice Challenges ({userProfile.regularSolvedCount})
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userProfile.regularSolvedChallenges.map((challenge) => (
                            <div key={challenge._id} className="rounded-lg p-3 border border-[#2a3346] bg-[#131b2a]">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-[#f3f6ff] text-sm">{challenge.title}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(challenge.category)}`}>
                                      {challenge.category}
                                    </span>
                                    <span className="text-xs text-[#7d8aa5]">{formatDate(challenge.solvedAt)}</span>
                                  </div>
                                </div>
                                <div className="text-[#9fef00] font-bold text-sm">+{challenge.points}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {userProfile.competitionSolvedChallenges && userProfile.competitionSolvedChallenges.length > 0 && (
                      <div>
                        <div className="text-sm text-[#9aa5bf] mb-2 flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          Competition Challenges ({userProfile.competitionSolvedCount})
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userProfile.competitionSolvedChallenges.map((challenge) => (
                            <div key={challenge._id} className="rounded-lg p-3 border border-[#2a3346] bg-[#131b2a]">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-[#f3f6ff] text-sm">{challenge.title}</div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(challenge.category)}`}>
                                      {challenge.category}
                                    </span>
                                    {challenge.competitionName && (
                                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                                        {challenge.competitionName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-[#9fef00] font-bold text-sm">+{challenge.points}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!userProfile.regularSolvedChallenges || userProfile.regularSolvedChallenges.length === 0) &&
                      (!userProfile.competitionSolvedChallenges || userProfile.competitionSolvedChallenges.length === 0) && (
                        <div className="text-center py-8 text-[#7d8aa5]">
                          <Flag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No challenges solved yet</p>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#7d8aa5]">
                    <p>Unable to load challenge details</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onClose();
                  if (user._id) {
                    navigate(`/profile/${user._id}`);
                  }
                }}
                className="w-full py-3 rounded-lg border border-[#9fef00]/45 bg-[#1a2332] text-[#f3f6ff] font-semibold hover:border-[#9fef00] hover:text-[#9fef00] transition-colors"
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSlidePanel;
