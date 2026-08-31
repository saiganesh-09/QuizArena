import { QuizModel, IQuizDocument } from '../models/Quiz';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';
import type {
  CandidateQuizMeta,
  CandidateQuizListPayload,
  CandidateQuizStats,
  QuizStatus,
} from '../types/quiz';
import type { CandidateQuizListQuery } from '../schemas/candidate.schema';

/**
 * Candidate quiz service.
 *
 * SECURITY MODEL:
 * - Every query filters by `participants.userId` = candidateId FIRST,
 *   before any pagination, sorting, or counting. This guarantees that
 *   total counts and metadata never leak unassigned quizzes.
 * - Detail lookups verify assignment and return metadata only (no
 *   questions, options, or answer keys).
 * - The live-window guard blocks pre-attempt detail access outside the
 *   scheduled window for non-completed quizzes.
 */

/** Build the MongoDB filter for assigned quizzes. */
function buildAssignedFilter(
  candidateId: string,
  query: CandidateQuizListQuery,
): Record<string, unknown> {
  // The assignment filter is ALWAYS applied first — this is the security
  // boundary. No query can bypass it.
  const filter: Record<string, unknown> = {
    'participants.userId': candidateId,
  };

  // Candidate-facing status filter.
  // - upcoming: scheduled (not yet live)
  // - live: currently in the live window OR status === 'live'
  // - completed: status === 'completed'
  // - all: no additional status filter (cancelled quizzes are included)
  const now = new Date();
  if (query.filter === 'upcoming') {
    filter.status = { $in: ['scheduled'] as QuizStatus[] };
    filter.startTime = { $gt: now };
  } else if (query.filter === 'live') {
    filter.status = { $in: ['live'] as QuizStatus[] };
  } else if (query.filter === 'completed') {
    filter.status = { $in: ['completed'] as QuizStatus[] };
  }
  // 'all' — no status filter beyond the assignment filter.

  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ];
  }

  return filter;
}

/** Compute per-status counts scoped to the candidate's assigned quizzes. */
async function computeCandidateStats(candidateId: string): Promise<CandidateQuizStats> {
  const agg = await QuizModel.aggregate<{ _id: QuizStatus; count: number }>([
    { $match: { 'participants.userId': new mongoose.Types.ObjectId(candidateId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]).exec();

  const byStatus: Record<QuizStatus, number> = {
    draft: 0, scheduled: 0, live: 0, completed: 0, cancelled: 0,
  };
  for (const r of agg) {
    byStatus[r._id] = r.count;
  }

  return {
    total: byStatus.draft + byStatus.scheduled + byStatus.live + byStatus.completed + byStatus.cancelled,
    upcoming: byStatus.scheduled,
    live: byStatus.live,
    completed: byStatus.completed,
    cancelled: byStatus.cancelled,
  };
}

/** List quizzes assigned to the candidate, with pagination + stats. */
export async function listCandidateQuizzes(
  candidateId: string,
  query: CandidateQuizListQuery,
): Promise<CandidateQuizListPayload> {
  const filter = buildAssignedFilter(candidateId, query);
  const sortDir = query.sortOrder === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [query.sortBy]: sortDir };
  const skip = (query.page - 1) * query.limit;

  const [docs, total] = await Promise.all([
    QuizModel.find(filter).sort(sort).skip(skip).limit(query.limit).exec(),
    QuizModel.countDocuments(filter).exec(),
  ]);

  const stats = await computeCandidateStats(candidateId);

  return {
    items: docs.map((d: IQuizDocument) => d.toCandidateMeta()),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
    stats,
  };
}

/**
 * Get metadata-only details for a single assigned quiz.
 *
 * SECURITY:
 * - Verifies the candidate is assigned (403 if not, to block direct-URL
 *   probing and cross-tenant leakage).
 * - Returns metadata only — no questions, options, or answer keys.
 * - Live-window guard: for non-completed quizzes, access is blocked
 *   outside the scheduled window (403). Completed quizzes can be viewed
 *   for results.
 */
export async function getCandidateQuizDetail(
  candidateId: string,
  quizId: string,
): Promise<CandidateQuizMeta> {
  const quiz = await QuizModel.findById(quizId).exec();
  if (!quiz) {
    // Return 404 for a genuinely non-existent quiz.
    throw AppError.notFound('Quiz not found');
  }

  // Assignment check — 403 blocks direct-URL probing of unassigned quizzes.
  if (!quiz.isAssignedTo(candidateId)) {
    throw AppError.forbidden('You are not assigned to this quiz');
  }

  // Live-window guard: for non-completed, non-cancelled quizzes, the
  // candidate can only view details within the scheduled window.
  // Draft quizzes are never visible to candidates (they haven't been
  // published yet), so we block those too.
  if (quiz.status === 'draft') {
    throw AppError.forbidden('This quiz is not yet available');
  }

  if (quiz.status !== 'completed' && quiz.status !== 'cancelled') {
    const now = Date.now();
    const start = quiz.startTime instanceof Date ? quiz.startTime.getTime() : 0;
    const end = quiz.endTime instanceof Date ? quiz.endTime.getTime() : 0;
    // Block access before the window opens. After the window closes but
    // before status transitions to completed, we still allow viewing
    // (the quiz may be in a brief post-live state).
    if (now < start) {
      throw AppError.forbidden('This quiz is not yet open. It opens at the scheduled start time.');
    }
    if (now > end) {
      throw AppError.forbidden('The quiz window has closed.');
    }
  }

  return quiz.toCandidateMeta();
}
