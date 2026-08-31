import { AttemptModel } from '../models/Attempt';
import { QuizModel, IQuestionDoc } from '../models/Quiz';
import { AppError } from '../utils/AppError';
import type { CandidateResult, QuestionReview } from '../types/quiz';

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
  const correctCount = (attempt.answers ?? []).filter((a) => a.isCorrect).length;
  const totalQuestions = (quiz.questions ?? []).length;
  const percentage = attempt.maxScore > 0
    ? Math.round((attempt.score / attempt.maxScore) * 100)
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
    score: attempt.score,
    maxScore: attempt.maxScore,
    percentage,
    correctCount,
    totalQuestions,
    timeTakenSeconds,
    startedAt: attempt.startedAt instanceof Date ? attempt.startedAt.toISOString() : '',
    submittedAt: attempt.submittedAt instanceof Date ? attempt.submittedAt.toISOString() : null,
    autoSubmitted: attempt.autoSubmitted,
    questions,
  };
}
