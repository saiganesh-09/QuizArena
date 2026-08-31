import type { QuizStatus, Quiz } from '@/types/quiz';
import type { UserRole, AccountStatus } from '@/types/auth';

/**
 * UI-facing interfaces for the admin feature (form values, query params,
 * chart data). Kept separate from pure domain types in /types.
 */

/** Form values for the create/edit quiz screen. */
export interface QuizFormValues {
  title: string;
  description: string;
  startTime: string; // datetime-local string from the input
  endTime: string; // datetime-local string from the input
  durationMinutes: number;
}

/** Query parameters for the quiz list endpoint. */
export interface QuizListQuery {
  page?: number;
  limit?: number;
  status?: QuizStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Query parameters for the admin user list endpoint. */
export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: AccountStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Validation error map keyed by field name. */
export type QuizFieldErrors = Partial<Record<keyof QuizFormValues, string>>;

/** Assign instructor form values. */
export interface AssignInstructorFormValues {
  email: string;
}

/** A single slice of the status donut/pie chart. */
export interface ChartSlice {
  label: string;
  value: number;
  color: string;
  status: QuizStatus;
}

/** Props for the confirm dialog (cancel quiz). */
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Row action descriptor for the quiz table. */
export interface QuizRowAction {
  label: string;
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  onClick: (quiz: Quiz) => void;
  disabled?: (quiz: Quiz) => boolean;
  title?: (quiz: Quiz) => string;
}
