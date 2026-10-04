import mongoose from 'mongoose';
import { AttemptModel } from '../models/Attempt';
import { QuizModel, IQuestionDoc } from '../models/Quiz';
import { AppError } from '../utils/AppError';
import type {
  CandidateResult,
  CandidatePerformance,
  CandidateScorePoint,
  QuestionReview,
  AttemptStatus,
} from '../types/quiz';

/**
 * Candidate result service.
 *
 * SECURITY & PRIVACY:
 * - Returns ONLY the calling candidate's own attempt. No other
 *   candidate's data is ever included.
 * - Correct answers are revealed ONLY after the candidate has submitted
 *   their attempt (status === 'submitted' || 'auto-submitted').
 * - If the attempt is still in-progress, returns 409 "not submitted".
 * - If no attempt exists, returns 404.
 *
 * DETERMINISM:
 * - Score and maxScore are read from the stored attempt document.
 *   They are NEVER re-derived on read.
 */

/**
 * Get the candidate's own result for a quiz, including correct answers.
 *
 * @param candidateId  The authenticated candidate's user ID.
 * @param quizId       The quiz ID from the route params.
 */
export async function getCandidateResult(
  candidateId: string,
  quizId: string,
): Promise<CandidateResult> {
  // Load the attempt — only the calling candidate's own.
  const attempt = await AttemptModel.findByCandidateAndQuiz(candidateId, quizId);
  if (!attempt) {
    throw AppError.notFound('No attempt found for this quiz.');
  }

  // Correct answers are revealed ONLY after submission.
  if (attempt.status === 'in-progress') {
    throw AppError.conflict('You have not submitted this quiz yet. Results are available only after submission.');
  }

  // Load the quiz to get question texts, options, and correct answers.
  // This is the ONLY place correct answers are read for a candidate.
  const quiz = await QuizModel.findById(quizId).exec();
  if (!quiz) {
    throw AppError.notFound('Quiz not found.');
  }

  // Build a map of questionId -> question doc for quick lookup.
  const questionMap = new Map<string, IQuestionDoc>();
  for (const q of quiz.questions ?? []) {
    questionMap.set(q._id.toString(), q);
  }

  // Build a map of the attempt's scored answers by questionId.
  const answerMap = new Map<string, { selectedOptionIds: string[]; awardedPoints: number; isCorrect: boolean }>();
  for (const a of attempt.answers ?? []) {
    answerMap.set(a.questionId.toString(), {
      selectedOptionIds: a.selectedOptionIds ?? [],
      awardedPoints: a.awardedPoints,
      isCorrect: a.isCorrect,
    });
  }

  // Build the per-question review with correct answers revealed.
  const questions: QuestionReview[] = (quiz.questions ?? []).map((q) => {
    const qid = q._id.toString();
    const scored = answerMap.get(qid);
    return {
      questionId: qid,
      questionText: q.text,
      questionType: q.type,
      points: q.points,
      options: (q.options ?? []).map((o) => ({ id: o.id, text: o.text })),
      selectedOptionIds: scored?.selectedOptionIds ?? [],
      correctOptionIds: q.correctOptionIds ?? [],
      awardedPoints: scored?.awardedPoints ?? 0,
      isCorrect: scored?.isCorrect ?? false,
    };
  });

  // Calculate derived display values from STORED scores (not re-graded).
  // An instructor's manual override supersedes the auto-graded score.
  const correctCount = (attempt.answers ?? []).filter((a) => a.isCorrect).length;
  const totalQuestions = (quiz.questions ?? []).length;
  const score = attempt.scoreOverride ?? attempt.score;
  const percentage = attempt.maxScore > 0
    ? Math.round((score / attempt.maxScore) * 100)
    : 0;

  // Time taken: from startedAt to submittedAt (clamped if null).
  const startedMs = attempt.startedAt instanceof Date ? attempt.startedAt.getTime() : 0;
  const submittedMs = attempt.submittedAt instanceof Date ? attempt.submittedAt.getTime() : 0;
  const timeTakenSeconds = Math.max(0, Math.round((submittedMs - startedMs) / 1000));

  return {
    attemptId: attempt._id.toString(),
    quizId: attempt.quizId.toString(),
    quizTitle: attempt.quizTitle,
    status: attempt.status,
    score,
    maxScore: attempt.maxScore,
    percentage,
    correctCount,
    totalQuestions,
    timeTakenSeconds,
    startedAt: attempt.startedAt instanceof Date ? attempt.startedAt.toISOString() : '',
    submittedAt: attempt.submittedAt instanceof Date ? attempt.submittedAt.toISOString() : null,
    autoSubmitted: attempt.autoSubmitted,
    teacherRemark: attempt.teacherRemark ?? '',
    questions,
  };
}

/**
 * Get the calling candidate's own performance summary across all their
 * submitted attempts.
 *
 * SECURITY & PRIVACY:
 * - Only reads the calling candidate's own attempt documents.
 * - `latestRank` compares their stored score to the COUNT of higher
 *   scores on the same quiz — an aggregate position, never another
 *   student's data.
 */
export async function getCandidatePerformance(
  candidateId: string,
): Promise<CandidatePerformance> {
  const attempts = await AttemptModel.find({
    candidateId: new mongoose.Types.ObjectId(candidateId),
    status: { $in: ['submitted', 'auto-submitted'] as AttemptStatus[] },
  }).exec();

  const points: CandidateScorePoint[] = attempts
    .slice()
    .sort((a, b) => {
      const ta = a.submittedAt instanceof Date ? a.submittedAt.getTime() : 0;
      const tb = b.submittedAt instanceof Date ? b.submittedAt.getTime() : 0;
      return ta - tb;
    })
    .map((a) => {
      const score = a.scoreOverride ?? a.score;
      return {
        quizId: a.quizId.toString(),
        quizTitle: a.quizTitle,
        percentage: a.maxScore > 0 ? Math.round((score / a.maxScore) * 100) : 0,
        submittedAt: a.submittedAt instanceof Date ? a.submittedAt.toISOString() : null,
      };
    });

  const attemptsTaken = points.length;
  const percentages = points.map((p) => p.percentage);
  const averagePercentage = attemptsTaken > 0
    ? Math.round(percentages.reduce((s, p) => s + p, 0) / attemptsTaken)
    : 0;

  let bestPercentage = 0;
  let bestQuizTitle: string | null = null;
  for (const p of points) {
    if (p.percentage >= bestPercentage) {
      bestPercentage = p.percentage;
      bestQuizTitle = p.quizTitle;
    }
  }

  // Rank within the most recent quiz's cohort (competition ranking).
  let latestRank: number | null = null;
  let latestRankOutOf: number | null = null;
  let latestQuizTitle: string | null = null;
  const latest = attempts.reduce<typeof attempts[number] | null>((acc, a) => {
    const t = a.submittedAt instanceof Date ? a.submittedAt.getTime() : 0;
    const bt = acc?.submittedAt instanceof Date ? acc.submittedAt.getTime() : 0;
    return acc === null || t > bt ? a : acc;
  }, null);
  if (latest) {
    const cohortFilter = {
      quizId: latest.quizId,
      status: { $in: ['submitted', 'auto-submitted'] as AttemptStatus[] },
    };
    const [higher, total] = await Promise.all([
      // Rank uses effective scores: a stored override supersedes the raw score.
      AttemptModel.countDocuments({
        ...cohortFilter,
        $expr: { $gt: [{ $ifNull: ['$scoreOverride', '$score'] }, latest.scoreOverride ?? latest.score] },
      }).exec(),
      AttemptModel.countDocuments(cohortFilter).exec(),
    ]);
    latestRank = higher + 1;
    latestRankOutOf = total;
    latestQuizTitle = latest.quizTitle;
  }

  return {
    attemptsTaken,
    averagePercentage,
    bestPercentage,
    bestQuizTitle,
    latestRank,
    latestRankOutOf,
    latestQuizTitle,
    trend: points,
  };
}
