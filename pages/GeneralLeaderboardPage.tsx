import React, { useEffect, useMemo, useState } from 'react';
import { userService } from '../services/userService';
import UnifiedLeaderboard, { UnifiedLeaderboardEntry } from '../components/leaderboard/UnifiedLeaderboard';
import ProfileSlidePanel from '../components/ui/ProfileSlidePanel';
import { useSocket } from '../src/contexts/SocketContext';

interface LeaderboardRow {
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

const GeneralLeaderboardPage: React.FC = () => {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
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
  const { socket, isConnected } = useSocket();

  const currentUsername = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')?.username || '';
    } catch {
      return '';
    }
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await userService.getLeaderboard();
      const leaderboard = Array.isArray(response) ? response : response?.leaderboard || [];
      const analysis = Array.isArray(response) ? undefined : response?.analysis;

      setRows(leaderboard);
      setTotalChallenges(analysis?.totalChallenges || 0);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const refresh = () => {
      fetchLeaderboard();
    };

    socket.on('leaderboardUpdate', refresh);
    socket.on('flagSubmitted', refresh);

    return () => {
      socket.off('leaderboardUpdate', refresh);
      socket.off('flagSubmitted', refresh);
    };
  }, [socket, isConnected]);

  const entries: UnifiedLeaderboardEntry[] = useMemo(
    () =>
      rows.map((row: LeaderboardRow) => ({
        id: row._id,
        username: row.username,
        player: row.displayName || row.fullName || row.username,
        country: row.country || row.universityCode || row.universityName || 'GLOBAL',
        points: Number(row.points || 0),
        flagsPwned: Number(row.solvedChallenges || 0),
        tier: row.tier,
        isCurrentUser: currentUsername ? row.username?.toLowerCase() === currentUsername.toLowerCase() : false,
      })),
    [rows, currentUsername]
  );

  return (
    <>
      <UnifiedLeaderboard
        title="General Leaderboard"
        subtitle={`${entries.length} solo players ranked by points and flags`}
        entries={entries}
        totalFlags={totalChallenges}
        loading={loading}
        error={error}
        onRetry={fetchLeaderboard}
        onSelectEntry={(entry: UnifiedLeaderboardEntry, rank: number) => {
          const source = rows.find((row: LeaderboardRow) => row._id === entry.id);
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

export default GeneralLeaderboardPage;
