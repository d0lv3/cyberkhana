import mongoose, { Schema, Document } from 'mongoose';
import { ChallengeCategory } from '../types';

export interface ICompetitionHint {
  text: string;
  cost: number;
  isPublished?: boolean;
}

export interface ICompetitionFile {
  name: string;
  url: string;
}

export interface ICompetitionChallenge extends Document {
  title: string;
  category: ChallengeCategory;
  points: number;
  description: string;
  author: string;
  flag: string;
  flags?: string[]; // Support multiple flags
  hints?: ICompetitionHint[];
  files?: ICompetitionFile[];
  solves: number;
  solvers?: Array<{
    odId: string;
    username: string;
    fullName?: string;
    solvedAt: Date;
    isFirstBlood: boolean;
  }>;
  initialPoints?: number;
  minimumPoints?: number;
  decay?: number;
  scoringMode?: 'dynamic' | 'static';
  currentPoints?: number;
  difficulty?: 'Very Easy' | 'Easy' | 'Medium' | 'Hard' | 'Expert';
  estimatedTime?: number;
  firstBloodBonus?: number;
  /** Events only: hidden from players until this moment (a release wave). Unset means from the start. */
  releaseAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompetition extends Document {
  type?: 'workshop' | 'event';
  /** Event brief and rules, shown to invited universities before they register. */
  description?: string;
  /** Events only: open automatically at startTime instead of waiting for the host. */
  autoStart?: boolean;
  /** Events only: from this moment players see standings as they stood then, until revealed. */
  scoreboardFreezeAt?: Date;
  scoreboardRevealedAt?: Date;
  /** Events only: when the host published the public results page. */
  resultsPublishedAt?: Date;
  certificatesIssuedAt?: Date;
  registrationDeadline?: Date;
  capacity?: number;
  eventRevision?: number;
  eventState?: import('../services/eventCompetition').EventState;
  name: string;
  securityCode?: string; // Made optional
  requiresSecurityCode: boolean; // New field
  universityCode: string;
  universityCodes?: string[];
  startTime: Date;
  endTime?: Date; // Made optional for unlimited time
  hasTimeLimit: boolean; // New field
  status: 'pending' | 'active' | 'ended';
  challenges: ICompetitionChallenge[];
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CompetitionHintSchema = new Schema({
  text: String,
  cost: Number,
  isPublished: {
    type: Boolean,
    default: false
  }
});

const CompetitionFileSchema = new Schema({
  name: String,
  url: String
});

const CompetitionChallengeSchema: Schema = new Schema({
  sourceChallengeId: String,
  challengeLink: String,
  challengeHost: String,
  challengePort: Number,
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: Object.values(ChallengeCategory),
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  flag: {
    type: String,
    required: true
  },
  flags: [{
    type: String
  }],
  hints: [CompetitionHintSchema],
  files: [CompetitionFileSchema],
  solves: {
    type: Number,
    default: 0
  },
  solvers: [{
    odId: String,
    username: String,
    fullName: String,
    solvedAt: Date,
    isFirstBlood: { type: Boolean, default: false }
  }],
  firstBloodBonus: {
    type: Number,
    default: 20
  },
  initialPoints: {
    type: Number,
    default: 1000
  },
  minimumPoints: {
    type: Number,
    default: 100
  },
  decay: {
    type: Number,
    default: 38
  },
  scoringMode: {
    type: String,
    enum: ['dynamic', 'static'],
    default: 'dynamic'
  },
  currentPoints: {
    type: Number,
    default: 1000
  },
  difficulty: {
    type: String,
    enum: ['Very Easy', 'Easy', 'Medium', 'Hard', 'Expert'],
    default: 'Medium'
  },
  estimatedTime: {
    type: Number,
    default: 30
  },
  releaseAt: Date
}, {
  timestamps: true
});

const CompetitionSchema: Schema = new Schema({
  type: { type: String, enum: ['workshop', 'event'], default: 'workshop' },
  description: { type: String, maxlength: 5000 },
  autoStart: { type: Boolean, default: false },
  scoreboardFreezeAt: Date,
  scoreboardRevealedAt: Date,
  resultsPublishedAt: Date,
  certificatesIssuedAt: Date,
  registrationDeadline: Date,
  capacity: { type: Number, min: 1, max: 10000 },
  eventRevision: { type: Number, default: 0 },
  eventState: { type: Schema.Types.Mixed },
  name: {
    type: String,
    required: true
  },
  securityCode: {
    type: String,
    trim: true,
    required: false // Made optional
  },
  requiresSecurityCode: {
    type: Boolean,
    default: true
  },
  universityCode: {
    type: String,
    required: true,
    uppercase: true
  },
  universityCodes: [{
    type: String,
    uppercase: true,
    trim: true
  }],
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  hasTimeLimit: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'ended'],
    default: 'pending'
  },
  challenges: [CompetitionChallengeSchema],
  duration: {
    type: Number
  }
}, {
  timestamps: true
});

export default mongoose.model<ICompetition>('Competition', CompetitionSchema);
