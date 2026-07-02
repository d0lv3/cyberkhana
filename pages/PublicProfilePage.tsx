import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import Card from '../components/ui/EnhancedCard';
import Button from '../components/ui/button';
import { Trophy, Target, Award, Calendar, ArrowLeft, CheckCircle, Crown } from 'lucide-react';

interface PublicProfile {
  _id: string;
  username: string;
  fullName?: string;
  displayName?: string;
  points: number;
  rank?: number;
  universityCode?: string;
  profileIcon?: string;
  solvedChallenges: Array<{
    _id: string;
    title: string;
    category: string;
    points: number;
    solvedAt: string;
    isFirstBlood?: boolean;
  }>;
  createdAt?: string;
}

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await userService.getPublicProfile(userId!);
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative text-fg-soft pb-16 overflow-hidden">
        <div className="animate-pulse space-y-6">
          <div className="h-40 bg-surface border border-edge rounded-xl" />
          <div className="h-64 bg-surface border border-edge rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="relative text-fg-soft pb-16 overflow-hidden">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 border border-edge-soft bg-surface text-fg-soft hover:bg-[#131b2a]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="p-8 text-center border-edge bg-surface">
          <p className="text-red-400">{error || 'Profile not found'}</p>
        </Card>
      </div>
    );
  }

  const displayName = profile.fullName || profile.displayName || profile.username;

  return (
    <div className="relative text-fg-soft pb-16">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 border border-edge-soft bg-surface text-fg-soft hover:bg-[#131b2a]">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Profile Header */}
      <Card className="p-8 mb-6 border-edge bg-surface">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1f2a40] to-surface border border-[#3a4864] flex items-center justify-center text-3xl font-bold text-white ring-4 ring-edge">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-fg mb-1">{displayName}</h1>
            <p className="text-muted mb-2">@{profile.username}</p>
            {profile.universityCode && (
              <p className="text-muted-alt text-sm">{profile.universityCode}</p>
            )}
            {profile.createdAt && (
              <div className="flex items-center gap-2 text-muted-alt text-sm mt-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {profile.rank && (
          <Card className="p-6 text-center border-edge bg-surface">
            <Trophy className="w-8 h-8 text-amber mx-auto mb-2" />
            <div className="text-3xl font-black text-fg">#{profile.rank}</div>
            <div className="text-muted text-sm">Rank</div>
          </Card>
        )}
        <Card className="p-6 text-center border-edge bg-surface">
          <Award className="w-8 h-8 text-brand-neon mx-auto mb-2" />
          <div className="text-3xl font-black text-brand-neon">{profile.points}</div>
          <div className="text-muted text-sm">Points</div>
        </Card>
        <Card className="p-6 text-center border-edge bg-surface">
          <Target className="w-8 h-8 text-info mx-auto mb-2" />
          <div className="text-3xl font-black text-fg">{profile.solvedChallenges?.length || 0}</div>
          <div className="text-muted text-sm">Challenges Solved</div>
        </Card>
      </div>

      {/* Solved Challenges */}
      <Card className="p-6 border-edge bg-surface">
        <h2 className="text-xl font-black text-fg mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-brand-neon" />
          Solved Challenges
        </h2>
        {profile.solvedChallenges && profile.solvedChallenges.length > 0 ? (
          <div className="space-y-3">
            {profile.solvedChallenges.map((challenge, index) => (
              <div
                key={challenge._id || index}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  challenge.isFirstBlood 
                    ? 'bg-[#2b2318] border border-amber/40' 
                    : 'bg-[#131b2a] border border-edge-soft'
                }`}
              >
                <div className="flex items-center gap-3">
                  {challenge.isFirstBlood && (
                    <Crown className="w-5 h-5 text-amber" />
                  )}
                  <div>
                    <p className={`font-semibold ${challenge.isFirstBlood ? 'text-[#f8d8a6]' : 'text-[#dce5f9]'}`}>
                      {challenge.title}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-alt">{challenge.category}</span>
                      {challenge.isFirstBlood && (
                        <span className="text-amber text-xs">🩸 First Blood</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-brand-neon font-semibold">{challenge.points} pts</div>
                  <div className="text-muted-alt text-xs">
                    {new Date(challenge.solvedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-alt">
            <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No challenges solved yet</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PublicProfilePage;
