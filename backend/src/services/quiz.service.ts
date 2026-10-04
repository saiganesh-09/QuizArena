import mongoose from 'mongoose';
import { QuizModel, IQuizDocument } from '../models/Quiz';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import type { Quiz, QuizListPayload, QuizStatusStats } from '../types/quiz';
import type { CreateQuizInput, EditQuizInput, AssignInstructorInput } from '../schemas/quiz.schema';
import type { ListQuizzesQuery } from '../schemas/admin.schema';
import type { QuizStatus } from '../types/quiz';

/**
 * Quiz admin service: encapsulates create/edit/delete/cancel/list/assign
 * business logic with strict lifecycle enforcement.
 */

/** Build the MongoDB filter from quiz list query params. */
function buildQuizFilter(query: ListQuizzesQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ];
  }
  return filter;
}

/** Compute quiz status statistics for dashboard charts. */
async function computeQuizStats(): Promise<QuizStatusStats> {
  const agg = await QuizModel.aggregate<{ _id: QuizStatus; count: number }>([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]).exec();

  const stats: QuizStatusStats = {
    draft: 0,
    scheduled: 0,
    live: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  };
  for (const r of agg) {
    stats[r._id] = r.count;
    stats.total += r.count;
  }
  return stats;
}

/** Create a new quiz in Draft status. Optionally self-assign an instructor. */
export async function createQuiz(
  input: CreateQuizInput,
  createdBy: string,
  ownerInstructor?: { instructorId: string; instructorEmail: string },
): Promise<Quiz> {
  const quiz = await QuizModel.create({
    title: input.title,
    description: input.description ?? '',
    status: 'draft', // always starts as Draft
    kind: input.kind ?? 'quiz',
    startTime: new Date(input.startTime),
    endTime: new Date(input.endTime),
    durationMinutes: input.durationMinutes,
    level: input.level ?? 'Beginner',
    difficulty: input.difficulty ?? 'Easy',
    passingPoints: input.passingPoints ?? 0,
    createdBy,
    instructors: ownerInstructor
      ? [{
          instructorId: new mongoose.Types.ObjectId(ownerInstructor.instructorId),
          instructorEmail: ownerInstructor.instructorEmail,
          assignedAt: new Date(),
        }]
      : [],
    cancelledAt: null,
  });
  return quiz.toQuizObject();
}

/** Edit a quiz. Only Draft or Scheduled quizzes are editable (409 otherwise). */
export async function editQuiz(id: string, input: EditQuizInput): Promise<Quiz> {
  const quiz = await QuizModel.findByIdOrThrow(id);

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
  if (input.level !== undefined) quiz.level = input.level;
  if (input.difficulty !== undefined) quiz.difficulty = input.difficulty;
  if (input.passingPoints !== undefined) quiz.passingPoints = input.passingPoints;

  // The pre('validate') hook enforces endTime > startTime.
  await quiz.save();
  return quiz.toQuizObject();
}

/** Delete a quiz. Only Draft quizzes can be deleted (409 otherwise). */
export async function deleteQuiz(id: string): Promise<void> {
  const quiz = await QuizModel.findByIdOrThrow(id);
  if (!quiz.isDeletable()) {
    throw AppError.conflict(
      `Quiz in status '${quiz.status}' cannot be deleted. Only Draft quizzes can be deleted; cancel it instead.`,
    );
  }
  await quiz.deleteOne();
}

/** Cancel a quiz. Reachable from Draft, Scheduled, or Live. Completed cannot be cancelled. */
export async function cancelQuiz(id: string): Promise<Quiz> {
  const quiz = await QuizModel.findByIdOrThrow(id);
  if (!quiz.isCancellable()) {
    throw AppError.conflict(
      quiz.status === 'completed'
        ? 'Completed quizzes cannot be retroactively cancelled.'
        : 'Quiz is already cancelled.',
    );
  }
  await quiz.transitionTo('cancelled');
  return quiz.toQuizObject();
}

/** Assign an instructor by email. The user must exist and hold the instructor role. */
export async function assignInstructor(
  quizId: string,
  input: AssignInstructorInput,
): Promise<Quiz> {
  const quiz = await QuizModel.findByIdOrThrow(quizId);

  // Look up the instructor by email (without selecting password).
  const instructor = await User.findOne({ email: input.email })
    .select('-password')
    .lean()
    .exec();

  if (!instructor) {
    throw AppError.notFound('No user found with that email');
  }
  if (instructor.role !== 'instructor') {
    throw AppError.badRequest(
      `User ${input.email} is not an instructor (role: ${instructor.role}).`,
    );
  }

  // Prevent duplicate assignments.
  const alreadyAssigned = (quiz.instructors ?? []).some(
    (a) => a.instructorId.toString() === instructor._id.toString(),
  );
  if (alreadyAssigned) {
    throw AppError.conflict('This instructor is already assigned to the quiz.');
  }

  quiz.instructors.push({
    instructorId: instructor._id as unknown as import('mongoose').Types.ObjectId,
    instructorEmail: instructor.email as string,
    assignedAt: new Date(),
  });
  await quiz.save();
  return quiz.toQuizObject();
}

/** List quizzes with pagination, filtering, sorting, search, and stats. */
export async function listQuizzes(query: ListQuizzesQuery): Promise<QuizListPayload> {
  const filter = buildQuizFilter(query);
  const sortDir = query.sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [query.sortBy]: sortDir };
  const skip = (query.page - 1) * query.limit;

  const [docs, total] = await Promise.all([
    QuizModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .exec(),
    QuizModel.countDocuments(filter).exec(),
  ]);

  const stats = await computeQuizStats();

  return {
    items: docs.map((d: IQuizDocument) => d.toQuizObject()),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
    stats,
  };
}

/** Fetch a single quiz by id (admin view). */
export async function getQuiz(id: string): Promise<Quiz> {
  const quiz = await QuizModel.findByIdOrThrow(id);
  return quiz.toQuizObject();
}
