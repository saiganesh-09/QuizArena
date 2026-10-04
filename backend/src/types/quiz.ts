import type { UserRole } from './auth';

/**
 * Quiz domain types shared across the admin feature.
 * All datetimes are ISO-8601 strings in UTC.
 */

/**
 * Quiz lifecycle states.
 * Draft -> Scheduled -> Live -> Completed
 * Cancelled is reachable from Draft, Scheduled, or Live and is terminal/read-only.
 */
export type QuizStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';

/** 'quiz' = scheduled assessment; 'homework' = daily assignment (min 10 questions). */
export type QuizKind = 'quiz' | 'homework';

/** A single instructor assignment reference. */
export interface InstructorAssignment {
  instructorId: string;
  instructorEmail: string;
  assignedAt: string; // ISO-8601 UTC
}

/** Public quiz object returned by admin endpoints. */
export interface Quiz {
  id: string;
  title: string;
  description: string;
  status: QuizStatus;
  kind: QuizKind;
  startTime: string; // ISO-8601 UTC
  endTime: string; // ISO-8601 UTC
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

/** Paginated list payload for quizzes. */
export interface QuizListPayload {
  items: Quiz[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: QuizStatusStats;
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
  /** IDs of correct options (one for single-choice/true-false, many for multi-select). */
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
 *
 * SECURITY: This type intentionally omits the `questions`, `participants`,
 * and `instructors` arrays. Candidates must never see questions, options,
 * correct answer keys, or other participants. Only safe metadata is exposed.
 */
export interface CandidateQuizMeta {
  id: string;
  title: string;
  description: string;
  status: QuizStatus;
  kind: QuizKind;
  startTime: string; // ISO-8601 UTC
  endTime: string; // ISO-8601 UTC
  durationMinutes: number;
  level: string;
  difficulty: string;
  passingPoints: number;
  questionCount: number;
  /** Whether the live window is currently open (now is between start and end). */
  isLiveNow: boolean;
  /** Whether the candidate has already submitted an attempt (future milestone). */
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
 *
 * SECURITY: This interface intentionally has NO `correctOptionIds`
 * or `isCorrect` field. Correct answers must never leave the server
 * during the attempt phase.
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

/** A scored answer (stored on the attempt after submission). */
export interface ScoredAnswer {
  questionId: string;
  selectedOptionIds: string[];
  awardedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
}

/**
 * The full attempt document as returned to the client.
 *
 * Before submission: contains questions (without answers) + timing.
 * After submission: contains scored answers + final score, and the
 * questions array is stripped (the attempt is locked).
 */
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
  /** Only present while the attempt is in-progress (before submission). */
  questions: AttemptQuestion[];
  /** Only present after submission. */
  answers: ScoredAnswer[];
  score: number;
  maxScore: number;
  /** Whether the submission was automatic (timer expired). */
  autoSubmitted: boolean;
}

/** Payload for the submit endpoint: array of answer selections. */
export interface SubmitAnswersPayload {
  answers: AnswerSelection[];
}

// ---- Results & Analytics types (Milestone 6) ----

/**
 * Per-question review item for the candidate result view.
 * Shows the candidate's selected answers side-by-side with the correct
 * answers. This is the ONLY place correct answers are exposed to a
 * candidate, and ONLY after they have submitted their attempt.
 */
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
  /** Rank in the most recently submitted quiz (competition ranking). */
  latestRank: number | null;
  /** Total submitted attempts in that quiz (the cohort size). */
  latestRankOutOf: number | null;
  latestQuizTitle: string | null;
  trend: CandidateScorePoint[];
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
  /** Teacher's written remark, or the auto band remark when unset. */
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

/** Admin platform-wide analytics summary. */
export interface AdminAnalytics {
  quizzesByStatus: QuizStatusStats;
  totalCandidates: number;
  totalInstructors: number;
  totalAttempts: number;
  totalCompletedAttempts: number;
  attemptCompletionRate: number;
  averageScore: number;
  /** Quizzes included in this analytics window (after filters). */
  quizCount: number;
}

/** Admin user-list item (no password hash). */
export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
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

/** User-count statistics returned alongside the user list. */
export interface UserStats {
  total: number;
  byRole: Record<UserRole, number>;
  byStatus: { active: number; suspended: number };
}
