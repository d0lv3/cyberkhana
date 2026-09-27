/** Every university a workshop is open to: its host plus any it was shared with. */
export const getCompetitionUniversityCodes = (competition: any): string[] => {
  const codes = Array.isArray(competition?.universityCodes) ? competition.universityCodes : [];
  return Array.from(
    new Set(
      [competition?.universityCode, ...codes]
        .map((code: unknown) => (typeof code === 'string' ? code.trim().toUpperCase() : ''))
        .filter(Boolean)
    )
  );
};

/**
 * A workshop competition's standings: every player with a solve or a bonus in
 * it, scored as their competition solves plus bonuses, less penalties and the
 * hints they bought for it, then ranked highest first with ties going to
 * whoever reached their score first.
 *
 * Shared by the competition leaderboard and by profiles, so the placing a
 * profile shows is always the one the leaderboard shows. Works on Mongoose
 * documents and lean objects alike.
 *
 * `users` should be the non-banned players of the competition's universities;
 * `integratedChallengeIds` the practice-range copies of its challenges, whose
 * solves count toward it as well.
 */
export interface WorkshopStanding {
  user: any;
  points: number;
  solvedChallenges: number;
  lastSolveTime: Date | null;
  solvedDetails: any[];
  penaltyPoints: number;
  bonusPoints: number;
}

export const workshopStandings = (
  competition: any,
  users: any[],
  integratedChallengeIds: Set<string>
): WorkshopStanding[] => {
  const id = String(competition._id);
  const challengeIds = new Set<string>(
    (competition.challenges || []).map((c: any) => c._id?.toString()).filter(Boolean)
  );
  const inCompetition = (solve: any) => {
    const challengeId = solve?.challengeId?.toString();
    return challengeIds.has(challengeId) || integratedChallengeIds.has(challengeId);
  };

  return users
    .filter((user: any) =>
      user.competitionBonusPoints?.some((bp: any) => bp.competitionId === id) ||
      user.solvedChallengesDetails?.some(inCompetition)
    )
    .map((user: any) => {
      const competitionSolves = user.solvedChallengesDetails?.filter(inCompetition) || [];

      const bonusPoints = (user.competitionBonusPoints || [])
        .filter((bp: any) => bp.competitionId === id)
        .reduce((total: number, bp: any) => total + (bp.amount || 0), 0);

      const penaltyPoints = (user.competitionPenalties || [])
        .filter((penalty: any) => penalty.competitionId === id)
        .reduce((total: number, penalty: any) => total + (penalty.amount || 0), 0);

      // Competition hints are stored as "competitionId_challengeId_hintIndex".
      const hintCosts = (user.unlockedHints || [])
        .map((hintKey: string) => {
          const parts = hintKey.split('_');
          if (parts.length !== 3 || parts[0] !== id) return 0;
          const challenge = (competition.challenges || []).find((c: any) => c._id.toString() === parts[1]);
          return challenge?.hints?.[parseInt(parts[2], 10)]?.cost || 0;
        })
        .reduce((total: number, cost: number) => total + cost, 0);

      const solvePoints = competitionSolves.reduce((total: number, solve: any) => total + (solve.points || 0), 0);

      return {
        user,
        points: Math.max(0, solvePoints + bonusPoints - penaltyPoints - hintCosts),
        solvedChallenges: competitionSolves.length,
        lastSolveTime: competitionSolves.length > 0
          ? new Date(Math.max(...competitionSolves.map((s: any) => new Date(s.solvedAt).getTime())))
          : null,
        solvedDetails: competitionSolves,
        penaltyPoints,
        bonusPoints
      };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      // Reaching the same score earlier ranks higher.
      if (a.lastSolveTime && b.lastSolveTime) return a.lastSolveTime.getTime() - b.lastSolveTime.getTime();
      if (a.lastSolveTime) return -1;
      if (b.lastSolveTime) return 1;
      return 0;
    });
};
