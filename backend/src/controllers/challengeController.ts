import { Response } from 'express';
import Challenge from '../models/Challenge';
import { calculateDynamicScore } from '../models/Challenge';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { uploadWriteupPdf, uploadChallengeFiles } from '../utils/fileUpload';
import { applyRetroactiveDecay } from '../services/retroactiveDecayService';
import { SocketEvents } from '../services/socketService';
import path from 'path';
import Announcement from '../models/Announcement';
import University from '../models/University';

// Get solvers for a challenge
export const getChallengeSolvers = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check access
    const userUniversityCode = req.user?.universityCode?.toUpperCase();
    const challengeUniversityCode = challenge.universityCode?.toUpperCase();

    if (req.user?.role !== 'super-admin' && challengeUniversityCode !== userUniversityCode) {
      return res.status(403).json({ error: 'Access denied' });
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

export const getChallenges = async (req: AuthRequest, res: Response) => {
  try {
    let universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    // Ensure universityCode is uppercase for consistent querying
    if (universityCode) {
      universityCode = universityCode.toUpperCase();
    }

    const isStaff = req.user?.role === 'admin' || req.user?.role === 'super-admin';

    // Drafts are for admins only. This flag used to be taken at face value from
    // anyone, so `?includeUnpublished=true` handed every unreleased challenge to
    // any logged-in player.
    const includeUnpublished = isStaff && req.query.includeUnpublished === 'true';

    const query = includeUnpublished
      ? { universityCode }
      : { universityCode, isPublished: true };

    const challenges = await Challenge.find(query);

    // Fetch user to get latest unlocked hints (JWT might be stale)
    let unlockedHints: string[] = [];
    if (req.user?.role === 'user') {
      const user = await User.findById(req.user.userId);
      if (user) {
        unlockedHints = user.unlockedHints || [];
      }
    }

    const challengesWithCurrentPoints = challenges.map(challenge => {
      const challengeObj = challenge.toObject();
      if (challenge.scoringMode === 'static') {
        challengeObj.currentPoints = challenge.points;
      } else {
        // Provide defaults for challenges created before these fields were added
        const initialPoints = challenge.initialPoints || challenge.points || 1000;
        const minimumPoints = challenge.minimumPoints || 100;
        const decay = challenge.decay || 38;
        challengeObj.currentPoints = calculateDynamicScore(
          initialPoints, minimumPoints, decay, challenge.solves
        );
      }

      // If user is not admin and writeup is not unlocked, remove writeup data
      if (req.user?.role === 'user' && !challenge.writeup?.isUnlocked) {
        challengeObj.writeup = {
          content: '',
          images: [],
          isUnlocked: false
        };
      }

      // SECURITY: Scrub hints if user hasn't unlocked them
      if (req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
        if (challengeObj.hints) {
          challengeObj.hints = challengeObj.hints.map((hint: any, index: number) => {
            const hintId = `${challenge._id}-${index}`;
            if (!unlockedHints.includes(hintId)) {
              return { ...hint, text: 'LOCKED' };
            }
            return hint;
          });
        }
      }

      // SECURITY: Never expose the flag to regular users.
      // `flags` (alternative accepted flags) has to go too — stripping only
      // `flag` left every alternate answer sitting in the response body.
      if (req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
        const { flag, flags, ...challengeWithoutFlag } = challengeObj;
        return challengeWithoutFlag;
      }

      return challengeObj;
    });

    res.json(challengesWithCurrentPoints);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching challenges' });
  }
};

export const getAllChallenges = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can access all challenges' });
    }

    let universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    // Ensure universityCode is uppercase for consistent querying
    if (universityCode) {
      universityCode = universityCode.toUpperCase();
    }

    const challenges = await Challenge.find({ universityCode });

    const challengesWithCurrentPoints = challenges.map(challenge => {
      const challengeObj = challenge.toObject();
      if (challenge.scoringMode === 'static') {
        challengeObj.currentPoints = challenge.points;
      } else {
        // Provide defaults for challenges created before these fields were added
        const initialPoints = challenge.initialPoints || challenge.points || 1000;
        const minimumPoints = challenge.minimumPoints || 100;
        const decay = challenge.decay || 38;
        challengeObj.currentPoints = calculateDynamicScore(
          initialPoints, minimumPoints, decay, challenge.solves
        );
      }
      return challengeObj;
    });

    // SECURITY: Never expose flags in bulk listing - admins should use individual challenge endpoint
    const challengesWithoutFlags = challengesWithCurrentPoints.map(challenge => {
      const { flag, flags, ...safeChallenge } = challenge;
      return safeChallenge;
    });

    res.json(challengesWithoutFlags);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching all challenges' });
  }
};

export const getChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Ensure case-insensitive comparison for universityCode
    const userUniversityCode = req.user?.universityCode?.toUpperCase();
    const challengeUniversityCode = challenge.universityCode?.toUpperCase();

    if (req.user?.role !== 'super-admin' && challengeUniversityCode !== userUniversityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Hiding a draft from the list endpoint achieves nothing if it is still
    // readable by id.
    const isStaff = req.user?.role === 'admin' || req.user?.role === 'super-admin';
    if (!isStaff && challenge.isPublished === false) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challengeObj = challenge.toObject();
    if (challenge.scoringMode === 'static') {
      challengeObj.currentPoints = challenge.points;
    } else {
      // Provide defaults for challenges created before these fields were added
      const initialPoints = challenge.initialPoints || challenge.points || 1000;
      const minimumPoints = challenge.minimumPoints || 100;
      const decay = challenge.decay || 38;
      challengeObj.currentPoints = calculateDynamicScore(
        initialPoints, minimumPoints, decay, challenge.solves
      );
    }

    // Fetch user to get latest unlocked hints (JWT might be stale)
    let unlockedHints: string[] = [];
    if (req.user?.role === 'user') {
      const user = await User.findById(req.user.userId);
      if (user) {
        unlockedHints = user.unlockedHints || [];
      }
    }

    // If user is not admin and writeup is not unlocked, remove writeup data
    if (req.user?.role === 'user' && !challenge.writeup?.isUnlocked) {
      challengeObj.writeup = {
        content: '',
        images: [],
        isUnlocked: false
      };
    }

    // SECURITY: Scrub hints if user hasn't unlocked them
    if (req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
      if (challengeObj.hints) {
        challengeObj.hints = challengeObj.hints.map((hint: any, index: number) => {
          const hintId = `${challenge._id}-${index}`;
          if (!unlockedHints.includes(hintId)) {
            return { ...hint, text: 'LOCKED' };
          }
          return hint;
        });
      }
    }

    // SECURITY: Never expose the flag to regular users (see the list endpoint —
    // `flags` is just as sensitive as `flag`).
    if (req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
      const { flag, flags, ...challengeWithoutFlag } = challengeObj;
      return res.json(challengeWithoutFlag);
    }

    res.json(challengeObj);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching challenge' });
  }
};

export const createChallenge = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can create challenges' });
    }

    // Same reasoning as updateChallenge: solve state is earned, not supplied.
    const {
      _id: _ignoredId,
      solves: _ignoredSolves,
      solvers: _ignoredSolvers,
      ...challengePayload
    } = req.body;

    const challenge = new Challenge({
      ...challengePayload,
      universityCode: req.user?.universityCode
    });

    await challenge.save();
    res.status(201).json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Error creating challenge' });
  }
};

export const updateChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const userUniversityCode = req.user?.universityCode?.toUpperCase();
    const challengeUniversityCode = challenge.universityCode?.toUpperCase();

    if (req.user?.role !== 'super-admin' && challengeUniversityCode !== userUniversityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fields an edit may never touch. `universityCode` is the tenant boundary
    // that was just checked three lines up — letting the body set it meant an
    // admin could move a challenge into another university and lose it. The
    // rest are earned state, not input.
    const {
      _id: _ignoredId,
      universityCode: _ignoredUniversityCode,
      solves: _ignoredSolves,
      solvers: _ignoredSolvers,
      createdAt: _ignoredCreatedAt,
      updatedAt: _ignoredUpdatedAt,
      ...editable
    } = req.body;

    // An empty flag means "leave the flag alone", not "clear it".
    if (!editable.flag) {
      const { flag, ...updateData } = editable;
      Object.assign(challenge, updateData);
    } else {
      Object.assign(challenge, editable);
    }

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Error updating challenge' });
  }
};

export const deleteChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const userUniversityCode = req.user?.universityCode?.toUpperCase();
    const challengeUniversityCode = challenge.universityCode?.toUpperCase();

    if (req.user?.role !== 'super-admin' && challengeUniversityCode !== userUniversityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Cleanup user scores: Remove challenge from users' solved lists and deduct points
    const solvers = await User.find({ solvedChallenges: id });
    for (const solver of solvers) {
      const solveDetails = solver.solvedChallengesDetails?.find((d: any) => d.challengeId === id);
      if (solveDetails) {
        const pointsToRemove = solveDetails.points || 0;
        solver.points = Math.max(0, solver.points - pointsToRemove);

        // Remove from details and ID list
        solver.solvedChallenges = solver.solvedChallenges.filter(paramId => paramId !== id);
        solver.solvedChallengesDetails = solver.solvedChallengesDetails.filter((d: any) => d.challengeId !== id);

        await solver.save();
      }
    }

    await challenge.deleteOne();
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting challenge' });
  }
};

export const submitFlag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { flag } = req.body;

    // Basic validation for request body
    if (typeof flag !== 'string') {
      return res.status(400).json({ error: 'Flag must be provided as a string' });
    }

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if user belongs to the same university as the challenge
    const userUniversityCode = req.user?.universityCode?.toUpperCase();
    const challengeUniversityCode = challenge.universityCode?.toUpperCase();

    if (req.user?.role !== 'super-admin' && challengeUniversityCode !== userUniversityCode) {
      return res.status(403).json({
        error: 'Access denied. This challenge belongs to a different university.',
        expectedUniversity: challenge.universityCode,
        userUniversity: req.user?.universityCode
      });
    }

    // A draft is hidden from the list and the detail endpoint; accepting flags
    // for one would let a player bank solves before release anyway.
    if (req.user?.role === 'user' && challenge.isPublished === false) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.user?.role === 'user') {
      const challengeIdStr = id.toString();

      // Normalize flags for comparison safely and more robustly
      const normalize = (s: string) =>
        s
          .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '') // remove zero-width chars
          .replace(/\s+/g, ' ') // collapse multiple spaces
          .trim()
          .normalize('NFKC'); // unicode normalization

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

      if (!isCorrectFlag) {
        return res.status(400).json({ error: 'Incorrect flag' });
      }

      // Calculate potential points (using current state of challenge)
      let awardedPoints: number;
      if (challenge.scoringMode === 'static') {
        awardedPoints = challenge.points;
      } else {
        awardedPoints = calculateDynamicScore(
          challenge.initialPoints,
          challenge.minimumPoints,
          challenge.decay,
          challenge.solves + 1
        );
      }

      let totalAwardedPoints = awardedPoints;
      // Provisional: settled against the atomic claim below.
      let isFirstBlood = challenge.solves === 0;
      if (isFirstBlood) {
        const firstBloodBonus = challenge.firstBloodBonus || 20;
        totalAwardedPoints += firstBloodBonus;
      }

      // CRITICAL FIX: Atomic update to prevent Race Condition (Double Submission)
      // "solvedChallenges: { $ne: challengeIdStr }" ensures we only update if not already solved.
      const userUpdate = await User.findOneAndUpdate(
        {
          _id: req.user.userId,
          isBanned: { $ne: true },
          solvedChallenges: { $ne: challengeIdStr }
        },
        {
          $push: {
            solvedChallenges: challengeIdStr,
            solvedChallengesDetails: {
              challengeId: challengeIdStr,
              solvedAt: new Date(),
              points: totalAwardedPoints
            }
          },
          $inc: { points: totalAwardedPoints }
        },
        { new: true }
      );

      if (!userUpdate) {
        const existing = await User.findById(req.user.userId).select('isBanned');
        if (!existing) {
          return res.status(404).json({ error: 'User not found' });
        }
        if (existing.isBanned) {
          return res.status(403).json({ error: 'Your account is banned' });
        }
        return res.status(400).json({ error: 'Challenge already solved' });
      }

      const solverEntry = {
        odId: (userUpdate as any)._id.toString(),
        username: (userUpdate as any).username,
        fullName: (userUpdate as any).fullName || '',
        solvedAt: new Date()
      };

      // Claim the solve count and first blood in one conditional write. Only one
      // writer can match `solves: 0`, so two players solving in the same instant
      // can no longer both be recorded as first blood.
      let challengeUpdate = await Challenge.findOneAndUpdate(
        { _id: id, solves: 0 },
        {
          $inc: { solves: 1 },
          $push: { solvers: { ...solverEntry, isFirstBlood: true } }
        },
        { new: true }
      );

      const wonFirstBlood = Boolean(challengeUpdate);

      if (!challengeUpdate) {
        challengeUpdate = await Challenge.findByIdAndUpdate(
          id,
          {
            $inc: { solves: 1 },
            $push: { solvers: { ...solverEntry, isFirstBlood: false } }
          },
          { new: true }
        );
      }

      // The award above used a read taken before the claim. If the race went the
      // other way, settle up instead of leaving a bonus that was never earned.
      if (wonFirstBlood !== isFirstBlood) {
        const bonusDelta = (challenge.firstBloodBonus || 20) * (wonFirstBlood ? 1 : -1);
        totalAwardedPoints += bonusDelta;
        isFirstBlood = wonFirstBlood;
        await User.updateOne(
          {
            _id: (userUpdate as any)._id,
            'solvedChallengesDetails.challengeId': challengeIdStr
          },
          {
            $inc: {
              points: bonusDelta,
              'solvedChallengesDetails.$.points': bonusDelta
            }
          }
        );
      }

      // Apply retroactive decay to update ALL solvers
      // This ensures score integrity over time
      try {
        await applyRetroactiveDecay(challengeIdStr);
      } catch (error) {
        console.error('Retroactive decay error:', error);
      }

      res.json({
        success: true,
        points: totalAwardedPoints,
        basePoints: awardedPoints,
        firstBlood: isFirstBlood,
        firstBloodBonus: isFirstBlood ? (challenge.firstBloodBonus || 20) : 0,
        message: 'Correct flag! Points updated for all solvers.'
      });

      // EMIT REAL-TIME EVENT for flag submission
      SocketEvents.emitFlagSubmitted(challenge.universityCode, {
        challengeId: challengeIdStr,
        challengeTitle: challenge.title,
        username: (userUpdate as any).username,
        userId: (userUpdate as any)._id.toString(),
        points: totalAwardedPoints,
        isFirstBlood
      });

      // If this is a competition challenge, emit competition activity
      if (challenge.fromCompetition && challenge.competitionId) {
        SocketEvents.emitCompetitionActivity(challenge.competitionId, {
          type: isFirstBlood ? 'first_blood' : 'solve',
          data: {
            challengeId: challengeIdStr,
            challengeTitle: challenge.title,
            username: (userUpdate as any).username,
            points: totalAwardedPoints
          },
          timestamp: new Date()
        });
      }
    } else {
      // Admins/super-admins don't score; respond clearly instead of hanging
      // (previously no branch ran and no response was ever sent).
      return res.status(403).json({ error: 'Only participants can submit flags' });
    }
  } catch (error) {
    console.error('Submit flag error:', error);
    res.status(500).json({ error: 'Error submitting flag' });
  }
};

export const copyChallengeToUniversity = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super admin can copy challenges' });
    }

    const { id } = req.params;
    const { targetUniversityCode } = req.body;

    // Validate the target before any work (prevents a raw 500 on .toUpperCase()
    // of a missing value, and avoids copying into a non-existent university).
    if (typeof targetUniversityCode !== 'string' || !targetUniversityCode.trim()) {
      return res.status(400).json({ error: 'A target university code is required' });
    }
    const targetUniversity = await University.findOne({ code: targetUniversityCode.toUpperCase() });
    if (!targetUniversity) {
      return res.status(400).json({ error: 'Target university not found' });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Create an independent copy of the challenge for the target university.
    // Do NOT publish it automatically and reset runtime fields like solves.
    const newChallenge = new Challenge({
      title: challenge.title,
      category: challenge.category,
      points: challenge.points,
      description: challenge.description,
      author: challenge.author,
      flag: challenge.flag, // Ensure flag is copied
      hints: challenge.hints || [],
      files: challenge.files || [],
      challengeLink: challenge.challengeLink || '',
      difficulty: challenge.difficulty || 'Medium',
      estimatedTime: challenge.estimatedTime || 30,
      universityCode: targetUniversityCode.toUpperCase(),
      scoringMode: challenge.scoringMode || 'dynamic',
      initialPoints: challenge.initialPoints ?? challenge.points,
      minimumPoints: challenge.minimumPoints ?? 100,
      decay: challenge.decay ?? 200,
      currentPoints: challenge.scoringMode === 'static' ? challenge.points : (challenge.initialPoints ?? challenge.points),
      isPublished: false,
      solves: 0
    });

    await newChallenge.save();
    res.status(201).json(newChallenge);
  } catch (error) {
    res.status(500).json({ error: 'Error copying challenge' });
  }
};

export const integrateCompetitionChallenge = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can integrate challenges' });
    }

    const { competitionId, challengeId } = req.params;
    const Competition = require('../models/Competition').default;

    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    const allowedUniversityCodes = Array.from(
      new Set(
        [competition.universityCode, ...(Array.isArray((competition as any).universityCodes) ? (competition as any).universityCodes : [])]
          .filter(Boolean)
          .map((code: string) => code.toUpperCase())
      )
    );

    if (req.user?.role !== 'super-admin' && !allowedUniversityCodes.includes((req.user?.universityCode || '').toUpperCase())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const competitionChallenge = competition.challenges.find((c: any) => c._id.toString() === challengeId);
    if (!competitionChallenge) {
      return res.status(404).json({ error: 'Challenge not found in competition' });
    }

    const newChallenge = new Challenge({
      title: competitionChallenge.title,
      category: competitionChallenge.category,
      points: competitionChallenge.points,
      description: competitionChallenge.description,
      author: competitionChallenge.author,
      flag: competitionChallenge.flag,
      hints: competitionChallenge.hints || [],
      files: competitionChallenge.files || [],
      universityCode: competition.universityCode,
      initialPoints: competitionChallenge.initialPoints || 1000,
      minimumPoints: competitionChallenge.minimumPoints || 100,
      decay: competitionChallenge.decay || 200,
      currentPoints: competitionChallenge.currentPoints || 1000,
      fromCompetition: true,
      competitionId: competitionId
    });

    await newChallenge.save();
    res.status(201).json(newChallenge);
  } catch (error) {
    res.status(500).json({ error: 'Error integrating challenge' });
  }
};

export const updateWriteup = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can update writeups' });
    }

    const { id } = req.params;
    const { content, images, isUnlocked, pdfFile } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.user?.role !== 'super-admin' && challenge.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    challenge.writeup = {
      content: content ?? challenge.writeup?.content ?? '',
      images: images ?? challenge.writeup?.images ?? [],
      isUnlocked: isUnlocked ?? challenge.writeup?.isUnlocked ?? false,
      pdfFile: pdfFile !== undefined ? pdfFile : challenge.writeup?.pdfFile
    };

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Error updating writeup' });
  }
};

export const publishChallenge = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can publish challenges' });
    }

    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.user?.role !== 'super-admin' && challenge.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    challenge.isPublished = true;
    await challenge.save();

    // Emit real-time event for published challenge
    SocketEvents.emitChallengePublished(challenge.universityCode, {
      id: challenge._id,
      title: challenge.title,
      category: challenge.category,
      points: challenge.points,
      currentPoints: challenge.currentPoints || challenge.points
    });

    // Announce new practice challenges (not from competitions) to the university
    if (!challenge.fromCompetition && !challenge.competitionId) {
      await Announcement.create({
        title: 'New Challenge Released',
        content: `A new challenge "${challenge.title}" in category "${challenge.category}" is now available for practice!`,
        author: req.user?.username || 'System',
        universityCode: challenge.universityCode,
        type: 'info'
      });
    }

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Error publishing challenge' });
  }
};

export const unpublishChallenge = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can unpublish challenges' });
    }

    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.user?.role !== 'super-admin' && challenge.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    challenge.isPublished = false;
    await challenge.save();

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Error unpublishing challenge' });
  }
};

export const publishHint = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can publish hints' });
    }

    const { id } = req.params;
    const { hintIndex } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.user?.role !== 'super-admin' && challenge.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!challenge.hints || challenge.hints.length === 0) {
      return res.status(400).json({ error: 'No hints found for this challenge' });
    }

    if (hintIndex < 0 || hintIndex >= challenge.hints.length) {
      return res.status(400).json({ error: 'Invalid hint index' });
    }

    challenge.hints[hintIndex].isPublished = true;
    await challenge.save();

    res.json({ message: 'Hint published successfully', hints: challenge.hints });
  } catch (error) {
    res.status(500).json({ error: 'Error publishing hint' });
  }
};

export const uploadWriteupPdfController = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can upload writeup PDFs' });
    }

    uploadWriteupPdf.single('pdf')(req as any, res as any, async (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Construct absolute URL for better compatibility with HashRouter
      // Use fixed HTTPS URL without www for Cloudflare compatibility
      const fileUrl = `https://cyberkhana.tech/api/uploads/${encodeURIComponent(req.file.filename)}`;

      res.json({
        name: req.file.originalname,
        url: fileUrl,
        uploadedAt: new Date()
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error uploading PDF' });
  }
};

export const uploadChallengeFilesController = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can upload challenge files' });
    }

    uploadChallengeFiles.array('files', 10)(req as any, res as any, async (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const files = (req.files as Express.Multer.File[]).map(file => {
        // Use fixed HTTPS URL without www for Cloudflare compatibility
        const fileUrl = `https://cyberkhana.tech/api/uploads/${encodeURIComponent(file.filename)}`;

        return {
          name: file.originalname,
          url: fileUrl
        };
      });

      res.json({ files });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error uploading files' });
  }
};

export const applyRetroactiveDecayToAll = async (req: AuthRequest, res: Response) => {
  try {
    // Only allow admins to trigger this
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can apply retroactive decay' });
    }

    const { universityCode } = req.query;
    const { applyRetroactiveDecayToAllChallenges } = require('../services/retroactiveDecayService');

    const result = await applyRetroactiveDecayToAllChallenges(universityCode as string);

    res.json({
      success: true,
      message: 'Retroactive decay applied to all challenges',
      ...result
    });
  } catch (error) {
    console.error('Error in applyRetroactiveDecayToAll:', error);
    res.status(500).json({
      error: 'Error applying retroactive decay',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const applyRetroactiveDecayToChallenge = async (req: AuthRequest, res: Response) => {
  try {
    // Only allow admins to trigger this
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can apply retroactive decay' });
    }

    const { id } = req.params;
    const result = await applyRetroactiveDecay(id);

    res.json({
      message: 'Retroactive decay applied to challenge',
      ...result
    });
  } catch (error) {
    console.error('Error in applyRetroactiveDecayToChallenge:', error);
    res.status(500).json({
      error: 'Error applying retroactive decay to challenge',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
