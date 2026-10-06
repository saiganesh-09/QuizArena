/**
 * Quiz domain types for the admin feature on the frontend.
 * These mirror the backend's public contract (types/quiz.ts).
 */

import type { UserRole, AccountStatus } from './auth';

/** Quiz lifecycle states. */
export type QuizStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';

/** 'quiz' = scheduled assessment; 'homework' = daily assignment (min 10 questions). */
export type QuizKind = 'quiz' | 'homework';

/** A single instructor assignment reference. */
export interface InstructorAssignment {
  instructorId: string;
  instructorEmail: string;
  assignedAt: string;
}

/** Public quiz object returned by admin endpoints. */
export interface Quiz {
  id: string;
  title: string;
  description: string;
  status: QuizStatus;
  kind: QuizKind;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  level: string;
  difficulty: string;
  passingPoints: number;
  createdBy: string;
  instructors: InstructorAssignment[];
  questions: Question[];
  participants: Participant[];
  questionCount: number;
  participantCount: number;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Counts of quizzes per status (for dashboard charts). */
export interface QuizStatusStats {
  draft: number;
  scheduled: number;
  live: number;
  completed: number;
  cancelled: number;
  total: number;
}

/** Paginated list payload for quizzes. */
export interface QuizListPayload {
  items: Quiz[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: QuizStatusStats;
}

/** Admin user-list item (no password hash). */
export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

/** User-count statistics returned alongside the user list. */
export interface UserStats {
  total: number;
  byRole: Record<UserRole, number>;
  byStatus: { active: number; suspended: number };
}

/** Paginated list payload for admin users. */
export interface AdminUserListPayload {
  items: AdminUserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: UserStats;
}

// ---- Instructor feature types (Milestone 3) ----

/** Question types supported by the platform. */
export type QuestionType = 'single-choice' | 'multi-select' | 'true-false';

/** A single option within a question. */
export interface QuestionOption {
  id: string;
  text: string;
}

/** A quiz question. */
export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  correctOptionIds: string[];
  points: number;
  createdAt: string;
  updatedAt: string;
}

/** A participant assigned to a quiz. */
export interface Participant {
  id: string;
  userId: string;
  email: string;
  name: string;
  addedAt: string;
}

/** Readiness signal for publish pre-conditions. */
export interface QuizReadiness {
  ready: boolean;
  hasQuestions: boolean;
  hasParticipants: boolean;
  hasUpcomingSchedule: boolean;
  missing: string[];
}

/** Instructor quiz view (includes readiness + counts). */
export interface InstructorQuiz extends Quiz {
  questionCount: number;
  participantCount: number;
  readiness: QuizReadiness;
}

/** Paginated list payload for instructor quizzes. */
export interface InstructorQuizListPayload {
  items: InstructorQuiz[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: QuizStatusStats;
}

/** Result of an atomic CSV bulk upload (questions or participants). */
export interface BulkUploadResult<T> {
  inserted: number;
  skipped: number;
  errors: CsvRowError[];
  items: T[];
}

/** A row-level validation error from a CSV upload. */
export interface CsvRowError {
  row: number;
  message: string;
}

// ---- Candidate feature types (Milestone 4) ----

/**
 * Metadata-only quiz view for candidates.
 * SECURITY: intentionally omits questions, options, answer keys, and
 * participant lists. Only safe metadata is exposed.
 */
export interface CandidateQuizMeta {
  id: string;
  title: string;
  description: string;
  status: QuizStatus;
  kind: QuizKind;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  level: string;
  difficulty: string;
  passingPoints: number;
  questionCount: number;
  isLiveNow: boolean;
  hasSubmitted: boolean;
}

/** Candidate-facing status filter for the quiz list. */
export type CandidateQuizFilter = 'upcoming' | 'live' | 'completed' | 'all';

/** Per-status counts for the candidate dashboard (assigned quizzes only). */
export interface CandidateQuizStats {
  total: number;
  upcoming: number;
  live: number;
  completed: number;
  cancelled: number;
}

/** Paginated list payload for candidate quizzes. */
export interface CandidateQuizListPayload {
  items: CandidateQuizMeta[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: CandidateQuizStats;
}

// ---- Attempt / Examination Engine types (Milestone 5) ----

/** Attempt lifecycle states. */
export type AttemptStatus = 'in-progress' | 'submitted' | 'auto-submitted';

/**
 * A question as served to the candidate during an attempt.
 * SECURITY: no correctOptionIds or isCorrect fields — correct answers
 * must never leave the server during the attempt phase.
 */
export interface AttemptQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  points: number;
}

/** A candidate's selected answer for a single question. */
export interface AnswerSelection {
  questionId: string;
  selectedOptionIds: string[];
}

/** A scored answer (returned after submission). */
export interface ScoredAnswer {
  questionId: string;
  selectedOptionIds: string[];
  awardedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
}

/** The full attempt document returned by start/submit/get endpoints. */
export interface AttemptPayload {
  id: string;
  quizId: string;
  quizTitle: string;
  candidateId: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  deadlineAt: string;
  durationMinutes: number;
  /** Only present while the attempt is in-progress. */
  questions: AttemptQuestion[];
  /** Only present after submission. */
  answers: ScoredAnswer[];
  score: number;
  maxScore: number;
  autoSubmitted: boolean;
}

// ---- Results & Analytics types (Milestone 6) ----

/** Per-question review item for the candidate result view. */
export interface QuestionReview {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  points: number;
  options: QuestionOption[];
  selectedOptionIds: string[];
  correctOptionIds: string[];
  awardedPoints: number;
  isCorrect: boolean;
}

/** Candidate result payload — own attempt with correct answers revealed. */
export interface CandidateResult {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  status: AttemptStatus;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  startedAt: string;
  submittedAt: string | null;
  autoSubmitted: boolean;
  /** Teacher's written remark shown to the candidate (empty when unset). */
  teacherRemark: string;
  questions: QuestionReview[];
}

/** One point in a candidate's score trend (one submitted attempt). */
export interface CandidateScorePoint {
  quizId: string;
  quizTitle: string;
  percentage: number;
  submittedAt: string | null;
}

/** Candidate's own performance summary across all submitted attempts. */
export interface CandidatePerformance {
  attemptsTaken: number;
  averagePercentage: number;
  bestPercentage: number;
  bestQuizTitle: string | null;
  latestRank: number | null;
  latestRankOutOf: number | null;
  latestQuizTitle: string | null;
  trend: CandidateScorePoint[];
}

/** One row in the candidate's own results history. */
export interface CandidateResultRowItem {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  kind: QuizKind;
  score: number;
  maxScore: number;
  percentage: number;
  remark: string;
  teacherRemark: string;
  rank: number;
  rankOutOf: number;
  submittedAt: string | null;
}

/** One row on the candidate leaderboard (aggregate stats per student). */
export interface LeaderboardEntry {
  rank: number;
  candidateName: string;
  quizzesTaken: number;
  averagePercentage: number;
  bestPercentage: number;
  isSelf: boolean;
}

/** A single candidate's result row in the instructor aggregated view. */
export interface CandidateResultRow {
  attemptId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  /** Competition rank by score (1-based; ties share the same rank). */
  rank: number;
  score: number;
  maxScore: number;
  percentage: number;
  remark: string;
  teacherRemark: string;
  timeTakenSeconds: number;
  status: AttemptStatus;
  submittedAt: string | null;
}

/** A single answer inside an instructor's attempt-detail view. */
export interface AttemptAnswerDetail {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  options: { id: string; text: string }[];
  correctOptionIds: string[];
  selectedOptionIds: string[];
  awardedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
}

/** Instructor-facing detail for one candidate's submitted attempt. */
export interface InstructorAttemptDetail {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  rank: number;
  score: number;
  maxScore: number;
  percentage: number;
  remark: string;
  teacherRemark: string;
  correctCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  status: AttemptStatus;
  startedAt: string | null;
  submittedAt: string | null;
  answers: AttemptAnswerDetail[];
}

/** Score distribution bucket for charts. */
export interface ScoreBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

/** Instructor aggregated results for a single quiz. */
export interface InstructorQuizResults {
  quizId: string;
  quizTitle: string;
  quizStatus: QuizStatus;
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  scoreDistribution: ScoreBucket[];
  candidates: CandidateResultRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Quiz status counts for admin analytics. */
export interface QuizStatusStats {
  draft: number;
  scheduled: number;
  live: number;
  completed: number;
  cancelled: number;
  total: number;
}

/** Admin platform-wide analytics summary. */
export interface AdminAnalytics {
  quizzesByStatus: QuizStatusStats;
  totalCandidates: number;
  totalInstructors: number;
  totalAttempts: number;
  totalCompletedAttempts: number;
  attemptCompletionRate: number;
  averageScore: number;
  quizCount: number;
}
