import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Challenge from '../src/models/Challenge';
import Competition from '../src/models/Competition';
import University from '../src/models/University';
import { ChallengeCategory } from '../src/types';

dotenv.config();

type SeedChallenge = {
  title: string;
  category: ChallengeCategory;
  points: number;
  currentPoints: number;
  minimumPoints: number;
  decay: number;
  scoringMode: 'dynamic' | 'static';
  description: string;
  flag: string;
  difficulty: 'Very Easy' | 'Easy' | 'Medium' | 'Hard' | 'Expert';
  estimatedTime: number;
  hints: Array<{ text: string; cost: number; isPublished: boolean }>;
};

type SeedCompetitionChallenge = {
  title: string;
  category: ChallengeCategory;
  points: number;
  description: string;
  flag: string;
  difficulty: 'Very Easy' | 'Easy' | 'Medium' | 'Hard' | 'Expert';
  estimatedTime: number;
  hints: Array<{ text: string; cost: number; isPublished: boolean }>;
};

const SEED_AUTHOR = 'mock-seed-bot';

const seedChallenges: SeedChallenge[] = [
  {
    title: 'Mock | SQLi Authentication Bypass',
    category: ChallengeCategory.WEB,
    points: 500,
    currentPoints: 500,
    minimumPoints: 100,
    decay: 38,
    scoringMode: 'dynamic',
    description: '[MOCK] Bypass a vulnerable login form and capture the admin token.',
    flag: 'flag{mock_web_sqli_001}',
    difficulty: 'Easy',
    estimatedTime: 25,
    hints: [
      { text: 'Try classic payloads around single quotes.', cost: 20, isPublished: true },
      { text: 'Use OR 1=1 and comment out trailing SQL.', cost: 35, isPublished: true }
    ]
  },
  {
    title: 'Mock | Intro Buffer Overflow',
    category: ChallengeCategory.PWN,
    points: 700,
    currentPoints: 700,
    minimumPoints: 150,
    decay: 45,
    scoringMode: 'dynamic',
    description: '[MOCK] Overflow a stack buffer to redirect execution flow.',
    flag: 'flag{mock_pwn_bof_001}',
    difficulty: 'Medium',
    estimatedTime: 45,
    hints: [
      { text: 'Find offset with cyclic pattern.', cost: 25, isPublished: true },
      { text: 'Control RIP to jump into win().', cost: 50, isPublished: false }
    ]
  },
  {
    title: 'Mock | XOR Vault',
    category: ChallengeCategory.CRYPTO,
    points: 450,
    currentPoints: 450,
    minimumPoints: 100,
    decay: 30,
    scoringMode: 'dynamic',
    description: '[MOCK] Recover plaintext from repeated-key XOR ciphertext.',
    flag: 'flag{mock_crypto_xor_001}',
    difficulty: 'Easy',
    estimatedTime: 20,
    hints: [
      { text: 'Look for key-length periodicity.', cost: 15, isPublished: true }
    ]
  },
  {
    title: 'Mock | Memory Snapshot Hunt',
    category: ChallengeCategory.FORENSICS,
    points: 650,
    currentPoints: 650,
    minimumPoints: 120,
    decay: 40,
    scoringMode: 'dynamic',
    description: '[MOCK] Analyze a RAM dump and find leaked operator credentials.',
    flag: 'flag{mock_forensics_mem_001}',
    difficulty: 'Medium',
    estimatedTime: 40,
    hints: [
      { text: 'Use strings and grep for suspicious domains.', cost: 20, isPublished: true }
    ]
  },
  {
    title: 'Mock | License Crackme',
    category: ChallengeCategory.REVERSING,
    points: 800,
    currentPoints: 800,
    minimumPoints: 200,
    decay: 50,
    scoringMode: 'dynamic',
    description: '[MOCK] Reverse a serial check routine and generate a valid key.',
    flag: 'flag{mock_rev_serial_001}',
    difficulty: 'Hard',
    estimatedTime: 60,
    hints: [
      { text: 'Patch branch after strcmp to understand success path.', cost: 30, isPublished: true }
    ]
  }
];

const seedCompetitions: Array<{
  name: string;
  securityCode: string;
  requiresSecurityCode: boolean;
  hasTimeLimit: boolean;
  status: 'pending' | 'active' | 'ended';
  startOffsetHours: number;
  durationHours: number;
  challenges: SeedCompetitionChallenge[];
}> = [
  {
    name: 'Mock Spring CTF Qualifiers',
    securityCode: 'MOCKSPRING2026',
    requiresSecurityCode: true,
    hasTimeLimit: true,
    status: 'active',
    startOffsetHours: -2,
    durationHours: 24,
    challenges: [
      {
        title: 'Comp Mock | Web Token Drift',
        category: ChallengeCategory.WEB,
        points: 500,
        description: '[MOCK] Abuse weak JWT verification in a competition service.',
        flag: 'flag{comp_mock_web_001}',
        difficulty: 'Medium',
        estimatedTime: 30,
        hints: [{ text: 'Check algorithm confusion possibilities.', cost: 25, isPublished: true }]
      },
      {
        title: 'Comp Mock | Heap Note',
        category: ChallengeCategory.PWN,
        points: 750,
        description: '[MOCK] Exploit heap metadata corruption in note manager.',
        flag: 'flag{comp_mock_pwn_001}',
        difficulty: 'Hard',
        estimatedTime: 55,
        hints: [{ text: 'Inspect free-list behavior under double free.', cost: 35, isPublished: false }]
      }
    ]
  },
  {
    name: 'Mock Weekend Academy Cup',
    securityCode: 'WEEKENDMOCK',
    requiresSecurityCode: false,
    hasTimeLimit: true,
    status: 'pending',
    startOffsetHours: 24,
    durationHours: 8,
    challenges: [
      {
        title: 'Comp Mock | Packet Trail',
        category: ChallengeCategory.FORENSICS,
        points: 450,
        description: '[MOCK] Trace attacker movement through packet captures.',
        flag: 'flag{comp_mock_forensics_001}',
        difficulty: 'Easy',
        estimatedTime: 20,
        hints: [{ text: 'Follow unusual DNS TXT records.', cost: 15, isPublished: true }]
      },
      {
        title: 'Comp Mock | Caesar and Friends',
        category: ChallengeCategory.CRYPTO,
        points: 400,
        description: '[MOCK] Chain simple substitution ciphers to reveal final secret.',
        flag: 'flag{comp_mock_crypto_001}',
        difficulty: 'Very Easy',
        estimatedTime: 15,
        hints: [{ text: 'Frequency analysis is enough here.', cost: 10, isPublished: true }]
      }
    ]
  }
];

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force');

const ensureSafeEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  if (!force && env !== 'development' && env !== 'test') {
    throw new Error(`Refusing to run seed in NODE_ENV=${env}. Use --force to override.`);
  }
};

const ensureUniversity = async (code: string, name: string) => {
  await University.findOneAndUpdate(
    { code },
    { $setOnInsert: { name, code } },
    { upsert: true, new: true }
  );
};

const buildChallengeOps = (universityCode: string) => {
  return seedChallenges.map((challenge) => ({
    updateOne: {
      filter: {
        title: challenge.title,
        universityCode,
        author: SEED_AUTHOR,
        fromCompetition: { $ne: true }
      },
      update: {
        $set: {
          category: challenge.category,
          points: challenge.points,
          currentPoints: challenge.currentPoints,
          minimumPoints: challenge.minimumPoints,
          decay: challenge.decay,
          scoringMode: challenge.scoringMode,
          description: challenge.description,
          flag: challenge.flag,
          difficulty: challenge.difficulty,
          estimatedTime: challenge.estimatedTime,
          hints: challenge.hints,
          isPublished: true
        },
        $setOnInsert: {
          title: challenge.title,
          author: SEED_AUTHOR,
          universityCode,
          solves: 0,
          fromCompetition: false
        }
      },
      upsert: true
    }
  }));
};

const buildCompetitionDoc = (competition: (typeof seedCompetitions)[number], universityCode: string) => {
  const now = new Date();
  const startTime = new Date(now.getTime() + competition.startOffsetHours * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + competition.durationHours * 60 * 60 * 1000);

  return {
    name: competition.name,
    securityCode: competition.securityCode,
    requiresSecurityCode: competition.requiresSecurityCode,
    universityCode,
    startTime,
    endTime,
    hasTimeLimit: competition.hasTimeLimit,
    status: competition.status,
    duration: competition.durationHours,
    challenges: competition.challenges.map((challenge) => ({
      title: challenge.title,
      category: challenge.category,
      points: challenge.points,
      description: challenge.description,
      author: SEED_AUTHOR,
      flag: challenge.flag,
      hints: challenge.hints,
      solves: 0,
      initialPoints: challenge.points,
      minimumPoints: Math.max(100, Math.floor(challenge.points * 0.25)),
      decay: 38,
      scoringMode: 'dynamic',
      currentPoints: challenge.points,
      difficulty: challenge.difficulty,
      estimatedTime: challenge.estimatedTime,
      firstBloodBonus: 20
    }))
  };
};

const run = async () => {
  ensureSafeEnvironment();

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it in backend/.env');
  }

  const targetUniversity = { code: 'MIT123', name: 'MIT' };

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to MongoDB (${mongoose.connection.name})`);

  await ensureUniversity(targetUniversity.code, targetUniversity.name);

  const challengeOps = buildChallengeOps(targetUniversity.code);

  if (dryRun) {
    console.log(`[DRY RUN] Would upsert ${challengeOps.length} challenges and ${seedCompetitions.length} competitions.`);
    console.log('[DRY RUN] No changes were written.');
    return;
  }

  const challengeResult = await Challenge.bulkWrite(challengeOps, { ordered: false });

  let competitionsUpserted = 0;
  let competitionsModified = 0;

  for (const competition of seedCompetitions) {
    const payload = buildCompetitionDoc(competition, targetUniversity.code);
    const result = await Competition.updateOne(
      { name: competition.name, universityCode: targetUniversity.code },
      { $set: payload },
      { upsert: true }
    );

    competitionsUpserted += result.upsertedCount || 0;
    competitionsModified += result.modifiedCount || 0;
  }

  const inserted = challengeResult.upsertedCount || 0;
  const modified = challengeResult.modifiedCount || 0;
  const matched = challengeResult.matchedCount || 0;

  console.log('Mock seed completed successfully.');
  console.log(`Challenges => upserted: ${inserted}, modified: ${modified}, matched: ${matched}`);
  console.log(`Competitions => upserted: ${competitionsUpserted}, modified: ${competitionsModified}`);
};

run()
  .catch((error) => {
    console.error('Mock seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  });
