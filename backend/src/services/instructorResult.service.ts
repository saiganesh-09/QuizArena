import { AttemptModel } from '../models/Attempt';
import { QuizModel } from '../models/Quiz';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import type {
  InstructorQuizResults,
  CandidateResultRow,
  ScoreBucket,
  AttemptStatus,
} from '../types/quiz';
import type { InstructorResultsQuery } from '../schemas/result.schema';

/**
 * Instructor results service.
 *
 * SECURITY:
 * - Enforces quiz ownership: returns 403 if the instructor doesn't own
 *   the quiz (cross-tenant leakage protection).
 * - Only returns data for the specified quiz — no other quiz's data.
 *
 * DETERMINISM:
 * - All scores are read from the stored `score` and `maxScore` fields on
 *   the attempt documents. Never re-graded on read.
 * - Sort orders use stable tiebreakers (candidateId as final tiebreaker).
 */

/** Build 5 score-distribution buckets from 0-100%. */
function buildScoreDistribution(attempts: { score: number; maxScore: number }[]): ScoreBucket[] {
  const buckets: ScoreBucket[] = [
    { label: '0-20%', min: 0, max: 20, count: 0 },
    { label: '21-40%', min: 21, max: 40, count: 0 },
    { label: '41-60%', min: 41, max: 60, count: 0 },
    { label: '61-80%', min: 61, max: 80, count: 0 },
    { label: '81-100%', min: 81, max: 100, count: 0 },
  ];

  for (const a of attempts) {
    const pct = a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0;
    if (pct <= 20) buckets[0].count++;
    else if (pct <= 40) buckets[1].count++;
    else if (pct <= 60) buckets[2].count++;
    else if (pct <= 80) buckets[3].count++;
    else buckets[4].count++;
  }

  return buckets;
}

/** Compute time taken in seconds from an attempt's stored timestamps. */
function computeTimeTaken(startedAt: unknown, submittedAt: unknown): number {
  const s = startedAt instanceof Date ? startedAt.getTime() : 0;
  const e = submittedAt instanceof Date ? submittedAt.getTime() : 0;
  return Math.max(0, Math.round((e - s) / 1000));
}

/**
 * Get aggregated results for a quiz, scoped to the calling instructor.
 *
 * @param instructorId  The authenticated instructor's user ID.
 * @param quizId        The quiz ID from the route params.
 * @param query         Pagination + search + sort params.
 */
export async function getInstructorQuizResults(
  instructorId: string,
  quizId: string,
  query: InstructorResultsQuery,
): Promise<InstructorQuizResults> {
  // Load the quiz and enforce ownership.
  const quiz = await QuizModel.findById(quizId).exec();
  if (!quiz) {
    throw AppError.notFound('Quiz not found.');
  }
  if (!quiz.isOwnedBy(instructorId)) {
    // 403 blocks cross-tenant probing (not 404, to be explicit about ownership).
    throw AppError.forbidden('You do not own this quiz.');
  }

  const totalAssigned = (quiz.participants ?? []).length;

  // Load ALL submitted attempts for this quiz (for aggregation metrics).
  // We need all of them for accurate averages/distribution, not just the
  // current page. Pagination is applied to the candidate list only.
  const allAttempts = await AttemptModel.find({
    quizId: quiz._id,
    status: { $in: ['submitted', 'auto-submitted'] as AttemptStatus[] },
  }).exec();

  // Aggregate metrics from STORED scores (never re-derived).
  const totalCompleted = allAttempts.length;
  const scores = allAttempts.map((a) => a.score);
  const sumScore = scores.reduce((acc, s) => acc + s, 0);
  const averageScore = totalCompleted > 0 ? Math.round((sumScore / totalCompleted) * 100) / 100 : 0;
  const highestScore = totalCompleted > 0 ? Math.max(...scores) : 0;
  const lowestScore = totalCompleted > 0 ? Math.min(...scores) : 0;
  const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
  const scoreDistribution = buildScoreDistribution(allAttempts);

  // Build candidate result rows with user info (join with User collection).
  // We fetch all matching users in one query for efficiency.
  const candidateIds = allAttempts.map((a) => a.candidateId);
  const users = await User.find({ _id: { $in: candidateIds } }).exec();
  const userMap = new Map<string, { name: string; email: string }>();
  for (const u of users) {
    userMap.set(u._id.toString(), { name: u.name, email: u.email });
  }

  // Build the full candidate rows list (before pagination).
  const allRows: CandidateResultRow[] = allAttempts.map((a) => {
    const user = userMap.get(a.candidateId.toString());
    const percentage = a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0;
    return {
      attemptId: a._id.toString(),
      candidateId: a.candidateId.toString(),
      candidateName: user?.name ?? 'Unknown',
      candidateEmail: user?.email ?? '',
      score: a.score,
      maxScore: a.maxScore,
      percentage,
      timeTakenSeconds: computeTimeTaken(a.startedAt, a.submittedAt),
      status: a.status,
      submittedAt: a.submittedAt instanceof Date ? a.submittedAt.toISOString() : null,
    };
  });

  // Apply text search filter by candidate name.
  const searchTrim = query.search.trim();
  let filteredRows = allRows;
  if (searchTrim) {
    const lower = searchTrim.toLowerCase();
    filteredRows = allRows.filter(
      (r) =>
        r.candidateName.toLowerCase().includes(lower) ||
        r.candidateEmail.toLowerCase().includes(lower),
    );
  }

  // Apply sorting with stable tiebreaker (candidateId).
  const sortMultiplier = query.sortOrder === 'asc' ? 1 : -1;
  const sortBy = query.sortBy;
  filteredRows.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'score':
        cmp = a.score - b.score;
        break;
      case 'timeTakenSeconds':
        cmp = a.timeTakenSeconds - b.timeTakenSeconds;
        break;
      case 'submittedAt':
        cmp = (a.submittedAt ?? '').localeCompare(b.submittedAt ?? '');
        break;
      case 'candidateName':
        cmp = a.candidateName.localeCompare(b.candidateName);
        break;
      default:
        cmp = a.score - b.score;
        break;
    }
    if (cmp === 0) {
      // Stable tiebreaker: candidateId (deterministic).
      return a.candidateId.localeCompare(b.candidateId) * sortMultiplier;
    }
    return cmp * sortMultiplier;
  });

  // Apply pagination.
  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, totalPages);
  const startIdx = (page - 1) * query.limit;
  const pagedRows = filteredRows.slice(startIdx, startIdx + query.limit);

  return {
    quizId: quiz._id.toString(),
    quizTitle: quiz.title,
    quizStatus: quiz.status,
    totalAssigned,
    totalCompleted,
    completionRate,
    averageScore,
    highestScore,
    lowestScore,
    scoreDistribution,
    candidates: pagedRows,
    total,
    page,
    limit: query.limit,
    totalPages,
  };
}
