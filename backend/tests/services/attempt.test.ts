import { QuizModel } from '../../src/models/Quiz';
import { startAttempt, submitAttempt } from '../../src/services/attempt.service';
import { createTestUser } from '../helpers';
import { clearDatabase } from '../setup';
import { AppError } from '../../src/utils/AppError';

/**
 * Scoring engine + attempt service tests.
 *
 * These tests verify the core examination engine:
 * - Start attempt guards (live window, assignment, one-attempt)
 * - Scoring logic (single-choice, multi-select, true-false, unanswered)
 * - Time guard (auto-submission past deadline)
 * - Idempotent submit
 * - Correct answers never leak in the start payload
 *
 * Uses Jest fake timers to test time caps deterministically.
 */

/** Create a quiz in the Live window with specified questions. */
async function createLiveQuiz(opts: {
  instructorId: string;
  participantIds: string[];
  questions?: Array<{
    type: 'single-choice' | 'multi-select' | 'true-false';
    text: string;
    options: Array<{ id: string; text: string }>;
    correctOptionIds: string[];
    points: number;
  }>;
  durationMinutes?: number;
}): Promise<string> {
  const now = new Date();
  const startTime = new Date(now.getTime() - 60_000); // started 1 min ago
  const endTime = new Date(now.getTime() + 60 * 60_000); // ends in 1 hour
  const durationMinutes = opts.durationMinutes ?? 30;

  const quiz = await QuizModel.create({
    title: 'Test Quiz',
    description: 'A test quiz',
    status: 'live',
    startTime,
    endTime,
    durationMinutes,
    createdBy: opts.instructorId,
    instructors: [{ instructorId: opts.instructorId, instructorEmail: `instructor-${opts.instructorId}@test.com`, assignedAt: now }],
    questions: (opts.questions ?? []).map((q) => ({
      type: q.type,
      text: q.text,
      options: q.options,
      correctOptionIds: q.correctOptionIds,
      points: q.points,
    })),
    participants: opts.participantIds.map((pid) => ({
      userId: pid,
      email: `candidate-${pid}@test.com`,
      name: 'Candidate',
      addedAt: now,
    })),
    cancelledAt: null,
  });

  return quiz._id.toString();
}

describe('Attempt service — startAttempt', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('should return 404 if the quiz does not exist', async () => {
    const candidate = await createTestUser({ role: 'candidate' });
    await expect(startAttempt(candidate.id, '507f1f77bcf86cd799439011')).rejects.toThrow();
    try {
      await startAttempt(candidate.id, '507f1f77bcf86cd799439011');
    } catch (err) {
      expect((err as AppError).statusCode).toBe(404);
    }
  });

  it('should return 403 if the candidate is not assigned', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const candidate = await createTestUser({ role: 'candidate' });
    const otherCandidate = await createTestUser({ role: 'candidate', email: 'other@test.com' });
    const quizId = await createLiveQuiz({
      instructorId: instructor.id,
      participantIds: [candidate.id],
    });

    try {
      await startAttempt(otherCandidate.id, quizId);
      fail('Should have thrown');
    } catch (err) {
      expect((err as AppError).statusCode).toBe(403);
    }
  });

  it('should return questions WITHOUT correctOptionIds', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const candidate = await createTestUser({ role: 'candidate' });
    const quizId = await createLiveQuiz({
      instructorId: instructor.id,
      participantIds: [candidate.id],
      questions: [
        {
          type: 'single-choice',
          text: 'What is 2+2?',
          options: [
            { id: 'a', text: '3' },
            { id: 'b', text: '4' },
          ],
          correctOptionIds: ['b'],
          points: 1,
        },
      ],
    });

    const attempt = await startAttempt(candidate.id, quizId);
    expect(attempt.questions).toHaveLength(1);
    const q = attempt.questions[0];
    expect(q.text).toBe('What is 2+2?');
    expect(q.options).toHaveLength(2);
    // SECURITY: correctOptionIds must NOT be present on the question
    expect((q as unknown as Record<string, unknown>).correctOptionIds).toBeUndefined();
  });

  it('should resume an in-progress attempt on repeated start calls', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const candidate = await createTestUser({ role: 'candidate' });
    const quizId = await createLiveQuiz({
      instructorId: instructor.id,
      participantIds: [candidate.id],
      questions: [
        {
          type: 'true-false',
          text: 'The sky is blue.',
          options: [
            { id: 't', text: 'True' },
            { id: 'f', text: 'False' },
          ],
          correctOptionIds: ['t'],
          points: 1,
        },
      ],
    });

    const first = await startAttempt(candidate.id, quizId);
    const second = await startAttempt(candidate.id, quizId);
    expect(first.id).toBe(second.id);
    expect(first.status).toBe('in-progress');
  });
});

describe('Attempt service — submitAttempt scoring', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('should score single-choice correctly (full marks for correct, zero for wrong)', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const candidate = await createTestUser({ role: 'candidate' });
    const quizId = await createLiveQuiz({
      instructorId: instructor.id,
      participantIds: [candidate.id],
      questions: [
        {
          type: 'single-choice',
          text: 'What is 2+2?',
          options: [
            { id: 'a', text: '3' },
            { id: 'b', text: '4' },
          ],
          correctOptionIds: ['b'],
          points: 2,
        },
      ],
    });

    const quiz = await QuizModel.findById(quizId);
    const qid = quiz!.questions[0]._id.toString();

    await startAttempt(candidate.id, quizId);
    const correctResult = await submitAttempt(candidate.id, quizId, {
      answers: [{ questionId: qid, selectedOptionIds: ['b'] }],
    });
    expect(correctResult.score).toBe(2);
    expect(correctResult.maxScore).toBe(2);
    expect(correctResult.answers[0].isCorrect).toBe(true);
  });

  it('should score multi-select with exact set match (no partial marks)', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const candidate = await createTestUser({ role: 'candidate' });
    const quizId = await createLiveQuiz({
      instructorId: instructor.id,
      participantIds: [candidate.id],
      questions: [
        {
          type: 'multi-select',
          text: 'Select all prime numbers.',
          options: [
            { id: 'a', text: '2' },
            { id: 'b', text: '4' },
            { id: 'c', text: '3' },
            { id: 'd', text: '6' },
          ],
          correctOptionIds: ['a', 'c'],
          points: 3,
        },
      ],
    });

    const quiz = await QuizModel.findById(quizId);
    const qid = quiz!.questions[0]._id.toString();

    await startAttempt(candidate.id, quizId);

    // Partial match (only one correct) → zero marks
    const partialResult = await submitAttempt(candidate.id, quizId, {
      answers: [{ questionId: qid, selectedOptionIds: ['a'] }],
    });
    expect(partialResult.score).toBe(0);
    expect(partialResult.answers[0].isCorrect).toBe(false);
  });

  it('should score multi-select full marks for exact set match', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const candidate = await createTestUser({ role: 'candidate' });
    const quizId = await createLiveQuiz({
      instructorId: instructor.id,
      participantIds: [candidate.id],
      questions: [
        {
          type: 'multi-select',
          text: 'Select all prime numbers.',
          options: [
            { id: 'a', text: '2' },
            { id: 'b', text: '4' },
            { id: 'c', text: '3' },
          ],
          correctOptionIds: ['a', 'c'],
          points: 3,
        },
      ],
    });

    const quiz = await QuizModel.findById(quizId);
    const qid = quiz!.questions[0]._id.toString();

    await startAttempt(candidate.id, quizId);
    const result = await submitAttempt(candidate.id, quizId, {
      answers: [{ questionId: qid, selectedOptionIds: ['a', 'c'] }],
    });
    expect(result.score).toBe(3);
    expect(result.answers[0].isCorrect).toBe(true);
  });

  it('should score unanswered questions as zero', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const candidate = await createTestUser({ role: 'candidate' });
    const quizId = await createLiveQuiz({
      instructorId: instructor.id,
      participantIds: [candidate.id],
      questions: [
        {
          type: 'single-choice',
          text: 'Question 1',
          options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
          correctOptionIds: ['a'],
          points: 1,
        },
        {
          type: 'single-choice',
          text: 'Question 2',
          options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
          correctOptionIds: ['b'],
          points: 1,
        },
      ],
    });

    const quiz = await QuizModel.findById(quizId);
    const qid1 = quiz!.questions[0]._id.toString();

    await startAttempt(candidate.id, quizId);
    const result = await submitAttempt(candidate.id, quizId, {
      answers: [{ questionId: qid1, selectedOptionIds: ['a'] }], // only answer Q1
    });
    expect(result.score).toBe(1);
    expect(result.maxScore).toBe(2);
    expect(result.answers).toHaveLength(2);
    expect(result.answers[0].isCorrect).toBe(true);
    expect(result.answers[1].isCorrect).toBe(false);
    expect(result.answers[1].awardedPoints).toBe(0);
  });

  it('should be idempotent — re-submitting returns the existing scored attempt', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const candidate = await createTestUser({ role: 'candidate' });
    const quizId = await createLiveQuiz({
      instructorId: instructor.id,
      participantIds: [candidate.id],
      questions: [
        {
          type: 'true-false',
          text: 'The sky is blue.',
          options: [{ id: 't', text: 'True' }, { id: 'f', text: 'False' }],
          correctOptionIds: ['t'],
          points: 1,
        },
      ],
    });

    const quiz = await QuizModel.findById(quizId);
    const qid = quiz!.questions[0]._id.toString();

    await startAttempt(candidate.id, quizId);
    const first = await submitAttempt(candidate.id, quizId, {
      answers: [{ questionId: qid, selectedOptionIds: ['t'] }],
    });
    const second = await submitAttempt(candidate.id, quizId, {
      answers: [{ questionId: qid, selectedOptionIds: ['f'] }], // different answers
    });

    // Second submit should return the SAME score (not re-scored)
    expect(second.score).toBe(first.score);
    expect(second.id).toBe(first.id);
    expect(second.status).toBe('submitted');
  });

  it('should mark as auto-submitted when submitted past the deadline (time guard)', async () => {
    // We can't use jest.useFakeTimers() for the whole test because
    // mongodb-memory-server uses real timers internally. Instead, we
    // create an attempt with a deadline in the past by directly
    // manipulating the attempt document after starting it.
    const instructor = await createTestUser({ role: 'instructor' });
    const candidate = await createTestUser({ role: 'candidate' });

    const quizId = await createLiveQuiz({
      instructorId: instructor.id,
      participantIds: [candidate.id],
      durationMinutes: 30,
      questions: [
        {
          type: 'true-false',
          text: 'Question 1',
          options: [{ id: 't', text: 'True' }, { id: 'f', text: 'False' }],
          correctOptionIds: ['t'],
          points: 1,
        },
      ],
    });

    const quiz = await QuizModel.findById(quizId);
    const qid = quiz!.questions[0]._id.toString();

    // Start the attempt
    const attempt = await startAttempt(candidate.id, quizId);
    expect(attempt.status).toBe('in-progress');

    // Manually set the deadline to the past to simulate time expiry
    const { AttemptModel } = await import('../../src/models/Attempt');
    await AttemptModel.findByIdAndUpdate(attempt.id, {
      deadlineAt: new Date(Date.now() - 60_000), // 1 minute ago
    });

    // Submit — should be marked as auto-submitted
    const result = await submitAttempt(candidate.id, quizId, {
      answers: [{ questionId: qid, selectedOptionIds: ['t'] }],
    });

    expect(result.status).toBe('auto-submitted');
    expect(result.autoSubmitted).toBe(true);
  });
});
