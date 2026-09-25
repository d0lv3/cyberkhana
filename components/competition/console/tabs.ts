export type ConsoleTab = 'overview' | 'scoreboard' | 'teams' | 'students' | 'participants' | 'challenges' | 'announcements' | 'settings';

/** Events are run like a CTF (teams, registration, invitations); workshops stay individual. */
export const tabsFor = (isEvent: boolean): Array<{ id: ConsoleTab; label: string }> => isEvent
  ? [
      { id: 'overview', label: 'Overview' },
      { id: 'scoreboard', label: 'Scoreboard' },
      { id: 'teams', label: 'Teams' },
      { id: 'participants', label: 'Participants' },
      { id: 'challenges', label: 'Challenges' },
      { id: 'announcements', label: 'Announcements' },
      { id: 'settings', label: 'Settings' },
    ]
  : [
      { id: 'overview', label: 'Overview' },
      { id: 'scoreboard', label: 'Leaderboard' },
      { id: 'students', label: 'Students' },
      { id: 'challenges', label: 'Challenges' },
      { id: 'announcements', label: 'Announcements' },
    ];
