import type { UserProfile, UserRole } from '@/types/auth';

/**
 * UI-facing interfaces (form values, slice state, etc.).
 * Kept separate from pure domain types in /types.
 */

/** Form values for the login screen. */
export interface LoginFormData {
  email: string;
  password: string;
}

/** Form values for the signup screen. */
export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Validation error map keyed by field name. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** Auth slice state held in Redux. */
export interface AuthState {
  user: UserProfile | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
}

/** Role-based route access descriptor. */
export interface RoleGuard {
  allowedRoles: UserRole[];
}
