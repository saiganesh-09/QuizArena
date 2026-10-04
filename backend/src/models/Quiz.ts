import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  Quiz,
  QuizStatus,
  QuizKind,
  Question,
  Participant,
  QuizReadiness,
  InstructorQuiz,
  CandidateQuizMeta,
  QuestionType,
} from '../types/quiz';
import { AppError } from '../utils/AppError';

/**
 * Quiz model with a strict lifecycle state machine.
 *
 * Draft -> Scheduled -> Live -> Completed
 * Cancelled is reachable from Draft, Scheduled, or Live and is terminal.
 *
 * Edits are allowed ONLY in Draft or Scheduled.
 * Deletes are allowed ONLY in Draft.
 */

/** Mongoose subdocument shape for an instructor assignment. */
export interface IInstructorAssignmentDoc {
  instructorId: mongoose.Types.ObjectId;
  instructorEmail: string;
  assignedAt: Date;
}

/** Mongoose subdocument shape for a question option. */
export interface IQuestionOptionDoc {
  id: string;
  text: string;
}

/** Mongoose subdocument shape for a question. */
export interface IQuestionDoc {
  _id: mongoose.Types.ObjectId;
  type: QuestionType;
  text: string;
  options: IQuestionOptionDoc[];
  correctOptionIds: string[];
  points: number;
}

/** Mongoose subdocument shape for a participant. */
export interface IParticipantDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  email: string;
  name: string;
  addedAt: Date;
}

/** Shape of a Quiz document as stored in MongoDB. */
export interface IQuiz {
  title: string;
  description: string;
  status: QuizStatus;
  kind: QuizKind;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  level: string;
  difficulty: string;
  passingPoints: number;
  createdBy: mongoose.Types.ObjectId;
  instructors: IInstructorAssignmentDoc[];
  questions: IQuestionDoc[];
  participants: IParticipantDoc[];
  cancelledAt: Date | null;
}

export interface IQuizDocument extends IQuiz, Document {
  /** Transition this quiz to a new status, enforcing the state machine. */
  transitionTo(next: QuizStatus): Promise<IQuizDocument>;
  /** Convert to a safe public Quiz object with ISO-8601 UTC strings. */
  toQuizObject(): Quiz;
  /** Convert to an instructor view with readiness signals + counts. */
  toInstructorQuiz(): InstructorQuiz;
  /** Whether the quiz is editable (Draft or Scheduled). */
  isEditable(): boolean;
  /** Whether the quiz can be cancelled (not Completed, not already Cancelled). */
  isCancellable(): boolean;
  /** Whether the quiz can be deleted (Draft only). */
  isDeletable(): boolean;
  /** Compute publish readiness (questions, participants, schedule). */
  computeReadiness(): QuizReadiness;
  /** Whether the calling instructor owns this quiz. */
  isOwnedBy(instructorId: string): boolean;
  /** Convert to a metadata-only view for candidates (no questions/answers). */
  toCandidateMeta(): CandidateQuizMeta;
  /** Whether the calling candidate is assigned to this quiz. */
  isAssignedTo(candidateId: string): boolean;
}

export interface IQuizModel extends Model<IQuizDocument> {
  findByIdOrThrow(id: string): Promise<IQuizDocument>;
}

/** Allowed transitions: from -> set of reachable states. */
const ALLOWED_TRANSITIONS: Record<QuizStatus, readonly QuizStatus[]> = {
  draft: ['scheduled', 'live', 'completed', 'cancelled'],
  scheduled: ['live', 'completed', 'cancelled'],
  live: ['completed', 'cancelled'],
  completed: [], // terminal
  cancelled: [], // terminal, read-only
};

const quizSchema = new Schema<IQuizDocument, IQuizModel>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'live', 'completed', 'cancelled'],
      default: 'draft',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['quiz', 'homework'],
      default: 'quiz',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function validateEndAfterStart(this: IQuizDocument, value: Date): boolean {
          // endTime must be strictly after startTime.
          return !this.startTime || value.getTime() > this.startTime.getTime();
        },
        message: 'End time must be strictly after start time',
      },
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [10080, 'Duration must be at most 7 days (10080 minutes)'],
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },
    passingPoints: {
      type: Number,
      default: 0,
      min: [0, 'Passing points cannot be negative'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    instructors: {
      type: [
        {
          instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          instructorEmail: { type: String, required: true },
          assignedAt: { type: Date, required: true },
        },
      ],
      default: [],
    },
    questions: {
      type: [
        {
          type: { type: String, enum: ['single-choice', 'multi-select', 'true-false'], required: true },
          text: { type: String, required: true, trim: true, minlength: [3, 'Question text must be at least 3 characters'], maxlength: [1000, 'Question text is too long'] },
          options: {
            type: [
              {
                id: { type: String, required: true },
                text: { type: String, required: true, trim: true },
              },
            ],
            default: [],
          },
          correctOptionIds: {
            type: [String],
            default: [],
          },
          points: { type: Number, default: 1, min: [1, 'Points must be at least 1'], max: [100, 'Points must be at most 100'] },
        },
      ],
      default: [],
    },
    participants: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          email: { type: String, required: true, trim: true, lowercase: true },
          name: { type: String, required: true, trim: true },
          addedAt: { type: Date, required: true },
        },
      ],
      default: [],
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Compound index for common dashboard queries.
quizSchema.index({ status: 1, startTime: 1 });
quizSchema.index({ title: 'text', description: 'text' });

/** Whether the quiz is in an editable state (Draft or Scheduled). */
quizSchema.methods.isEditable = function isEditable(): boolean {
  return this.status === 'draft' || this.status === 'scheduled';
};

/** Whether the quiz can be cancelled (not Completed, not already Cancelled). */
quizSchema.methods.isCancellable = function isCancellable(): boolean {
  return this.status !== 'completed' && this.status !== 'cancelled';
};

/** Whether the quiz can be deleted (Draft only). */
quizSchema.methods.isDeletable = function isDeletable(): boolean {
  return this.status === 'draft';
};

/** Whether the calling instructor owns (is assigned to) this quiz. */
quizSchema.methods.isOwnedBy = function isOwnedBy(instructorId: string): boolean {
  return (this.instructors ?? []).some(
    (a: IInstructorAssignmentDoc) => a.instructorId.toString() === instructorId,
  );
};

/**
 * Compute publish readiness. A quiz is ready to publish (Draft -> Scheduled)
 * only if it has >= 1 question, >= 1 participant, and a valid upcoming
 * schedule window (startTime in the future, endTime after startTime).
 */
quizSchema.methods.computeReadiness = function computeReadiness(): QuizReadiness {
  const qCount = (this.questions ?? []).length;
  const hasParticipants = (this.participants ?? []).length > 0;
  const now = Date.now();
  const start = this.startTime instanceof Date ? this.startTime.getTime() : 0;
  const end = this.endTime instanceof Date ? this.endTime.getTime() : 0;

  // Homework (daily assignments) may start immediately or already be in
  // its window — the requirement is simply that the window has not closed.
  // Regular quizzes still require an upcoming start.
  const isHomework = this.kind === 'homework';
  const minQuestions = isHomework ? 10 : 1;
  const hasQuestions = qCount >= minQuestions;
  const hasUpcomingSchedule = isHomework
    ? end > now && end > start
    : start > now && end > start;

  const missing: string[] = [];
  if (!hasQuestions) {
    missing.push(isHomework ? 'Homework requires at least 10 questions' : 'At least one question is required');
  }
  if (!hasParticipants) missing.push('At least one participant is required');
  if (!hasUpcomingSchedule) {
    missing.push(isHomework
      ? 'A valid schedule window that has not ended is required'
      : 'A valid upcoming schedule window is required (start time in the future, end after start)');
  }

  return {
    ready: missing.length === 0,
    hasQuestions,
    hasParticipants,
    hasUpcomingSchedule,
    missing,
  };
};

/** Whether the calling candidate is assigned to this quiz. */
quizSchema.methods.isAssignedTo = function isAssignedTo(candidateId: string): boolean {
  return (this.participants ?? []).some(
    (p: IParticipantDoc) => p.userId.toString() === candidateId,
  );
};

/**
 * Convert to a metadata-only view for candidates.
 *
 * SECURITY: This deliberately strips the questions, options, correct
 * answer keys, and participants arrays. Only safe metadata (title,
 * description, timing, duration, question count) is exposed.
 */
quizSchema.methods.toCandidateMeta = function toCandidateMeta(): CandidateQuizMeta {
  const now = Date.now();
  const start = this.startTime instanceof Date ? this.startTime.getTime() : 0;
  const end = this.endTime instanceof Date ? this.endTime.getTime() : 0;
  const isLiveNow = now >= start && now <= end;
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    status: this.status,
    kind: this.kind,
    startTime: toIsoUtc(this.startTime),
    endTime: toIsoUtc(this.endTime),
    durationMinutes: this.durationMinutes,
    level: this.level,
    difficulty: this.difficulty,
    passingPoints: this.passingPoints,
    questionCount: (this.questions ?? []).length,
    isLiveNow,
    hasSubmitted: false, // attempts are a future milestone
  };
};

/**
 * Enforce the lifecycle state machine. Throws a 409 AppError if the
 * transition is not allowed.
 */
quizSchema.methods.transitionTo = async function transitionTo(
  next: QuizStatus,
): Promise<IQuizDocument> {
  const currentStatus = this.status as QuizStatus;
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed.includes(next)) {
    throw AppError.conflict(
      `Cannot transition quiz from '${currentStatus}' to '${next}'`,
    );
  }
  this.status = next;
  if (next === 'cancelled') {
    this.cancelledAt = new Date();
  }
  return this.save();
};

/** Convert to a safe public Quiz object with ISO-8601 UTC strings. */
quizSchema.methods.toQuizObject = function toQuizObject(): Quiz {
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    status: this.status,
    kind: this.kind,
    startTime: toIsoUtc(this.startTime),
    endTime: toIsoUtc(this.endTime),
    durationMinutes: this.durationMinutes,
    level: this.level,
    difficulty: this.difficulty,
    passingPoints: this.passingPoints,
    createdBy: this.createdBy.toString(),
    instructors: (this.instructors ?? []).map(
      (a: { instructorId: { toString(): string }; instructorEmail: string; assignedAt: Date }) => ({
        instructorId: a.instructorId.toString(),
        instructorEmail: a.instructorEmail,
        assignedAt: toIsoUtc(a.assignedAt),
      }),
    ),
    questions: (this.questions ?? []).map((q: IQuestionDoc) => toQuestion(q)),
    participants: (this.participants ?? []).map((p: IParticipantDoc) => toParticipant(p)),
    questionCount: (this.questions ?? []).length,
    participantCount: (this.participants ?? []).length,
    cancelledAt: this.cancelledAt ? toIsoUtc(this.cancelledAt) : null,
    createdAt: toIsoUtc(this.createdAt),
    updatedAt: toIsoUtc(this.updatedAt),
  };
};

/** Convert to an instructor view with readiness signals + counts. */
quizSchema.methods.toInstructorQuiz = function toInstructorQuiz(): InstructorQuiz {
  const base = this.toQuizObject();
  return {
    ...base,
    questionCount: (this.questions ?? []).length,
    participantCount: (this.participants ?? []).length,
    readiness: this.computeReadiness(),
  };
};

/** Fetch a quiz by id or throw 404. */
quizSchema.statics.findByIdOrThrow = async function findByIdOrThrow(
  id: string,
): Promise<IQuizDocument> {
  const quiz = await this.findById(id).exec();
  if (!quiz) {
    throw AppError.notFound('Quiz not found');
  }
  return quiz;
};

/** Safely convert a Date (or unknown) to an ISO-8601 UTC string. */
function toIsoUtc(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

/** Convert a question subdocument to a public Question object. */
function toQuestion(q: IQuestionDoc): Question {
  return {
    id: q._id.toString(),
    type: q.type,
    text: q.text,
    options: (q.options ?? []).map((o) => ({ id: o.id, text: o.text })),
    correctOptionIds: q.correctOptionIds ?? [],
    points: q.points,
    createdAt: toIsoUtc((q as unknown as { createdAt?: Date }).createdAt),
    updatedAt: toIsoUtc((q as unknown as { updatedAt?: Date }).updatedAt),
  };
}

/** Convert a participant subdocument to a public Participant object. */
function toParticipant(p: IParticipantDoc): Participant {
  return {
    id: p._id.toString(),
    userId: p.userId.toString(),
    email: p.email,
    name: p.name,
    addedAt: toIsoUtc(p.addedAt),
  };
}

export const QuizModel = mongoose.model<IQuizDocument, IQuizModel>('Quiz', quizSchema);
