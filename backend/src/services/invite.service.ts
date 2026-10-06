import crypto from 'crypto';
import mongoose from 'mongoose';
import { Invite } from '../models/Invite';
import { User } from '../models/User';
import { QuizModel, IQuizDocument } from '../models/Quiz';
import { config } from '../config';
import { AppError } from '../utils/AppError';

export interface InviteResult {
  email: string;
  /** Set when the email already belongs to a registered candidate. */
  registered: boolean;
  /** Shareable signup link for unregistered emails. */
  inviteUrl: string | null;
}

/**
 * Invite a student to a quiz by email. If the email is already a
 * registered candidate the caller should use the participant endpoint
 * instead — this service handles the pending-invite path and returns a
 * shareable signup link the teacher can send (email, chat, etc.).
 */
export async function createInvite(
  quiz: IQuizDocument,
  email: string,
  invitedBy: string,
): Promise<InviteResult> {
  const normalized = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalized }).select('_id role').lean().exec();
  if (existingUser) {
    throw AppError.conflict(`${normalized} is already registered — add them as a participant instead.`);
  }

  // Idempotent: reuse an existing pending invite for this quiz+email.
  let invite = await Invite.findOne({ email: normalized, quizId: quiz._id, status: 'pending' }).exec();
  if (!invite) {
    invite = await Invite.create({
      email: normalized,
      quizId: quiz._id,
      invitedBy: new mongoose.Types.ObjectId(invitedBy),
      token: crypto.randomBytes(24).toString('hex'),
      status: 'pending',
      acceptedAt: null,
    });
  }

  const base = config.cors.clientOrigin.replace(/\/$/, '');
  return {
    email: normalized,
    registered: false,
    inviteUrl: `${base}/signup?invite=${invite.token}&email=${encodeURIComponent(normalized)}`,
  };
}

/** List pending invites for a quiz (instructor-facing). */
export async function listInvites(
  quiz: IQuizDocument,
): Promise<{ id: string; email: string; inviteUrl: string; createdAt: string }[]> {
  const invites = await Invite.find({ quizId: quiz._id, status: 'pending' }).exec();
  const base = config.cors.clientOrigin.replace(/\/$/, '');
  return invites.map((i) => ({
    id: i._id.toString(),
    email: i.email,
    inviteUrl: `${base}/signup?invite=${i.token}&email=${encodeURIComponent(i.email)}`,
    createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : '',
  }));
}

/**
 * Accept all pending invites for a newly-registered user: attach them
 * as a participant on each invited quiz and mark the invite accepted.
 * Called from signup (and login, in case a quiz changed).
 */
export async function acceptInvitesForUser(user: {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
}): Promise<number> {
  const invites = await Invite.find({ email: user.email.toLowerCase(), status: 'pending' }).exec();
  let accepted = 0;
  for (const invite of invites) {
    const quiz = await QuizModel.findById(invite.quizId).exec();
    if (quiz) {
      const already = (quiz.participants ?? []).some(
        (p) => p.userId.toString() === user._id.toString(),
      );
      if (!already) {
        quiz.participants.push({
          _id: new mongoose.Types.ObjectId(),
          userId: user._id,
          email: user.email,
          name: user.name,
          addedAt: new Date(),
        });
        await quiz.save();
      }
    }
    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    await invite.save();
    accepted += 1;
  }
  return accepted;
}
