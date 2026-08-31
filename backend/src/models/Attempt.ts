import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  AttemptStatus,
  ScoredAnswer,
  QuestionType,
} from '../types/quiz';

/**
 * Attempt model — records a candidate's quiz attempt.
 *
 * SECURITY & INTEGRITY:
 * - Unique index on { candidateId, quizId } enforces one attempt per
 *   candidate per quiz at the database level.
 * - The `answers` array stores scored answers (with awardedPoints) only
 *   AFTER submission. Before submission, answers are not persisted on
 *   the attempt (they are sent in the submit payload).
 * - `score` and `maxScore` are calculated once at submission time and
 *   persisted. All future reads use these stored values.
 */

/** Mongoose subdocument for a scored answer (stored after submission). */
export interface IScoredAnswerDoc {
  questionId: mongoose.Types.ObjectId;
  selectedOptionIds: string[];
  awardedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
}

/** Shape of an Attempt document as stored in MongoDB. */
export interface IAttempt {
  quizId: mongoose.Types.ObjectId;
  quizTitle: string;
  candidateId: mongoose.Types.ObjectId;
  status: AttemptStatus;
  startedAt: Date;
  submittedAt: Date | null;
  deadlineAt: Date;
  durationMinutes: number;
  answers: IScoredAnswerDoc[];
  score: number;
  maxScore: number;
  autoSubmitted: boolean;
}

export interface IAttemptDocument extends IAttempt, Document {
  /** Convert to a safe AttemptPayload for the client. */
  toAttemptPayload(includeQuestions: boolean, questions?: AttemptQuestionForPayload[]): AttemptPayloadForClient;
}

export interface IAttemptModel extends Model<IAttemptDocument> {
  /** Find an attempt by candidate + quiz, or return null. */
  findByCandidateAndQuiz(candidateId: string, quizId: string): Promise<IAttemptDocument | null>;
}

/** Question shape for payload conversion (without correct answers). */
export interface AttemptQuestionForPayload {
  id: string;
  type: QuestionType;
  text: string;
  options: { id: string; text: string }[];
  points: number;
}

/** Client-facing attempt payload (mirrors AttemptPayload type). */
export interface AttemptPayloadForClient {
  id: string;
  quizId: string;
  quizTitle: string;
  candidateId: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  deadlineAt: string;
  durationMinutes: number;
  questions: AttemptQuestionForPayload[];
  answers: ScoredAnswer[];
  score: number;
  maxScore: number;
  autoSubmitted: boolean;
}

const scoredAnswerSchema = new Schema<IScoredAnswerDoc>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    selectedOptionIds: { type: [String], default: [] },
    awardedPoints: { type: Number, required: true, default: 0 },
    maxPoints: { type: Number, required: true, default: 0 },
    isCorrect: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const attemptSchema = new Schema<IAttemptDocument, IAttemptModel>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    quizTitle: { type: String, required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'auto-submitted'],
      default: 'in-progress',
      required: true,
    },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    deadlineAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    answers: { type: [scoredAnswerSchema], default: [] },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    autoSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// CRITICAL: unique index enforces one attempt per candidate per quiz
// at the database level. This prevents race conditions where two
// concurrent "start" calls could create duplicate attempts.
attemptSchema.index({ candidateId: 1, quizId: 1 }, { unique: true });
attemptSchema.index({ status: 1 });

/** Convert to a safe client payload. */
attemptSchema.methods.toAttemptPayload = function toAttemptPayload(
  includeQuestions: boolean,
  questions?: AttemptQuestionForPayload[],
): AttemptPayloadForClient {
  return {
    id: this._id.toString(),
    quizId: this.quizId.toString(),
    quizTitle: this.quizTitle,
    candidateId: this.candidateId.toString(),
    status: this.status,
    startedAt: toIsoUtc(this.startedAt),
    submittedAt: this.submittedAt ? toIsoUtc(this.submittedAt) : null,
    deadlineAt: toIsoUtc(this.deadlineAt),
    durationMinutes: this.durationMinutes,
    questions: includeQuestions && questions ? questions : [],
    answers: (this.answers ?? []).map((a: IScoredAnswerDoc) => ({
      questionId: a.questionId.toString(),
      selectedOptionIds: a.selectedOptionIds ?? [],
      awardedPoints: a.awardedPoints,
      maxPoints: a.maxPoints,
      isCorrect: a.isCorrect,
    })),
    score: this.score,
    maxScore: this.maxScore,
    autoSubmitted: this.autoSubmitted,
  };
};

/** Find an attempt by candidate + quiz. */
attemptSchema.statics.findByCandidateAndQuiz = async function findByCandidateAndQuiz(
  candidateId: string,
  quizId: string,
): Promise<IAttemptDocument | null> {
  return this.findOne({
    candidateId: new mongoose.Types.ObjectId(candidateId),
    quizId: new mongoose.Types.ObjectId(quizId),
  }).exec();
};

/** Safely convert a Date to an ISO-8601 UTC string. */
function toIsoUtc(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export const AttemptModel = mongoose.model<IAttemptDocument, IAttemptModel>('Attempt', attemptSchema);
