import React, { useCallback, useEffect, useState } from 'react';
import { Camera, Check, Pencil, RotateCw, X } from 'lucide-react';
import { userService } from '../services/userService';
import AvatarDialog from '../components/account/AvatarDialog';
import { presetFor } from '../components/ui/CyberAvatar';
import ProfileView, { OCTAGON, OctagonAvatar } from '../components/profile/ProfileView';
import { CompetitionRecord, ProfileData, nameOf, toCompetitionRecord, toProfileData } from '../components/profile/profileData';

/* `profileIcon` is required by the API and defaults to 'default' on the model,
   so "no picture" is that sentinel rather than an empty string — which the
   endpoint rejects outright. Neither resolves to a preset, so both land on the
   initial. */
const NO_PICTURE = 'default';

const MAX_FULLNAME_LENGTH = 50;

/* The header, sidebar and leaderboard all read the cached user, so an edit
   here has to reach them without a reload. */
const syncStoredUser = (patch: Record<string, unknown>) => {
  try {
    const merged = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...patch };
    localStorage.setItem('user', JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('userUpdate', { detail: merged }));
  } catch {
    /* The next sign-in refreshes the cache. */
  }
};

const ProfilePage: React.FC = () => {
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState('');
  const [record, setRecord] = useState<CompetitionRecord | null>(null);
  const [recordError, setRecordError] = useState('');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingIcon, setSavingIcon] = useState(false);
  const [iconError, setIconError] = useState('');

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedFullName, setEditedFullName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const loadRecord = useCallback(async () => {
    setRecordError('');
    try {
      setRecord(toCompetitionRecord(await userService.getMyCompetitionRecord()));
    } catch (err: any) {
      setRecordError(err?.message || 'Could not load the competition record');
    }
  }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(toProfileData(await userService.getUserProfile()));
    } catch (err: any) {
      setError(err?.message || 'Could not load your profile');
    }
  }, []);

  useEffect(() => {
    // The record is slower (it re-scores every competition you played), so the rest of the page does not wait for it.
    load();
    loadRecord();
  }, [load, loadRecord]);

  const startEditingName = () => {
    setEditedFullName(data?.fullName || '');
    setNameError('');
    setIsEditingName(true);
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
      setData(current => current && { ...current, fullName: trimmed, name: nameOf(trimmed, current.displayName, current.username) });
      syncStoredUser({ fullName: trimmed });
      setIsEditingName(false);
    } catch (err: any) {
      setNameError(err.message || 'Failed to update');
    } finally {
      setSavingName(false);
    }
  };

  /* Commits the dialog's draft. Nothing is written while the member is still
     looking at the grid — Cancel has to be able to leave the account exactly
     as it was. */
  const handleSaveIcon = async (next: string) => {
    const value = next || NO_PICTURE;
    setSavingIcon(true);
    setIconError('');
    try {
      await userService.updateProfileIcon(value);
      setData(current => current && { ...current, profileIcon: value });
      syncStoredUser({ profileIcon: value });
      setPickerOpen(false);
    } catch (err: any) {
      setIconError(err?.message || 'Could not save your picture');
    } finally {
      setSavingIcon(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-6xl rounded-2xl border border-edge bg-panel px-6 py-14 text-center">
        <p className="font-semibold text-fg-soft">Your profile could not be loaded.</p>
        <p className="mt-1 text-sm text-muted">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-edge bg-surface px-4 py-2 text-sm font-semibold text-fg-soft hover:border-edge-light hover:text-fg touch:min-h-tap"
        >
          <RotateCw size={14} /> Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl space-y-6" aria-busy="true" aria-label="Loading your profile">
        <div className="h-64 animate-pulse rounded-2xl border border-edge bg-panel sm:h-56" />
        <div className="h-11 animate-pulse rounded-lg bg-panel/60" />
        <div className="h-52 animate-pulse rounded-xl border border-edge bg-panel" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-xl border border-edge bg-panel" />
          <div className="h-72 animate-pulse rounded-xl border border-edge bg-panel" />
        </div>
      </div>
    );
  }

  const selectedPreset = presetFor(data.profileIcon);

  /* The picture is the control: pressing the thing you want to replace is a
     shorter path than hunting for a card lower down the page, and the badge is
     there so the affordance is visible without a hover — this has to work on
     a phone, where there is no hover at all. */
  const avatar = (
    <button
      type="button"
      onClick={() => {
        setIconError('');
        setPickerOpen(true);
      }}
      aria-label="Change your picture"
      title="Change your picture"
      className="group relative block focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-neon"
    >
      <OctagonAvatar profileIcon={data.profileIcon} name={data.name} />
      <span
        className="absolute inset-0 flex items-center justify-center bg-canvas/70 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{ clipPath: OCTAGON }}
      >
        <Camera size={22} className="text-fg" />
      </span>
      <span className="absolute -bottom-0.5 -end-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-panel bg-brand text-white shadow-md transition-transform group-hover:scale-110">
        <Camera size={14} />
      </span>
    </button>
  );

  const name = isEditingName ? (
    <div className="max-w-md">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editedFullName}
          onChange={e => setEditedFullName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSaveName();
            if (e.key === 'Escape') setIsEditingName(false);
          }}
          placeholder="Your full name"
          aria-label="Full name"
          maxLength={MAX_FULLNAME_LENGTH}
          className="min-w-0 flex-1 rounded-lg border border-edge bg-inset px-3 py-2 text-lg font-bold text-fg focus:border-brand/60 focus:outline-none"
          autoFocus
          disabled={savingName}
        />
        <button
          type="button"
          onClick={handleSaveName}
          disabled={savingName}
          aria-label="Save name"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-deep text-white transition-colors hover:bg-brand-press disabled:opacity-50 touch:h-11 touch:w-11"
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditingName(false);
            setNameError('');
          }}
          disabled={savingName}
          aria-label="Cancel"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface text-muted transition-colors hover:bg-surface-hover touch:h-11 touch:w-11"
        >
          <X size={16} />
        </button>
      </div>
      <div className="mt-1 flex justify-between gap-3 text-xs">
        {nameError ? <p className="text-red-400">{nameError}</p> : <p className="text-faint">Shown on your profile and certificates</p>}
        <p className="shrink-0 text-faint tabular-nums">
          {editedFullName.length}/{MAX_FULLNAME_LENGTH}
        </p>
      </div>
    </div>
  ) : (
    <div className="flex min-w-0 items-center gap-2">
      {/* max-w-full, not a fixed cap: a fixed width outgrew the card on a phone and pushed the row out of it. */}
      <h1 className="max-w-full truncate text-2xl font-black text-fg sm:text-3xl" title={data.name}>
        {data.name}
      </h1>
      <button
        type="button"
        onClick={startEditingName}
        className="inline-flex shrink-0 items-center justify-center rounded p-1.5 text-faint transition-colors hover:bg-surface-hover hover:text-brand touch:min-h-tap touch:min-w-tap"
        title="Edit name"
        aria-label="Edit name"
      >
        <Pencil size={14} />
      </button>
    </div>
  );

  return (
    <>
      <ProfileView
        data={data}
        record={record}
        recordError={recordError}
        onRetryRecord={loadRecord}
        own
        linkChallenges
        avatar={avatar}
        name={name}
      />
      <AvatarDialog
        open={pickerOpen}
        value={selectedPreset ? data.profileIcon || '' : ''}
        displayName={data.name}
        saving={savingIcon}
        error={iconError}
        onClose={() => setPickerOpen(false)}
        onSave={handleSaveIcon}
      />
    </>
  );
};

export default ProfilePage;
