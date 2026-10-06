import { QuizModel, IQuizDocument } from '../models/Quiz';
import { AttemptModel } from '../models/Attempt';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';
import type {
  InstructorQuiz,
  InstructorQuizListPayload,
  QuizStatusStats,
  Quiz,
  QuizStatus,
  AttemptStatus,
} from '../types/quiz';
import type { InstructorQuizListQuery } from '../schemas/instructor.schema';
import type { EditQuizInput } from '../schemas/quiz.schema';

/**
 * Instructor quiz service.
 *
 * Every method is scoped to the calling instructor: queries filter by
 * the instructor's id, and mutations verify ownership before proceeding.
 */

/** Build the MongoDB filter for instructor quizzes. */
function buildFilter(instructorId: string, query: InstructorQuizListQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    'instructors.instructorId': instructorId,
  };
  if (query.status) filter.status = query.status;
  if (query.kind) filter.kind = query.kind;
  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ];
  }
  return filter;
}

/** Compute status stats scoped to the instructor. */
async function computeInstructorStats(instructorId: string): Promise<QuizStatusStats> {
  const agg = await QuizModel.aggregate<{ _id: QuizStatus; count: number }>([
    { $match: { 'instructors.instructorId': new mongoose.Types.ObjectId(instructorId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]).exec();

  const stats: QuizStatusStats = {
    draft: 0, scheduled: 0, live: 0, completed: 0, cancelled: 0, total: 0,
  };
  for (const r of agg) {
    stats[r._id] = r.count;
    stats.total += r.count;
  }
  return stats;
}

/** List quizzes assigned to the instructor, with readiness signals + stats. */
export async function listInstructorQuizzes(
  instructorId: string,
  query: InstructorQuizListQuery,
): Promise<InstructorQuizListPayload> {
  const filter = buildFilter(instructorId, query);
  const sortDir = query.sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [query.sortBy]: sortDir };
  const skip = (query.page - 1) * query.limit;

  const [docs, total] = await Promise.all([
    QuizModel.find(filter).sort(sort).skip(skip).limit(query.limit).exec(),
    QuizModel.countDocuments(filter).exec(),
  ]);

  const stats = await computeInstructorStats(instructorId);

  // Submission stats for the page's quizzes (used by the Results hub).
  const quizIds = docs.map((d) => d._id);
  const attemptAgg = await AttemptModel.aggregate<{
    _id: mongoose.Types.ObjectId;
    count: number;
    avgPct: number;
  }>([
    {
      $match: {
        quizId: { $in: quizIds },
        status: { $in: ['submitted', 'auto-submitted'] as AttemptStatus[] },
      },
    },
    {
      $project: {
        quizId: 1,
        pct: {
          $cond: [
            { $gt: ['$maxScore', 0] },
            { $multiply: [{ $divide: [{ $ifNull: ['$scoreOverride', '$score'] }, '$maxScore'] }, 100] },
            0,
          ],
        },
      },
    },
    { $group: { _id: '$quizId', count: { $sum: 1 }, avgPct: { $avg: '$pct' } } },
  ]).exec();
  const attemptMap = new Map(
    attemptAgg.filter((a) => a._id != null).map((a) => [a._id.toString(), a]),
  );

  return {
    items: docs.map((d: IQuizDocument) => {
      const quiz = d.toInstructorQuiz();
      const a = attemptMap.get(d._id.toString());
      quiz.submittedCount = a?.count ?? 0;
      quiz.averagePercentage = a ? Math.round(a.avgPct) : null;
      return quiz;
    }),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
    stats,
  };
}

/** Get a single instructor quiz (ownership already verified by middleware). */
export async function getInstructorQuiz(quiz: IQuizDocument): Promise<InstructorQuiz> {
  return quiz.toInstructorQuiz();
}

/** Edit a quiz (Draft/Scheduled only). Ownership verified by middleware. */
export async function editInstructorQuiz(
  quiz: IQuizDocument,
  input: EditQuizInput,
): Promise<InstructorQuiz> {
  if (!quiz.isEditable()) {
    throw AppError.conflict(
      `Quiz in status '${quiz.status}' cannot be edited. Only Draft or Scheduled quizzes are editable.`,
    );
  }

  if (input.title !== undefined) quiz.title = input.title;
  if (input.description !== undefined) quiz.description = input.description;
  if (input.startTime !== undefined) quiz.startTime = new Date(input.startTime);
  if (input.endTime !== undefined) quiz.endTime = new Date(input.endTime);
  if (input.durationMinutes !== undefined) quiz.durationMinutes = input.durationMinutes;

  await quiz.save();
  return quiz.toInstructorQuiz();
}

/** Cancel a quiz (ownership verified by middleware). */
export async function cancelInstructorQuiz(quiz: IQuizDocument): Promise<InstructorQuiz> {
  if (!quiz.isCancellable()) {
    throw AppError.conflict(
      quiz.status === 'completed'
        ? 'Completed quizzes cannot be retroactively cancelled.'
        : 'Quiz is already cancelled.',
    );
  }
  await quiz.transitionTo('cancelled');
  return quiz.toInstructorQuiz();
}

/** Delete a quiz (Draft only). Ownership verified by middleware. */
export async function deleteInstructorQuiz(quiz: IQuizDocument): Promise<void> {
  if (!quiz.isDeletable()) {
    throw AppError.conflict(
      `Quiz in status '${quiz.status}' cannot be deleted. Only Draft quizzes can be deleted; cancel it instead.`,
    );
  }
  await quiz.deleteOne();
}

/**
 * Publish a quiz: transition Draft -> Scheduled.
 * Enforces readiness pre-conditions: >= 1 question, >= 1 participant,
 * and a valid upcoming schedule window. Returns 409 with a detailed
 * list of missing readiness items if not ready.
 */
export async function publishInstructorQuiz(quiz: IQuizDocument): Promise<InstructorQuiz> {
  if (quiz.status !== 'draft') {
    throw AppError.conflict(
      `Only Draft quizzes can be published. Current status: '${quiz.status}'.`,
    );
  }

  const readiness = quiz.computeReadiness();
  if (!readiness.ready) {
    throw AppError.conflict(
      'Quiz is not ready to publish. Missing requirements:',
      readiness.missing,
    );
  }

  // Homework whose window is already open goes straight to Live.
  const alreadyOpen =
    quiz.startTime instanceof Date && quiz.startTime.getTime() <= Date.now();
  await quiz.transitionTo(quiz.kind === 'homework' && alreadyOpen ? 'live' : 'scheduled');
  return quiz.toInstructorQuiz();
}

/** Fetch a quiz as a plain Quiz object (for admin-compatible views). */
export async function getQuizObject(quiz: IQuizDocument): Promise<Quiz> {
  return quiz.toQuizObject();
}
