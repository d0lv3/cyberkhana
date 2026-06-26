import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { competitionService } from '../services/competitionService';
import { useSocket } from '../src/contexts/SocketContext';
import UnifiedLeaderboard, { UnifiedLeaderboardEntry } from '../components/leaderboard/UnifiedLeaderboard';
import ProfileSlidePanel from '../components/ui/ProfileSlidePanel';

interface CompetitionLeaderboardUser {
  _id: string;
  username: string;
  fullName?: string;
  displayName?: string;
  points: number;
  solvedChallenges: number;
  universityCode?: string;
  universityName?: string;
  country?: string;
  tier?: string;
}

const CompetitionLeaderboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [competitionName, setCompetitionName] = useState('Competition');
  const [isSharedCompetition, setIsSharedCompetition] = useState(false);
  const [rows, setRows] = useState<CompetitionLeaderboardUser[]>([]);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRank, setSelectedRank] = useState<number | undefined>(undefined);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    username: string;
    points: number;
    solvedChallenges: number;
    universityCode?: string;
    fullName?: string;
    displayName?: string;
    _id?: string;
  } | null>(null);
  const { socket, isConnected, joinCompetition, leaveCompetition } = useSocket();

  const currentUsername = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')?.username || '';
    } catch {
      return '';
    }
  }, []);

  const fetchLeaderboard = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const storedCode = localStorage.getItem(`competition_${id}_security_code`) || undefined;

      const [competitionData, leaderboardResponse] = await Promise.all([
        competitionService.getCompetitionById(id, storedCode),
        competitionService.getCompetitionLeaderboard(id),
      ]);

      setCompetitionName(competitionData?.name || 'Competition');
      setIsSharedCompetition((competitionData?.universityCodes?.length || 0) > 1);

      if (Array.isArray(leaderboardResponse)) {
        setRows(leaderboardResponse);
        setTotalChallenges(competitionData?.challenges?.length || 0);
      } else {
        setRows(leaderboardResponse?.leaderboard || []);
        setTotalChallenges(leaderboardResponse?.totalChallenges || competitionData?.challenges?.length || 0);
      }

      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to load competition leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    if (id && isConnected) {
      joinCompetition(id);
    }

    return () => {
      if (id) leaveCompetition(id);
    };
  }, [id, isConnected, joinCompetition, leaveCompetition]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const refresh = () => fetchLeaderboard();

    socket.on('competitionActivity', refresh);
    socket.on('leaderboardUpdate', refresh);
    socket.on('flagSubmitted', refresh);

    return () => {
      socket.off('competitionActivity', refresh);
      socket.off('leaderboardUpdate', refresh);
      socket.off('flagSubmitted', refresh);
    };
  }, [socket, isConnected, id]);

  const entries: UnifiedLeaderboardEntry[] = useMemo(
    () =>
      rows.map((row) => ({
        id: row._id,
        username: row.username,
        player: row.displayName || row.fullName || row.username,
        playerTag: isSharedCompetition ? row.universityName || row.universityCode : undefined,
        country: row.country || row.universityCode || row.universityName || 'GLOBAL',
        points: Number(row.points || 0),
        flagsPwned: Number(row.solvedChallenges || 0),
        tier: row.tier,
        isCurrentUser: currentUsername ? row.username?.toLowerCase() === currentUsername.toLowerCase() : false,
      })),
    [rows, currentUsername, isSharedCompetition]
  );

  return (
    <>
      <UnifiedLeaderboard
        title={`${competitionName} Leaderboard`}
        subtitle={`${entries.length} solo players in this competition`}
        entries={entries}
        totalFlags={totalChallenges}
        loading={loading}
        error={error}
        onRetry={fetchLeaderboard}
        onSelectEntry={(entry, rank) => {
          const source = rows.find((row) => row._id === entry.id);
          setSelectedUser({
            _id: source?._id || entry.id,
            username: entry.username,
            displayName: source?.displayName,
            fullName: source?.fullName,
            points: Number(entry.points || 0),
            solvedChallenges: Number(entry.flagsPwned || 0),
            universityCode: source?.universityCode,
          });
          setSelectedRank(rank);
          setIsProfileOpen(true);
        }}
      />

      <ProfileSlidePanel
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
        }}
        user={selectedUser}
        rank={selectedRank}
        totalChallenges={totalChallenges}
      />
    </>
  );
};

export default CompetitionLeaderboardPage;
