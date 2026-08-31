import { User } from '../../src/models/User';
import { QuizModel } from '../../src/models/Quiz';
import { AttemptModel } from '../../src/models/Attempt';
import { createTestUser } from '../helpers';
import { clearDatabase } from '../setup';

/**
 * Model tests — verify schema validation, methods, and the critical
 * unique index on Attempt { candidateId, quizId }.
 */

describe('User model', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('should create a user with a hashed password', async () => {
    const user = await User.create({
      name: 'Jane Doe',
      email: 'jane@test.com',
      password: 'Password123!',
      role: 'candidate',
      status: 'active',
    });

    expect(user._id).toBeDefined();
    expect(user.name).toBe('Jane Doe');
    expect(user.email).toBe('jane@test.com');
    // Password should be hashed, not plaintext
    expect(user.password).not.toBe('Password123!');
  });

  it('should verify a correct password', async () => {
    const user = await User.create({
      name: 'Jane Doe',
      email: 'jane@test.com',
      password: 'Password123!',
      role: 'candidate',
      status: 'active',
    });

    const isMatch = await user.comparePassword('Password123!');
    expect(isMatch).toBe(true);

    const isWrong = await user.comparePassword('WrongPassword!');
    expect(isWrong).toBe(false);
  });

  it('should not allow duplicate emails', async () => {
    await User.create({
      name: 'Jane Doe',
      email: 'jane@test.com',
      password: 'Password123!',
      role: 'candidate',
      status: 'active',
    });

    await expect(
      User.create({
        name: 'Another Jane',
        email: 'jane@test.com',
        password: 'Password456!',
        role: 'candidate',
        status: 'active',
      }),
    ).rejects.toThrow();
  });
});

describe('Quiz model', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('should create a quiz with draft status by default', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const now = new Date();
    const quiz = await QuizModel.create({
      title: 'My Quiz',
      description: 'Test',
      status: 'draft',
      startTime: new Date(now.getTime() + 3600_000),
      endTime: new Date(now.getTime() + 7200_000),
      durationMinutes: 30,
      createdBy: instructor.id,
      instructors: [{ instructorId: instructor.id, instructorEmail: instructor.email, assignedAt: now }],
      questions: [],
      participants: [],
      cancelledAt: null,
    });

    expect(quiz.status).toBe('draft');
    expect(quiz.title).toBe('My Quiz');
  });

  it('should compute readiness correctly for a draft quiz', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const now = new Date();
    const quiz = await QuizModel.create({
      title: 'My Quiz',
      description: 'Test',
      status: 'draft',
      startTime: new Date(now.getTime() + 3600_000),
      endTime: new Date(now.getTime() + 7200_000),
      durationMinutes: 30,
      createdBy: instructor.id,
      instructors: [{ instructorId: instructor.id, instructorEmail: instructor.email, assignedAt: now }],
      questions: [],
      participants: [],
      cancelledAt: null,
    });

    const readiness = quiz.computeReadiness();
    // No questions, no participants → not ready
    expect(readiness.ready).toBe(false);
  });

  it('should verify ownership correctly', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const otherInstructor = await createTestUser({ role: 'instructor', email: 'other@test.com' });
    const now = new Date();
    const quiz = await QuizModel.create({
      title: 'My Quiz',
      description: 'Test',
      status: 'draft',
      startTime: new Date(now.getTime() + 3600_000),
      endTime: new Date(now.getTime() + 7200_000),
      durationMinutes: 30,
      createdBy: instructor.id,
      instructors: [{ instructorId: instructor.id, instructorEmail: instructor.email, assignedAt: now }],
      questions: [],
      participants: [],
      cancelledAt: null,
    });

    expect(quiz.isOwnedBy(instructor.id)).toBe(true);
    expect(quiz.isOwnedBy(otherInstructor.id)).toBe(false);
  });
});

describe('Attempt model — unique index', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('should enforce one attempt per candidate per quiz (unique index)', async () => {
    const instructor = await createTestUser({ role: 'instructor' });
    const candidate = await createTestUser({ role: 'candidate' });
    const now = new Date();
    const quiz = await QuizModel.create({
      title: 'My Quiz',
      description: 'Test',
      status: 'live',
      startTime: new Date(now.getTime() - 60_000),
      endTime: new Date(now.getTime() + 3600_000),
      durationMinutes: 30,
      createdBy: instructor.id,
      instructors: [{ instructorId: instructor.id, instructorEmail: instructor.email, assignedAt: now }],
      questions: [],
      participants: [{ userId: candidate.id, email: 'c@test.com', name: 'C', addedAt: now }],
      cancelledAt: null,
    });

    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + 30 * 60_000);

    // First attempt — should succeed
    await AttemptModel.create({
      quizId: quiz._id,
      quizTitle: 'My Quiz',
      candidateId: candidate.id,
      status: 'in-progress',
      startedAt,
      submittedAt: null,
      deadlineAt,
      durationMinutes: 30,
      answers: [],
      score: 0,
      maxScore: 0,
      autoSubmitted: false,
    });

    // Second attempt for the same candidate+quiz — should fail (E11000)
    await expect(
      AttemptModel.create({
        quizId: quiz._id,
        quizTitle: 'My Quiz',
        candidateId: candidate.id,
        status: 'in-progress',
        startedAt,
        submittedAt: null,
        deadlineAt,
        durationMinutes: 30,
        answers: [],
        score: 0,
        maxScore: 0,
        autoSubmitted: false,
      }),
    ).rejects.toThrow();
  });
});
