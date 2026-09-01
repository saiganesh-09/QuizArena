import { User, IUserDocument } from '../models/User';
import { QuizModel } from '../models/Quiz';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';
import { jwtExpirySeconds } from '../utils/cookie';
import type { UserProfile, UserRole } from '../types/auth';
import type { SignupInput, LoginInput } from '../schemas/auth.schema';

/**
 * Auth service: encapsulates business logic so controllers stay thin.
 * All methods return a safe UserProfile (password hash never leaks).
 */

export interface AuthResult {
  user: UserProfile;
  token: string;
  maxAgeSeconds: number;
}

/**
 * Auto-assign a new candidate to all active (non-completed, non-cancelled,
 * non-draft) quizzes so they can see and take quizzes immediately.
 * This makes the platform usable for any new signup without manual
 * participant management by the instructor.
 */
async function autoAssignToQuizzes(
  userId: import('mongoose').Types.ObjectId,
  email: string,
  name: string,
): Promise<void> {
  const now = new Date();
  await QuizModel.updateMany(
    {
      status: { $in: ['scheduled', 'live'] },
      'participants.userId': { $ne: userId },
    },
    {
      $addToSet: {
        participants: { userId, email, name, addedAt: now },
      },
    },
  ).exec();
}

/** Register a new candidate user. Rejects duplicate emails. */
export async function signupUser(input: SignupInput): Promise<AuthResult> {
  // Check for existing email first to produce a clean 409.
  const existing = await User.findOne({ email: input.email }).lean().exec();
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password, // hashed by the model pre-save hook
    role: 'candidate', // default role per spec
  });

  // Auto-assign the new candidate to all active quizzes so they can
  // see upcoming and live quizzes immediately after signup.
  await autoAssignToQuizzes(user._id, user.email, user.name);

  return issueAuthResult(user);
}

/** Authenticate a user by email + password. 401 on any failure. */
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  // password is select:false, so use findByEmail which selects +password.
  const user: IUserDocument | null = await User.findByEmail(input.email);

  // Use the same error for missing user and bad password to avoid
  // revealing whether an email is registered.
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const ok = await user.comparePassword(input.password);
  if (!ok) {
    throw AppError.unauthorized('Invalid email or password');
  }

  return issueAuthResult(user);
}

/** Fetch a user profile by id (used by /auth/me). */
export async function getProfileById(userId: string): Promise<UserProfile> {
  const user = await User.findById(userId)
    .select('-password')
    .lean<LeanUser | null>()
    .exec();
  if (!user) {
    throw AppError.unauthorized('Unauthorized');
  }
  return toProfile(user);
}

/** Minimal lean shape including timestamps. */
interface LeanUser {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

/** Convert a lean user document into a safe UserProfile. */
function toProfile(user: LeanUser): UserProfile {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt),
  };
}

/** Build the AuthResult (profile + signed token) from a user document. */
function issueAuthResult(user: IUserDocument): AuthResult {
  const profile = user.toProfile();
  const token = signToken({
    sub: profile.id,
    email: profile.email,
    role: profile.role,
  });
  return { user: profile, token, maxAgeSeconds: jwtExpirySeconds() };
}
