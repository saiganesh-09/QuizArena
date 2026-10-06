import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Invite — a pending invitation for an email that is not yet a
 * registered candidate. When that email signs up, the pending invites
 * are accepted and the user is added as a participant on each quiz.
 */
export interface IInvite {
  email: string;
  quizId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  token: string;
  status: 'pending' | 'accepted';
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInviteDocument extends IInvite, Document {}

const inviteSchema = new Schema<IInviteDocument>(
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

inviteSchema.index({ email: 1, quizId: 1, status: 1 });

export const Invite: Model<IInviteDocument> =
  (mongoose.models.Invite as Model<IInviteDocument>) ??
  mongoose.model<IInviteDocument>('Invite', inviteSchema);
