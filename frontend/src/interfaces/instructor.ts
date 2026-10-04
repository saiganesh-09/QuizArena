import type {
  QuestionType,
  QuestionOption,
} from '@/types/quiz';

/**
 * UI-facing interfaces for the instructor feature (form values, query
 * params, tab state). Kept separate from pure domain types in /types.
 */

/** Query parameters for the instructor quiz list endpoint. */
export interface InstructorQuizListQuery {
  page?: number;
  limit?: number;
  status?: string;
  kind?: 'quiz' | 'homework';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Form values for creating/editing a question manually. */
export interface QuestionFormValues {
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  correctOptionIds: string[];
  points: number;
}

/** Validation error map for the question form. */
export type QuestionFieldErrors = Partial<
  Record<'type' | 'text' | 'options' | 'correctOptionIds' | 'points', string>
>;

/** Form values for adding a participant by email. */
export interface AddParticipantFormValues {
  email: string;
}

/** Tab identifiers for the update-quiz workspace. */
export type QuizTab = 'questions' | 'participants';

/** Breadcrumb item. */
export interface BreadcrumbItem {
  label: string;
  to?: string;
}

/** Props for the readiness badge. */
export interface ReadinessBadgeProps {
  ready: boolean;
  missing: string[];
}
