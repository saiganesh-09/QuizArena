/**
 * Shared domain types for the auth feature on the frontend.
 * These mirror the backend's public contract (UserProfile, error body).
 */

/** Application user roles. */
export type UserRole = 'admin' | 'instructor' | 'candidate';

/** Account status used for admin user management. */
export type AccountStatus = 'active' | 'suspended';

/** Public user profile returned by every auth endpoint. */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

/** Standardized API success response body. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/** Standardized API error response body. */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Union type used to narrow successful vs error responses. */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
