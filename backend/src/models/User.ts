import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import type { UserRole, UserProfile, AccountStatus } from '../types/auth';

/** Shape of a User document as stored in MongoDB. */
export interface IUser {
  name: string;
  email: string;
  password: string; // bcrypt hash, never serialized to clients
  role: UserRole;
  status: AccountStatus;
}

/** Mongoose document with methods. */
export interface IUserDocument extends IUser, Document {
  /** Compare a plaintext password against the stored hash. */
  comparePassword(candidate: string): Promise<boolean>;
  /** Convert the document into a safe public profile (no password). */
  toProfile(): UserProfile;
}

/** Static methods on the model. */
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const BCRYPT_COST = 12; // >= 10 as required

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email is not valid'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // excluded from queries by default
    },
    role: {
      type: String,
      enum: ['admin', 'instructor', 'candidate'],
      default: 'candidate',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      required: true,
    },
  },
  { timestamps: true },
);

/**
 * Hash the password before saving whenever it has been modified.
 * Uses bcrypt with a cost factor >= 10.
 */
userSchema.pre<IUserDocument>('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(BCRYPT_COST);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

/** Compare a plaintext candidate password against the stored hash. */
userSchema.methods.comparePassword = async function comparePassword(
  candidate: string,
): Promise<boolean> {
  // password is select:false, so it must be explicitly selected before calling.
  const hash = this.password;
  if (!hash) return false;
  return bcrypt.compare(candidate, hash);
};

/** Return a safe public profile object, strictly stripping the password hash. */
userSchema.methods.toProfile = function toProfile(): UserProfile {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
    createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : String(this.createdAt),
    updatedAt: this.updatedAt instanceof Date ? this.updatedAt.toISOString() : String(this.updatedAt),
  };
};

/** Convenience static lookup by email. */
userSchema.statics.findByEmail = function findByEmail(email: string) {
  return this.findOne({ email: email.toLowerCase() }).select('+password').exec();
};

// Text index to support admin user search by name/email.
userSchema.index({ name: 'text', email: 'text' });

/**
 * toJSON transform: defense-in-depth to ensure the password hash is never
 * leaked even if a document is accidentally serialized wholesale.
 */
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const r = ret as unknown as Record<string, unknown> & { id?: unknown };
    delete r.password;
    delete r.__v;
    r.id = r._id;
    delete r._id;
    return r;
  },
});

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
