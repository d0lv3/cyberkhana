import { Response } from 'express';
import Competition from '../models/Competition';
import Challenge from '../models/Challenge';
import User from '../models/User';
import University from '../models/University';
import { AuthRequest } from '../middleware/auth';
import { SocketEvents } from '../services/socketService';

const normalizeSecurityCode = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizeUniversityCode = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

const getCompetitionUniversityCodes = (competition: any): string[] => {
  const codes = Array.isArray(competition?.universityCodes) ? competition.universityCodes : [];

  return Array.from(
    new Set(
      [competition?.universityCode, ...codes]
        .map(normalizeUniversityCode)
        .filter(Boolean)
    )
  );
};

const buildCompetitionAccessQuery = (universityCode?: string) => {
  const normalizedCode = normalizeUniversityCode(universityCode);

  if (!normalizedCode) {
    return {};
  }

  return {
    $or: [
      { universityCode: normalizedCode },
      { universityCodes: normalizedCode }
    ]
  };
};

const userHasCompetitionAccess = (competition: any, user?: AuthRequest['user']) => {
  if (!competition || !user) {
    return false;
  }

  if (user.role === 'super-admin') {
    return true;
  }

  const userUniversityCode = normalizeUniversityCode(user.universityCode);
  return getCompetitionUniversityCodes(competition).includes(userUniversityCode);
};

// Get solvers for a competition challenge
export const getCompetitionChallengeSolvers = async (req: AuthRequest, res: Response) => {
  try {
    const { id, challengeId } = req.params;

    const competition = await Competition.findById(id);
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const challenge = competition.challenges.find((c: any) => c._id.toString() === challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found in competition' });
    }

    // Return solvers sorted by solve time (first blood first)
    const solvers = (challenge.solvers || []).sort((a: any, b: any) =>
      new Date(a.solvedAt).getTime() - new Date(b.solvedAt).getTime()
    );

    res.json({
      challengeId: challenge._id,
      challengeTitle: challenge.title,
      totalSolves: challenge.solves,
      solvers: solvers.map((solver: any, index: number) => ({
        odId: solver.odId,
        username: solver.username,
        fullName: solver.fullName,
        solvedAt: solver.solvedAt,
        isFirstBlood: solver.isFirstBlood || index === 0,
        rank: index + 1
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching challenge solvers' });
  }
};

export const createCompetition = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can create competitions' });
    }

    const requestedUniversityCodes = [
      req.body?.universityCode,
      ...(Array.isArray(req.body?.universityCodes) ? req.body.universityCodes : [])
    ]
      .map(normalizeUniversityCode)
      .filter(Boolean);

    let universityCodes = Array.from(new Set(requestedUniversityCodes));
    const userUniversityCode = normalizeUniversityCode(req.user?.universityCode);

    if (req.user?.role !== 'super-admin') {
      if (!userUniversityCode) {
        return res.status(400).json({ error: 'Admin account is missing a university code' });
      }

      if (universityCodes.length === 0) {
        universityCodes = [userUniversityCode];
      }

      if (!universityCodes.includes(userUniversityCode)) {
        return res.status(403).json({ error: 'Shared competitions must include your university' });
      }

      universityCodes = [userUniversityCode, ...universityCodes.filter((code) => code !== userUniversityCode)];
    }

    if (universityCodes.length === 0) {
      return res.status(400).json({ error: 'Select at least one university for the competition' });
    }

    if (universityCodes.length > 2) {
      return res.status(400).json({ error: 'A competition can only be shared between up to two universities' });
    }

    const { universityCode: ignoredUniversityCode, universityCodes: ignoredUniversityCodes, ...competitionPayload } = req.body;

    const competition = new Competition({
      ...competitionPayload,
      universityCode: universityCodes[0],
      universityCodes
    });

    await competition.save();
    res.status(201).json(competition);
  } catch (error) {
    res.status(500).json({ error: 'Error creating competition' });
  }
};

export const getCompetitions = async (req: AuthRequest, res: Response) => {
  try {
    const universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    const competitions = await Competition.find(buildCompetitionAccessQuery(universityCode));

    // Calculate dynamic points for each competition's challenges
    const { calculateDynamicScore } = require('../models/Challenge');
    const competitionsWithDynamicPoints = await Promise.all(
      competitions.map(async (competition: any) => {
        const challengesWithDynamicPoints = await Promise.all(
          competition.challenges.map(async (challenge: any) => {
            let effectivePoints: number;
            if (challenge.scoringMode === 'static') {
              effectivePoints = challenge.points;
            } else {
              effectivePoints = calculateDynamicScore(
                challenge.initialPoints || 1000,
                challenge.minimumPoints || 100,
                challenge.decay || 38,
                challenge.solves
              );
            }

            // Fetch original challenge to get challengeLink if missing
            let challengeLink = challenge.challengeLink;
            if (!challengeLink) {
              try {
                const Challenge = require('../models/Challenge').default;
                const originalChallenge = await Challenge.findOne({
                  title: challenge.title,
                  author: challenge.author,
                  category: challenge.category
                });
                if (originalChallenge && originalChallenge.challengeLink) {
                  challengeLink = originalChallenge.challengeLink;
                }
              } catch (err) {
                console.error('Error fetching original challenge:', err);
              }
            }

            return {
              ...challenge.toObject ? challenge.toObject() : challenge,
              points: effectivePoints,
              currentPoints: effectivePoints,
              challengeLink
            };
          })
        );

        return {
          ...competition.toObject ? competition.toObject() : competition,
          challenges: challengesWithDynamicPoints
        };
      })
    );

    // SECURITY: Never expose flags to regular users
    if (req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
      const competitionsWithoutFlags = competitionsWithDynamicPoints.map((competition: any) => {
        const challengesWithoutFlags = competition.challenges.map((challenge: any) => {
          const { flag, flags, ...challengeWithoutFlags } = challenge;
          return challengeWithoutFlags;
        });

        // SECURITY: Never expose security code to non-admin users
        const { securityCode, ...competitionWithoutCode } = competition;
        return {
          ...competitionWithoutCode,
          challenges: challengesWithoutFlags
        };
      });

      return res.json(competitionsWithoutFlags);
    }

    res.json(competitionsWithDynamicPoints);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching competitions' });
  }
};

export const getCompetition = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const securityCode = normalizeSecurityCode(req.query.securityCode);

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check security code if required
    if (
      competition.requiresSecurityCode !== false &&
      normalizeSecurityCode(competition.securityCode) !== securityCode
    ) {
      return res.status(401).json({ error: 'Invalid competition security code' });
    }

    const now = new Date();
    if (now < competition.startTime) {
      return res.status(400).json({ error: 'Competition has not started yet' });
    }

    // Note: end-time enforcement removed from getCompetition so users can
    // view leaderboard and results for ended competitions.  Flag submission
    // (submitCompetitionFlag) independently validates competition is active.

    // SECURITY: Never expose flags to regular users
    if (req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
      const competitionObj = competition.toObject ? competition.toObject() : competition;
      const challengesWithoutFlags = competitionObj.challenges.map((challenge: any) => {
        const { flag, flags, ...challengeWithoutFlags } = challenge;
        return challengeWithoutFlags;
      });

      const competitionToReturn = {
        ...competitionObj,
        challenges: challengesWithoutFlags
      };

      return res.json(competitionToReturn);
    }

    res.json(competition);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching competition' });
  }
};

export const getCompetitionDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Check if user has access to this competition
    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // SECURITY: Validate security code server-side (admins bypass, ended competitions bypass)
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super-admin';
    const now = new Date();
    const isEnded = (competition.status === 'ended') ||
      (competition.hasTimeLimit !== false && competition.endTime && now > competition.endTime);

    if (!isAdmin && !isEnded && competition.requiresSecurityCode !== false && competition.securityCode) {
      const providedCode = normalizeSecurityCode(req.query.securityCode);
      const expectedCode = normalizeSecurityCode(competition.securityCode);
      if (!providedCode || providedCode !== expectedCode) {
        return res.status(401).json({ error: 'Invalid or missing security code', requiresSecurityCode: true });
      }
    }

    // Calculate points for each challenge (respecting scoring mode)
    const { calculateDynamicScore } = require('../models/Challenge');
    const challengesWithDynamicPoints = await Promise.all(
      competition.challenges.map(async (challenge: any) => {
        let effectivePoints: number;
        if (challenge.scoringMode === 'static') {
          effectivePoints = challenge.points;
        } else {
          effectivePoints = calculateDynamicScore(
            challenge.initialPoints || 1000,
            challenge.minimumPoints || 100,
            challenge.decay || 38,
            challenge.solves
          );
        }

        // Fetch original challenge to get challengeLink if missing
        let challengeLink = challenge.challengeLink;
        if (!challengeLink) {
          try {
            const Challenge = require('../models/Challenge').default;
            const originalChallenge = await Challenge.findOne({
              title: challenge.title,
              author: challenge.author,
              category: challenge.category
            });
            if (originalChallenge && originalChallenge.challengeLink) {
              challengeLink = originalChallenge.challengeLink;
            }
          } catch (err) {
            console.error('Error fetching original challenge:', err);
          }
        }

        return {
          ...challenge.toObject ? challenge.toObject() : challenge,
          points: effectivePoints,
          currentPoints: effectivePoints,
          challengeLink
        };
      })
    );

    // SECURITY: Scrub hints if user hasn't unlocked them (Fetch fresh user for latest hints)
    let unlockedHints: string[] = [];
    if (req.user?.role === 'user') {
      const user = await User.findById(req.user.userId);
      if (user) {
        unlockedHints = user.unlockedHints || [];
      }
    }

    const scrubbedChallenges = challengesWithDynamicPoints.map((challenge: any) => {
      if (!isAdmin) {
        // SECURITY: Strip challenge content for ended competitions (keep only stats)
        if (isEnded) {
          return {
            _id: challenge._id,
            title: challenge.title,
            category: challenge.category,
            points: challenge.points,
            currentPoints: challenge.currentPoints,
            difficulty: challenge.difficulty,
            solves: challenge.solves,
            solvers: challenge.solvers,
            scoringMode: challenge.scoringMode,
            author: challenge.author,
            initialPoints: challenge.initialPoints,
            minimumPoints: challenge.minimumPoints,
            decay: challenge.decay,
          };
        }

        if (challenge.hints) {
          challenge.hints = challenge.hints.map((hint: any, index: number) => {
            const hintKey = `${id}_${challenge._id}_${index}`;
            if (!unlockedHints.includes(hintKey)) {
              return { ...hint, text: 'LOCKED' };
            }
            return hint;
          });
        }

        // SECURITY: Never expose flags to regular users
        const { flag, flags, ...challengeWithoutSensitiveData } = challenge;
        return challengeWithoutSensitiveData;
      }
      return challenge;
    });

    const competitionObj = competition.toObject ? competition.toObject() : competition;

    // SECURITY: Never expose the security code to non-admin users
    if (!isAdmin) {
      delete competitionObj.securityCode;
    }

    const competitionWithDynamicPoints = {
      ...competitionObj,
      challenges: scrubbedChallenges
    };

    res.json(competitionWithDynamicPoints);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching competition details' });
  }
};

export const getSolvedChallenges = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Check if user has access to this competition
    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get the user whose solved challenges we want to fetch
    const user = await User.findById(userId as string);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get IDs of challenges in this competition
    const competitionChallengeIds = competition.challenges.map((c: any) => c._id.toString());

    // Get integrated challenges for this competition
    const Challenge = require('../models/Challenge').default;
    const integratedChallenges = await Challenge.find({
      fromCompetition: true,
      competitionId: id
    });

    const integratedChallengeIds = integratedChallenges.map((c: any) => c._id.toString());

    // Filter user's solved challenges to only include those from this competition
    // Check both competition challenge IDs and integrated challenge IDs
    const solvedChallengeIds = user.solvedChallenges.filter((challengeId: string) =>
      competitionChallengeIds.includes(challengeId) || integratedChallengeIds.includes(challengeId)
    );

    res.json(solvedChallengeIds);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching solved challenges' });
  }
};

export const updateCompetitionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    competition.status = status;
    await competition.save();

    // Emit real-time event for competition status change
    const compId = (competition._id as any).toString();
    const compTitle = (competition as any).title || 'Competition';
    SocketEvents.emitCompetitionUpdate(getCompetitionUniversityCodes(competition), {
      competitionId: compId,
      type: status === 'active' ? 'started' : status === 'ended' ? 'ended' : 'challenge_added',
      message: `Competition "${compTitle}" is now ${status}`
    });

    res.json(competition);
  } catch (error) {
    res.status(500).json({ error: 'Error updating competition status' });
  }
};

export const updateCompetitionStartTime = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, status } = req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    competition.startTime = new Date(startTime);
    competition.endTime = new Date(endTime);
    competition.status = status;
    await competition.save();

    res.json(competition);
  } catch (error) {
    res.status(500).json({ error: 'Error updating competition start time' });
  }
};

export const submitCompetitionFlag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { challengeId, flag } = req.body;
    const securityCode = normalizeSecurityCode(req.body.securityCode);

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // SECURITY: Validate security code server-side
    if (competition.requiresSecurityCode !== false && competition.securityCode) {
      const expectedCode = normalizeSecurityCode(competition.securityCode);
      if (!securityCode || securityCode !== expectedCode) {
        return res.status(401).json({ error: 'Invalid or missing security code', requiresSecurityCode: true });
      }
    }

    // Check if competition is still active
    const now = new Date();
    if (competition.status !== 'active') {
      return res.status(400).json({ error: 'Competition is not active' });
    }

    if (now < competition.startTime) {
      return res.status(400).json({ error: 'Competition has not started yet' });
    }

    // Only check end time if competition has a time limit
    if (competition.hasTimeLimit !== false && competition.endTime && now > competition.endTime) {
      return res.status(400).json({ error: 'Competition has ended' });
    }

    const challengeIndex = competition.challenges.findIndex((c: any) => c._id.toString() === challengeId);
    const challenge = competition.challenges[challengeIndex];

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.user?.role === 'user') {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user already solved this challenge
      if (user.solvedChallenges.includes(challengeId)) {
        return res.status(400).json({ error: 'Challenge already solved' });
      }

      // Normalize flags for comparison
      const normalize = (s: string) =>
        s
          .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .normalize('NFKC');

      const normalizedSubmittedFlag = normalize(flag);
      const normalizedStoredFlag = normalize(String(challenge.flag || ''));

      // Check against primary flag and additional flags array
      const allFlags = [normalizedStoredFlag];
      if (challenge.flags && Array.isArray(challenge.flags)) {
        challenge.flags.forEach((f: string) => {
          if (f) allFlags.push(normalize(String(f)));
        });
      }

      const isCorrectFlag = allFlags.some(f => normalizedSubmittedFlag === f);

      // Check if flag is correct
      if (isCorrectFlag) {
        // Calculate dynamic points
        const { calculateDynamicScore } = require('../models/Challenge');

        let awardedPoints: number;
        if (challenge.scoringMode === 'static') {
          awardedPoints = challenge.points || challenge.initialPoints || 1000;
        } else {
          awardedPoints = calculateDynamicScore(
            challenge.initialPoints || 1000,
            challenge.minimumPoints || 100,
            challenge.decay || 38,
            challenge.solves
          );
        }

        let totalAwardedPoints = awardedPoints;
        const isFirstBlood = challenge.solves === 0;

        // Add configurable first blood bonus
        if (isFirstBlood) {
          const firstBloodBonus = challenge.firstBloodBonus || 20;
          totalAwardedPoints += firstBloodBonus;
        }

        // ATOMIC update to prevent race condition (double submission)
        const userUpdate = await User.findOneAndUpdate(
          {
            _id: (user as any)._id,
            solvedChallenges: { $ne: challengeId }
          },
          {
            $push: {
              solvedChallenges: challengeId,
              solvedChallengesDetails: {
                challengeId,
                solvedAt: new Date(),
                points: totalAwardedPoints
              }
            },
            $inc: { competitionPoints: totalAwardedPoints }
          },
          { new: true }
        );

        if (!userUpdate) {
          return res.status(400).json({ error: 'Challenge already solved' });
        }

        // Update challenge solve count and track solver
        competition.challenges[challengeIndex].solves += 1;
        if (!competition.challenges[challengeIndex].solvers) {
          competition.challenges[challengeIndex].solvers = [];
        }
        competition.challenges[challengeIndex].solvers.push({
          odId: (user as any)._id.toString(),
          username: (user as any).username,
          fullName: (user as any).fullName || '',
          solvedAt: new Date(),
          isFirstBlood
        });
        // Mark the challenges array as modified so Mongoose saves the nested document
        competition.markModified('challenges');
        await competition.save();

        // Apply retroactive decay to all solvers of this challenge
        try {
          const { applyRetroactiveDecay } = require('../services/retroactiveDecayService');
          await applyRetroactiveDecay(challengeId);
        } catch (decayError) {
          console.error('Failed to apply retroactive decay:', decayError);
          // Don't fail the request if decay fails
        }

        // Check if this challenge has been integrated to main challenges
        const Challenge = require('../models/Challenge').default;
        const integratedChallenge = await Challenge.findOne({
          fromCompetition: true,
          competitionId: id,
          // Match by title and author to identify the same challenge
          title: challenge.title,
          author: challenge.author
        });

        if (integratedChallenge) {
          // Update the integrated challenge solve count
          integratedChallenge.solves += 1;
          await integratedChallenge.save();
        }

        res.json({
          success: true,
          points: totalAwardedPoints,
          basePoints: awardedPoints,
          firstBlood: isFirstBlood,
          firstBloodBonus: isFirstBlood ? (challenge.firstBloodBonus || 20) : 0,
          message: 'Correct flag!'
        });

        // EMIT REAL-TIME EVENT for competition flag submission
        SocketEvents.emitFlagSubmitted(getCompetitionUniversityCodes(competition), {
          challengeId,
          challengeTitle: challenge.title,
          username: (user as any).username,
          userId: (user as any)._id.toString(),
          points: totalAwardedPoints,
          isFirstBlood
        });

        // Emit competition activity
        SocketEvents.emitCompetitionActivity(id, {
          type: isFirstBlood ? 'first_blood' : 'solve',
          data: {
            challengeId,
            challengeTitle: challenge.title,
            username: (user as any).username,
            points: totalAwardedPoints
          },
          timestamp: new Date()
        });
      } else {
        res.status(400).json({ error: 'Incorrect flag' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Error submitting flag' });
  }
};

export const addChallengeToCompetition = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { challengeId } = req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const competitionChallenge = {
      title: challenge.title,
      category: challenge.category,
      points: challenge.points,
      description: challenge.description,
      author: challenge.author,
      flag: challenge.flag,
      flags: challenge.flags || [],
      hints: challenge.hints || [],
      files: challenge.files || [],
      challengeLink: challenge.challengeLink || '',
      scoringMode: challenge.scoringMode || 'dynamic',
      difficulty: challenge.difficulty || 'Medium',
      estimatedTime: challenge.estimatedTime || 30,
      initialPoints: challenge.initialPoints || 1000,
      minimumPoints: challenge.minimumPoints || 100,
      decay: challenge.decay || 38,
      currentPoints: challenge.scoringMode === 'static'
        ? challenge.points
        : (challenge.currentPoints || challenge.initialPoints || 1000),
      firstBloodBonus: challenge.firstBloodBonus || 20
    };

    competition.challenges.push(competitionChallenge as any);
    await competition.save();

    res.json(competition);
  } catch (error) {
    res.status(500).json({ error: 'Error adding challenge to competition' });
  }
};

export const validateSecurityCode = async (req: AuthRequest, res: Response) => {
  try {
    const { securityCode } = req.body;
    const code = normalizeSecurityCode(securityCode);

    if (!code) {
      return res.status(400).json({ error: 'Security code is required' });
    }

    const userUniversityCode = normalizeUniversityCode(req.user?.universityCode);

    // Find competition matching the security code within the user's university
    const competitions = await Competition.find(buildCompetitionAccessQuery(userUniversityCode));

    const match = competitions.find(
      (c) => normalizeSecurityCode(c.securityCode) === code
    );

    if (!match) {
      return res.status(401).json({ error: 'Invalid security code' });
    }

    return res.json({ competitionId: match._id });
  } catch (error) {
    res.status(500).json({ error: 'Error validating security code' });
  }
};

export const getCompetitionLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const universityCodes = getCompetitionUniversityCodes(competition);
    const universities = await University.find({ code: { $in: universityCodes } }).select('code name');
    const universityNameByCode = new Map(
      universities.map((university: any) => [normalizeUniversityCode(university.code), university.name])
    );

    // Get all users in the competition's university
    const users = await User.find({
      universityCode: { $in: universityCodes },
      isBanned: { $ne: true }
    }).select('username fullName displayName universityCode points solvedChallenges solvedChallengesDetails profileIcon competitionPenalties competitionBonusPoints unlockedHints');

    // Get integrated challenges for this competition
    const Challenge = require('../models/Challenge').default;
    const integratedChallenges = await Challenge.find({
      fromCompetition: true,
      competitionId: id
    });

    // Create a map of integrated challenge IDs to their details
    const integratedChallengeMap = new Map();
    integratedChallenges.forEach((c: any) => {
      integratedChallengeMap.set(c._id.toString(), c);
    });

    // Filter users who have solved at least one competition challenge OR have bonus points
    const leaderboard = users
      .filter((user: any) => {
        // Check if user has bonus points for this competition
        const hasBonusPoints = user.competitionBonusPoints?.some((bp: any) => bp.competitionId === id);

        // Check if user has solved any competition challenge or integrated challenge
        const hasSolves = user.solvedChallengesDetails?.some((solve: any) =>
          competition.challenges.some((c: any) => c._id?.toString() === solve.challengeId?.toString()) ||
          integratedChallengeMap.has(solve.challengeId?.toString())
        );

        return hasBonusPoints || hasSolves;
      })
      .map((user: any) => {
        // Get competition-related solves with timestamps
        const competitionSolves = user.solvedChallengesDetails
          ?.filter((solve: any) =>
            competition.challenges.some((c: any) => c._id?.toString() === solve.challengeId?.toString()) ||
            integratedChallengeMap.has(solve.challengeId?.toString())
          ) || [];

        // Calculate points from competition challenges and integrated challenges
        let competitionPoints = competitionSolves
          .reduce((total: number, solve: any) => total + (solve.points || 0), 0) || 0;

        // Add bonus points for this specific competition
        const bonusPoints = (user.competitionBonusPoints || [])
          .filter((bp: any) => bp.competitionId === id)
          .reduce((total: number, bp: any) => total + (bp.amount || 0), 0);

        competitionPoints += bonusPoints;

        // Deduct penalties for this specific competition
        const competitionPenalties = (user.competitionPenalties || [])
          .filter((penalty: any) => penalty.competitionId === id)
          .reduce((total: number, penalty: any) => total + (penalty.amount || 0), 0);

        // Deduct cost of hints bought for this competition
        const hintCosts = (user.unlockedHints || [])
          .map((hintKey: string) => {
            const parts = hintKey.split('_');
            // Format: competitionId_challengeId_hintIndex
            if (parts.length !== 3 || parts[0] !== id) return 0;

            const hintChallengeId = parts[1];
            const hintIndex = parseInt(parts[2], 10);

            // Find the challenge in the competition
            const challenge = competition.challenges.find((c: any) => c._id.toString() === hintChallengeId);

            if (challenge && challenge.hints && challenge.hints[hintIndex]) {
              return challenge.hints[hintIndex].cost || 0;
            }
            return 0;
          })
          .reduce((total: number, cost: number) => total + cost, 0);

        competitionPoints = Math.max(0, competitionPoints - competitionPenalties - hintCosts);

        const competitionSolvedCount = competitionSolves.length || 0;

        // Get the last solve timestamp for tiebreaker
        // If bonus points were the last "activity", we might want to use that timestamp, but keeping it simple for now:
        // Use last solve time. If no solves but bonus points, maybe null or last bonus time?
        // Let's stick to last solve time for now as it's the primary tiebreaker for skills.
        const lastSolveTime = competitionSolves.length > 0
          ? new Date(Math.max(...competitionSolves.map((s: any) => new Date(s.solvedAt).getTime())))
          : null;

        return {
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          displayName: user.displayName,
          profileIcon: user.profileIcon,
          points: competitionPoints,
          solvedChallenges: competitionSolvedCount,
          universityCode: user.universityCode,
          universityName: universityNameByCode.get(normalizeUniversityCode(user.universityCode)) || user.universityCode,
          lastSolveTime,
          solvedDetails: competitionSolves,
          penaltyPoints: competitionPenalties,
          bonusPoints
        };
      })
      .sort((a: any, b: any) => {
        // Primary sort by points (descending)
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        // Secondary sort by last solve time (earlier is better) - tiebreaker
        if (a.lastSolveTime && b.lastSolveTime) {
          return new Date(a.lastSolveTime).getTime() - new Date(b.lastSolveTime).getTime();
        }
        // If only one has solved, they come first
        if (a.lastSolveTime) return -1;
        if (b.lastSolveTime) return 1;
        return 0;
      });

    // Include total challenges count in the response
    res.json({
      leaderboard,
      totalChallenges: competition.challenges.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching competition leaderboard' });
  }
};

export const getCompetitionActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const universityCodes = getCompetitionUniversityCodes(competition);

    // Create a map of challenge IDs to challenge titles
    const challengeMap = new Map();
    competition.challenges.forEach((challenge: any) => {
      challengeMap.set(challenge._id.toString(), challenge.title);
    });

    // Get all users in the competition's university
    const users = await User.find({
      universityCode: { $in: universityCodes },
      isBanned: { $ne: true }
    }).select('username solvedChallengesDetails');

    // Get recent activity (last 20 solves)
    const allActivity: any[] = [];

    users.forEach((user: any) => {
      user.solvedChallengesDetails
        ?.filter((solve: any) =>
          competition.challenges.some((c: any) => c._id?.toString() === solve.challengeId?.toString())
        )
        .forEach((solve: any) => {
          const challengeTitle = challengeMap.get(solve.challengeId?.toString()) || 'Unknown Challenge';
          allActivity.push({
            username: user.username,
            challengeTitle: challengeTitle,
            timestamp: solve.solvedAt,
            points: solve.points || 0
          });
        });
    });

    // Sort by timestamp descending and take last 20
    allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = allActivity.slice(0, 20);

    res.json(recentActivity);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching competition activity' });
  }
};

export const publishCompetitionHint = async (req: AuthRequest, res: Response) => {
  try {
    const { id, challengeId } = req.params;
    const { hintIndex } = req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Check if user has access
    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const challengeIndex = competition.challenges.findIndex((c: any) => c._id.toString() === challengeId);
    if (challengeIndex === -1) {
      return res.status(404).json({ error: 'Challenge not found in competition' });
    }

    const challenge = competition.challenges[challengeIndex];

    if (!challenge.hints || challenge.hints.length === 0) {
      return res.status(400).json({ error: 'No hints found for this challenge' });
    }

    if (hintIndex < 0 || hintIndex >= challenge.hints.length) {
      return res.status(400).json({ error: 'Invalid hint index' });
    }

    // Add isPublished field if it doesn't exist
    if (!challenge.hints[hintIndex].hasOwnProperty('isPublished')) {
      challenge.hints[hintIndex].isPublished = true;
    } else {
      challenge.hints[hintIndex].isPublished = true;
    }

    competition.markModified('challenges');
    await competition.save();

    res.json({ message: 'Hint published successfully', hints: challenge.hints });
  } catch (error) {
    res.status(500).json({ error: 'Error publishing hint' });
  }
};

export const buyCompetitionHint = async (req: AuthRequest, res: Response) => {
  try {
    const { id, challengeId } = req.params;
    const { hintIndex } = req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if competition is active
    const now = new Date();
    if (now < competition.startTime) {
      return res.status(400).json({ error: 'Competition has not started yet' });
    }

    // Only check end time if competition has a time limit
    if (competition.hasTimeLimit !== false && competition.endTime && now > competition.endTime) {
      return res.status(400).json({ error: 'Competition has ended' });
    }

    const challengeIndex = competition.challenges.findIndex((c: any) => c._id.toString() === challengeId);
    if (challengeIndex === -1) {
      return res.status(404).json({ error: 'Challenge not found in competition' });
    }

    const challenge = competition.challenges[challengeIndex];

    if (!challenge.hints || challenge.hints.length === 0) {
      return res.status(400).json({ error: 'No hints available for this challenge' });
    }

    if (hintIndex < 0 || hintIndex >= challenge.hints.length) {
      return res.status(400).json({ error: 'Invalid hint index' });
    }

    const hint = challenge.hints[hintIndex];

    if (!hint.isPublished) {
      return res.status(400).json({ error: 'This hint has not been published by the admin yet' });
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ATOMIC hint purchase to prevent race conditions (double purchase / insufficient points bypass)
    const hintKey = `${id}_${challengeId}_${hintIndex}`;
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: (user as any)._id,
        competitionPoints: { $gte: hint.cost },
        unlockedHints: { $ne: hintKey }
      },
      {
        $inc: { competitionPoints: -hint.cost },
        $push: { unlockedHints: hintKey }
      },
      { new: true }
    );

    if (!updatedUser) {
      // Determine specific error
      if (user.unlockedHints.includes(hintKey)) {
        return res.status(400).json({ error: 'You have already unlocked this hint' });
      }
      return res.status(400).json({ error: 'Insufficient competition points' });
    }

    res.json({
      success: true,
      hint: hint.text,
      remainingPoints: updatedUser.competitionPoints
    });
  } catch (error) {
    res.status(500).json({ error: 'Error buying hint' });
  }
};

export const deleteCompetition = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Full cleanup: revert user points and solve records before deleting
    const challengeIds = competition.challenges.map((c: any) => c._id?.toString()).filter(Boolean);

    if (challengeIds.length > 0) {
      const affectedUsers = await User.find({ solvedChallenges: { $in: challengeIds } });

      for (const affectedUser of affectedUsers) {
        let pointsToDeduct = 0;

        // Calculate total points to deduct from competition challenges
        const details = affectedUser.solvedChallengesDetails as Array<{ challengeId: string; points: number }>;
        for (const detail of details) {
          if (challengeIds.includes(detail.challengeId?.toString())) {
            pointsToDeduct += detail.points || 0;
          }
        }

        // Remove competition challenge IDs from solvedChallenges
        affectedUser.solvedChallenges = affectedUser.solvedChallenges.filter(
          (cId: string) => !challengeIds.includes(cId)
        );

        // Remove entries from solvedChallengesDetails
        affectedUser.solvedChallengesDetails = (affectedUser.solvedChallengesDetails as any[]).filter(
          (d: any) => !challengeIds.includes(d.challengeId?.toString())
        );

        // Deduct competition points (floor at 0)
        affectedUser.competitionPoints = Math.max(0, (affectedUser.competitionPoints || 0) - pointsToDeduct);

        // Clean up unlockedHints for this competition (format: competitionId_challengeId_hintIndex)
        affectedUser.unlockedHints = (affectedUser.unlockedHints || []).filter(
          (hintKey: string) => !hintKey.startsWith(`${id}_`)
        );

        await affectedUser.save();
      }
    }

    await competition.deleteOne();
    res.json({ message: 'Competition deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting competition' });
  }
};

export const removeChallengeFromCompetition = async (req: AuthRequest, res: Response) => {
  try {
    const { id, challengeId } = req.params;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (!userHasCompetitionAccess(competition, req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find the challenge index
    const challengeIndex = competition.challenges.findIndex((c: any) => c._id.toString() === challengeId);

    if (challengeIndex === -1) {
      return res.status(404).json({ error: 'Challenge not found in competition' });
    }

    // Remove the challenge
    competition.challenges.splice(challengeIndex, 1);
    competition.markModified('challenges');
    await competition.save();

    res.json({ message: 'Challenge removed from competition successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error removing challenge from competition' });
  }
};
