import { AttemptModel, IAttemptDocument, type AttemptQuestionForPayload } from '../models/Attempt';
import { QuizModel, IQuestionDoc } from '../models/Quiz';
import { AppError } from '../utils/AppError';
import type {
  AttemptPayload,
  ScoredAnswer,
  AnswerSelection,
} from '../types/quiz';
import type { SubmitAnswersInput } from '../schemas/attempt.schema';

/**
 * Attempt service — the examination engine.
 *
 * SECURITY & INTEGRITY:
 * - `startAttempt` verifies: quiz is Live, candidate is assigned, no
 *   existing attempt. Returns questions with correctOptionIds STRIPPED.
 * - `submitAttempt` scores once at submission time, persists the score,
 *   and is idempotent (re-submit returns the existing scored attempt).
 * - Time guard: if submitted after the deadline, it's scored as an
 *   auto-submission with only the answers received (no late answers
 *   accepted beyond the deadline cap).
 * - Concurrent submits are safe: we use findOneAndUpdate with a status
 *   guard so only the first submit scores; subsequent calls return the
 *   already-scored attempt.
 */

/**
 * Convert quiz questions to the payload shape.
 * SECURITY: correctOptionIds is deliberately omitted — correct answers
 * must NEVER leave the server during the attempt phase.
 */
function toAttemptQuestionForPayload(q: IQuestionDoc): AttemptQuestionForPayload {
  return {
    id: q._id.toString(),
    type: q.type,
    text: q.text,
    options: (q.options ?? []).map((o) => ({ id: o.id, text: o.text })),
    points: q.points,
  };
}

/**
 * Start a quiz attempt.
 *
 * Verifies:
 * (a) Quiz is in its Live window (startTime <= now <= endTime)
 * (b) Candidate is assigned to the quiz
 * (c) Candidate hasn't already submitted an attempt
 *
 * If an in-progress attempt already exists (e.g. page refresh), returns
 * it instead of creating a new one. If a submitted attempt exists,
 * returns 409 Conflict.
 */
export async function startAttempt(
  candidateId: string,
  quizId: string,
): Promise<AttemptPayload> {
  // Load the quiz.
  const quiz = await QuizModel.findById(quizId).exec();
  if (!quiz) {
    throw AppError.notFound('Quiz not found');
  }

  // (b) Assignment check — 403 blocks direct-URL probing.
  if (!quiz.isAssignedTo(candidateId)) {
    throw AppError.forbidden('You are not assigned to this quiz');
  }

  // (a) Live-window guard — quiz must be within its scheduled window.
  // Draft quizzes are never available; cancelled quizzes are blocked.
  if (quiz.status === 'draft') {
    throw AppError.forbidden('This quiz is not yet available');
  }
  if (quiz.status === 'cancelled') {
    throw AppError.forbidden('This quiz has been cancelled');
  }
  const now = Date.now();
  const startMs = quiz.startTime instanceof Date ? quiz.startTime.getTime() : 0;
  const endMs = quiz.endTime instanceof Date ? quiz.endTime.getTime() : 0;
  if (now < startMs) {
    throw AppError.forbidden('This quiz has not started yet. Please wait for the scheduled start time.');
  }
  if (now > endMs) {
    throw AppError.forbidden('This quiz window has closed.');
  }

  // (c) Check for an existing attempt.
  const existing = await AttemptModel.findByCandidateAndQuiz(candidateId, quizId);
  if (existing) {
    if (existing.status === 'submitted' || existing.status === 'auto-submitted') {
      // Already submitted — 409 Conflict, return the scored attempt.
      throw AppError.conflict(
        'You have already submitted this quiz.',
        existing.toAttemptPayload(false),
      );
    }
    // In-progress attempt exists (e.g. page refresh) — return it with questions.
    const questions = (quiz.questions ?? []).map(toAttemptQuestionForPayload);
    return existing.toAttemptPayload(true, questions);
  }

  // No existing attempt — create a new one.
  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + quiz.durationMinutes * 60_000);

  // Use findOneAndUpdate with upsert to handle the race condition where
  // two concurrent "start" calls could create duplicate attempts. The
  // unique index on { candidateId, quizId } is the final safety net.
  let attempt: IAttemptDocument | null = null;
  try {
    attempt = await AttemptModel.findOneAndUpdate(
      { candidateId: candidateId, quizId: quizId },
      {
        $setOnInsert: {
          quizId: quiz._id,
          quizTitle: quiz.title,
          candidateId: candidateId,
          status: 'in-progress',
          startedAt,
          submittedAt: null,
          deadlineAt,
          durationMinutes: quiz.durationMinutes,
          answers: [],
          score: 0,
          maxScore: 0,
          autoSubmitted: false,
        },
      },
      { upsert: true, new: true },
    ).exec();
  } catch (err) {
    // If the unique index is violated (concurrent start), fetch the existing.
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      attempt = await AttemptModel.findByCandidateAndQuiz(candidateId, quizId);
    } else {
      throw err;
    }
  }

  if (!attempt) {
    throw AppError.internal('Failed to create or retrieve attempt');
  }

  // If the attempt was already submitted (edge case), return 409.
  if (attempt.status === 'submitted' || attempt.status === 'auto-submitted') {
    throw AppError.conflict(
      'You have already submitted this quiz.',
      attempt.toAttemptPayload(false),
    );
  }

  const questions = (quiz.questions ?? []).map(toAttemptQuestionForPayload);
  return attempt.toAttemptPayload(true, questions);
}

/**
 * Score a single answer against the correct options.
 *
 * - Single-Choice / True-False: full marks if the single selected
 *   option matches the correct option, zero otherwise.
 * - Multi-Select: full marks ONLY if the selected option set exactly
 *   matches the correct option set. No partial marks.
 * - Unanswered (empty selectedOptionIds): zero marks.
 */
function scoreAnswer(
  question: IQuestionDoc,
  selectedOptionIds: string[],
): { awardedPoints: number; isCorrect: boolean } {
  const correctIds = new Set(question.correctOptionIds ?? []);
  const selectedIds = new Set(selectedOptionIds);

  // Unanswered → zero.
  if (selectedIds.size === 0) {
    return { awardedPoints: 0, isCorrect: false };
  }

  // For single-choice and true-false: exactly one correct option.
  if (question.type === 'single-choice' || question.type === 'true-false') {
    if (selectedIds.size === 1 && correctIds.size === 1) {
      const selected = selectedIds.values().next().value as string;
      const correct = correctIds.values().next().value as string;
      if (selected === correct) {
        return { awardedPoints: question.points, isCorrect: true };
      }
    }
    return { awardedPoints: 0, isCorrect: false };
  }

  // For multi-select: exact set match required.
  if (selectedIds.size !== correctIds.size) {
    return { awardedPoints: 0, isCorrect: false };
  }
  for (const id of selectedIds) {
    if (!correctIds.has(id)) {
      return { awardedPoints: 0, isCorrect: false };
    }
  }
  return { awardedPoints: question.points, isCorrect: true };
}

/**
 * Submit a quiz attempt.
 *
 * - Idempotent: if already submitted, returns the existing scored
 *   attempt without re-scoring.
 * - Time guard: if submitted after the deadline, marks as auto-submitted
 *   and caps the submission timestamp at the deadline.
 * - Scores once at submission time and persists the score.
 * - Concurrent submits are safe: findOneAndUpdate with a status guard
 *   ensures only the first submit scores.
 */
export async function submitAttempt(
  candidateId: string,
  quizId: string,
  input: SubmitAnswersInput,
): Promise<AttemptPayload> {
  // Load the attempt.
  const attempt = await AttemptModel.findByCandidateAndQuiz(candidateId, quizId);
  if (!attempt) {
    throw AppError.notFound('No attempt found for this quiz. Start the quiz first.');
  }

  // Idempotent: if already submitted, return the existing scored attempt.
  if (attempt.status === 'submitted' || attempt.status === 'auto-submitted') {
    return attempt.toAttemptPayload(false);
  }

  // Load the quiz to access questions and correct answers.
  const quiz = await QuizModel.findById(quizId).exec();
  if (!quiz) {
    throw AppError.notFound('Quiz not found');
  }

  // Time guard: determine if this is an auto-submission (past deadline).
  const now = Date.now();
  const deadlineMs = attempt.deadlineAt instanceof Date ? attempt.deadlineAt.getTime() : 0;
  const isLate = now > deadlineMs;
  const submittedAt = isLate ? attempt.deadlineAt : new Date(now);
  const autoSubmitted = isLate;

  // Build a map of questionId -> question doc for quick lookup.
  const questionMap = new Map<string, IQuestionDoc>();
  for (const q of quiz.questions ?? []) {
    questionMap.set(q._id.toString(), q);
  }

  // Build a map of the submitted answers by questionId.
  const submittedMap = new Map<string, AnswerSelection>();
  for (const a of input.answers) {
    submittedMap.set(a.questionId, a);
  }

  // Score every question in the quiz (unanswered ones score zero).
  const scoredAnswers: ScoredAnswer[] = [];
  let totalScore = 0;
  let maxScore = 0;

  for (const q of quiz.questions ?? []) {
    const qid = q._id.toString();
    const maxPoints = q.points;
    maxScore += maxPoints;

    const submitted = submittedMap.get(qid);
    const selectedOptionIds = submitted?.selectedOptionIds ?? [];

    // Validate that selectedOptionIds reference real options.
    const validOptionIds = new Set((q.options ?? []).map((o) => o.id));
    const cleanSelected = selectedOptionIds.filter((id) => validOptionIds.has(id));

    const { awardedPoints, isCorrect } = scoreAnswer(q, cleanSelected);
    totalScore += awardedPoints;

    scoredAnswers.push({
      questionId: qid,
      selectedOptionIds: cleanSelected,
      awardedPoints,
      maxPoints,
      isCorrect,
    });
  }

  // Atomic update: only score if the attempt is still in-progress.
  // This handles concurrent submits — the first one to execute this
  // query wins; the second finds status != 'in-progress' and returns
  // the already-scored attempt.
  const updated = await AttemptModel.findOneAndUpdate(
    { _id: attempt._id, status: 'in-progress' },
    {
      $set: {
        status: autoSubmitted ? 'auto-submitted' : 'submitted',
        submittedAt,
        answers: scoredAnswers.map((a) => ({
          questionId: a.questionId,
          selectedOptionIds: a.selectedOptionIds,
          awardedPoints: a.awardedPoints,
          maxPoints: a.maxPoints,
          isCorrect: a.isCorrect,
        })),
        score: totalScore,
        maxScore,
        autoSubmitted,
      },
    },
    { new: true },
  ).exec();

  if (!updated) {
    // Another concurrent submit won the race — fetch the scored attempt.
    const existing = await AttemptModel.findByCandidateAndQuiz(candidateId, quizId);
    if (existing && (existing.status === 'submitted' || existing.status === 'auto-submitted')) {
      return existing.toAttemptPayload(false);
    }
    throw AppError.internal('Failed to submit attempt due to a concurrent modification');
  }

  return updated.toAttemptPayload(false);
}

/**
 * Get an existing attempt (for post-submit review or resuming an
 * in-progress attempt). Does NOT return questions if the attempt is
 * already submitted.
 */
export async function getAttempt(
  candidateId: string,
  quizId: string,
): Promise<AttemptPayload> {
  const attempt = await AttemptModel.findByCandidateAndQuiz(candidateId, quizId);
  if (!attempt) {
    throw AppError.notFound('No attempt found for this quiz.');
  }

  // If in-progress, include questions (stripped of correct answers).
  if (attempt.status === 'in-progress') {
    const quiz = await QuizModel.findById(quizId).exec();
    if (!quiz) {
      throw AppError.notFound('Quiz not found');
    }
    const questions = (quiz.questions ?? []).map(toAttemptQuestionForPayload);
    return attempt.toAttemptPayload(true, questions);
  }

  // Submitted — no questions, just scored answers.
  return attempt.toAttemptPayload(false);
}
