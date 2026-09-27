import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, RotateCw, UserX } from 'lucide-react';
import { userService } from '../services/userService';
import ProfileView from '../components/profile/ProfileView';
import { CompetitionRecord, ProfileData, toCompetitionRecord, toProfileData } from '../components/profile/profileData';

const storedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

/**
 * Someone else's profile: the same layout as your own, with nothing to edit.
 * The server decides what is visible. The profile itself is limited to your
 * own university and the universities it competes with, and the competition
 * record to what your university could open itself.
 */
const PublicProfilePage: React.FC = () => {
  const { userId = '' } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const me = useMemo(storedUser, []);
  const self = !!userId && (userId === me.id || userId === me._id);

  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState('');
  const [record, setRecord] = useState<CompetitionRecord | null>(null);
  const [recordError, setRecordError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(toProfileData(await userService.getPublicProfile(userId)));
    } catch (err: any) {
      setError(err?.message || 'Failed to load profile');
    }
  }, [userId]);

  const loadRecord = useCallback(async () => {
    setRecordError('');
    try {
      setRecord(toCompetitionRecord(await userService.getCompetitionRecord(userId)));
    } catch (err: any) {
      setRecordError(err?.message || 'Could not load the competition record');
    }
  }, [userId]);

  useEffect(() => {
    if (self || !userId) return;
    setData(null);
    setRecord(null);
    load();
    loadRecord();
  }, [self, userId, load, loadRecord]);

  if (self) return <Navigate to="/profile" replace />;

  const back = (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/leaderboard'))}
      className="inline-flex items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-2 text-sm font-semibold text-fg-soft transition-colors hover:border-edge-light hover:text-fg touch:min-h-tap"
    >
      <ArrowLeft size={16} /> Back
    </button>
  );

  if (error) {
    const denied = /access denied/i.test(error);
    const missing = /not found/i.test(error);
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        {back}
        <div className="rounded-2xl border border-edge bg-panel px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-edge bg-inset text-faint">
            {denied ? <Lock size={20} /> : <UserX size={20} />}
          </div>
          <p className="font-semibold text-fg-soft">
            {denied ? 'This profile is not open to you' : missing ? 'No player with this profile' : 'This profile could not be loaded'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            {denied
              ? 'Profiles are visible within a university and to the universities it competes with.'
              : missing
                ? 'The link may be out of date, or the account was removed.'
                : error}
          </p>
          {!denied && !missing && (
            <button
              type="button"
              onClick={load}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-edge bg-surface px-4 py-2 text-sm font-semibold text-fg-soft hover:border-edge-light hover:text-fg touch:min-h-tap"
            >
              <RotateCw size={14} /> Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl space-y-6" aria-busy="true" aria-label="Loading profile">
        {back}
        <div className="h-64 animate-pulse rounded-2xl border border-edge bg-panel sm:h-56" />
        <div className="h-11 animate-pulse rounded-lg bg-panel/60" />
        <div className="h-52 animate-pulse rounded-xl border border-edge bg-panel" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-6xl">{back}</div>
      <ProfileView
        data={data}
        record={record}
        recordError={recordError}
        onRetryRecord={loadRecord}
        own={false}
        linkChallenges={(me.universityCode || '').toUpperCase() === data.universityCode}
      />
    </div>
  );
};

export default PublicProfilePage;
