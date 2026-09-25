import mongoose, { Schema, Document } from 'mongoose';

/**
 * A participation certificate for one player in one finished event.
 *
 * Everything printed on the certificate is copied in when it is issued, so a
 * later rename, team change or profile edit cannot alter a certificate that has
 * already been handed out. `code` is the public verification handle: 128 random
 * bits, so it cannot be guessed or enumerated from another certificate's code.
 */
export interface ICertificate extends Document {
  code: string;
  competitionId: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  username: string;
  universityCode: string;
  universityName: string;
  teamName?: string;
  /** Team placing among ranked teams; unset for a player who never joined a team. */
  rank?: number;
  totalTeams: number;
  points?: number;
  solved?: number;
  eventName: string;
  hostUniversityCode: string;
  hostUniversityName: string;
  eventStart?: Date;
  eventEnd?: Date;
  issuedAt: Date;
  /** Set when the holder stops being eligible (for example, their team was disqualified). */
  revokedAt?: Date;
}

const CertificateSchema = new Schema<ICertificate>({
  code: { type: String, required: true, unique: true },
  competitionId: { type: Schema.Types.ObjectId, required: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  username: { type: String, required: true },
  universityCode: { type: String, required: true },
  universityName: { type: String, required: true },
  teamName: String,
  rank: Number,
  totalTeams: { type: Number, required: true },
  points: Number,
  solved: Number,
  eventName: { type: String, required: true },
  hostUniversityCode: { type: String, required: true },
  hostUniversityName: { type: String, required: true },
  eventStart: Date,
  eventEnd: Date,
  issuedAt: { type: Date, required: true },
  revokedAt: Date,
});

CertificateSchema.index({ competitionId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ICertificate>('Certificate', CertificateSchema);
