import { QuizModel } from '../models/Quiz';
import { AttemptModel } from '../models/Attempt';
import { User } from '../models/User';
import type {
  AdminAnalytics,
  QuizStatus,
  QuizStatusStats,
} from '../types/quiz';
import type { AdminAnalyticsQuery } from '../schemas/result.schema';

/**
 * Admin analytics service.
 *
 * SECURITY:
 * - Only callable by admin (enforced by route guard: requireRole('admin')).
 * - Returns aggregated, platform-wide data — no individual candidate
 *   answers or scores are exposed.
 *
 * DETERMINISM:
 * - All scores are read from stored attempt fields. Never re-derived.
 * - Quiz counts are grouped by status with a stable, exhaustive set of
 *   statuses (every status key is always present in the result).
 *
 * FILTERS:
 * - Optional date range filters on quiz `startTime`.
 * - Optional instructor filter on quiz `createdBy`.
 */

/** All possible quiz statuses, used to ensure the stats object is exhaustive. */
const ALL_STATUSES: QuizStatus[] = ['draft', 'scheduled', 'live', 'completed', 'cancelled'];

/**
 * Get platform-wide analytics summary.
 *
 * @param query  Optional date range and instructor filters.
 */
export async function getAdminAnalytics(query: AdminAnalyticsQuery): Promise<AdminAnalytics> {
  // Build the quiz filter from optional params.
  const quizFilter: Record<string, unknown> = {};
  if (query.startDate || query.endDate) {
    const dateRange: Record<string, unknown> = {};
    if (query.startDate) dateRange.$gte = new Date(query.startDate);
    if (query.endDate) dateRange.$lte = new Date(query.endDate);
    quizFilter.startTime = dateRange;
  }
  if (query.instructorId) {
    quizFilter.createdBy = query.instructorId;
  }

  // Count quizzes by status (aggregation pipeline).
  const statusAgg = await QuizModel.aggregate<{ _id: QuizStatus; count: number }>([
    { $match: quizFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]).exec();

  // Build exhaustive stats object (every status key present).
  const quizzesByStatus: QuizStatusStats = {
    draft: 0,
    scheduled: 0,
    live: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  };
  for (const s of statusAgg) {
    if (s._id && s._id in quizzesByStatus) {
      quizzesByStatus[s._id] = s.count;
    }
  }
  quizzesByStatus.total = ALL_STATUSES.reduce((sum, s) => sum + quizzesByStatus[s], 0);

  // Count users by role.
  const totalCandidates = await User.countDocuments({ role: 'candidate' }).exec();
  const totalInstructors = await User.countDocuments({ role: 'instructor' }).exec();

  // Count attempts — total and completed.
  // If a date range or instructor filter is applied, we scope attempts to
  // quizzes matching the filter. Otherwise, it's platform-wide.
  let attemptFilter: Record<string, unknown> = {};
  if (Object.keys(quizFilter).length > 0) {
    // Get matching quiz IDs, then filter attempts by those quiz IDs.
    const matchingQuizzes = await QuizModel.find(quizFilter).select('_id').exec();
    const quizIds = matchingQuizzes.map((q) => q._id);
    attemptFilter = { quizId: { $in: quizIds } };
  }

  const totalAttempts = await AttemptModel.countDocuments(attemptFilter).exec();
  const completedFilter = { ...attemptFilter, status: { $in: ['submitted', 'auto-submitted'] } };
  const totalCompletedAttempts = await AttemptModel.countDocuments(completedFilter).exec();

  // Average score across all completed attempts (from stored scores).
  const scoreAgg = await AttemptModel.aggregate<{ avgScore: number }>([
    { $match: completedFilter },
    { $group: { _id: null, avgScore: { $avg: '$score' } } },
  ]).exec();
  const averageScore = scoreAgg.length > 0
    ? Math.round((scoreAgg[0].avgScore ?? 0) * 100) / 100
    : 0;

  const attemptCompletionRate = totalAttempts > 0
    ? Math.round((totalCompletedAttempts / totalAttempts) * 100)
    : 0;

  // Count quizzes matching the filter.
  const quizCount = ALL_STATUSES.reduce((sum, s) => sum + quizzesByStatus[s], 0);

  return {
    quizzesByStatus,
    totalCandidates,
    totalInstructors,
    totalAttempts,
    totalCompletedAttempts,
    attemptCompletionRate,
    averageScore,
    quizCount,
  };
}
