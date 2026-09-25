import mongoose, { Schema, Document } from 'mongoose';

/**
 * One flag attempt in an event, for the host's submission log.
 *
 * Kept in its own collection rather than the event document on purpose. Every
 * event invariant lives in one document that is rewritten on each change, with
 * a 12 MB guard below MongoDB's limit; if wrong guesses were stored there, a
 * player spamming the submit form could grow the event until every write in it
 * failed. Here a flood of attempts costs a flood of small inserts and nothing else.
 *
 * Only hosts can read these. The submitted text is kept for wrong attempts only
 * (a correct one is the flag itself, which the host already has), truncated, and
 * always rendered as text.
 */
export type SubmissionResult = 'correct' | 'incorrect' | 'already_solved' | 'blocked';

export interface IEventSubmission extends Document {
  competitionId: mongoose.Types.ObjectId;
  challengeId: string;
  challengeTitle: string;
  userId: string;
  username: string;
  teamId?: string;
  teamName?: string;
  result: SubmissionResult;
  /** Why a blocked attempt was refused, e.g. a disqualified team or a closed event. */
  detail?: string;
  submitted?: string;
  /** A wrong answer that is another challenge's flag: a mix-up, or a sign of shared flags. */
  matchedChallengeId?: string;
  matchedChallengeTitle?: string;
  createdAt: Date;
}

export const SUBMITTED_TEXT_LIMIT = 256;
/** Long enough to review an event and its disputes; attempts are not kept forever. */
export const SUBMISSION_RETENTION_DAYS = 180;

const EventSubmissionSchema = new Schema<IEventSubmission>({
  competitionId: { type: Schema.Types.ObjectId, required: true },
  challengeId: { type: String, required: true },
  challengeTitle: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  teamId: String,
  teamName: String,
  result: { type: String, enum: ['correct', 'incorrect', 'already_solved', 'blocked'], required: true },
  detail: { type: String, maxlength: 200 },
  submitted: { type: String, maxlength: SUBMITTED_TEXT_LIMIT },
  matchedChallengeId: String,
  matchedChallengeTitle: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

EventSubmissionSchema.index({ competitionId: 1, _id: -1 });
EventSubmissionSchema.index({ createdAt: 1 }, { expireAfterSeconds: SUBMISSION_RETENTION_DAYS * 86400 });

export default mongoose.model<IEventSubmission>('EventSubmission', EventSubmissionSchema);
