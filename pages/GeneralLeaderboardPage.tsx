import React, { useEffect, useMemo, useState } from 'react';
import { userService } from '../services/userService';
import { universityService } from '../services/universityService';
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

  const me = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const currentUsername = me?.username || '';
  const isSuperAdmin = me?.role === 'super-admin';

  // Super-admin only: choose which university's leaderboard to view.
  const [universities, setUniversities] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    universityService
      .getUniversities()
      .then((list: any) => {
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setUniversities(arr);
        if (arr.length) setSelectedUniversity((prev) => prev || arr[0].code);
      })
      .catch(() => {
        /* non-fatal: the dropdown just stays empty */
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  const fetchLeaderboard = async () => {
    // A super-admin must pick a university first — their own code ('SUPER') has no board.
    if (isSuperAdmin && !selectedUniversity) {
      setRows([]);
      setTotalChallenges(0);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await userService.getLeaderboard(isSuperAdmin ? selectedUniversity : undefined);
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

  // (Re)fetch on mount and whenever the super-admin switches university.
  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUniversity, isSuperAdmin]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, selectedUniversity, isSuperAdmin]);

  const entries: UnifiedLeaderboardEntry[] = useMemo(
    () =>
      rows.map((row: LeaderboardRow) => ({
        id: row._id,
        username: row.username,
        player: row.displayName || row.fullName || row.username,
        points: Number(row.points || 0),
        flagsPwned: Number(row.solvedChallenges || 0),
        isCurrentUser: currentUsername ? row.username?.toLowerCase() === currentUsername.toLowerCase() : false,
      })),
    [rows, currentUsername]
  );

  const selectedUniName = universities.find((u) => u.code === selectedUniversity)?.name;

  return (
    <>
      {isSuperAdmin && (
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[#8390ac]">University</label>
          <select
            value={selectedUniversity}
            onChange={(e) => setSelectedUniversity(e.target.value)}
            className="bg-[#141c2b] border border-[#2a3346] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors"
          >
            {universities.length === 0 && <option value="">No universities</option>}
            {universities.map((u) => (
              <option key={u.code} value={u.code}>
                {u.name} ({u.code})
              </option>
            ))}
          </select>
        </div>
      )}

      <UnifiedLeaderboard
        title="General Leaderboard"
        subtitle={
          isSuperAdmin
            ? selectedUniName
              ? `${selectedUniName} · ${entries.length} players`
              : 'Select a university to view its leaderboard'
            : `${entries.length} solo players ranked by points and flags`
        }
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
