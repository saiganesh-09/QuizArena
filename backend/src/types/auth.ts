/**
 * Shared domain types for the auth feature.
 * These describe the shape of data crossing API boundaries.
 */

/** Application user roles. 'candidate' is the default for self-signup. */
export type UserRole = 'admin' | 'instructor' | 'candidate';

/** Account status used for admin user management. */
export type AccountStatus = 'active' | 'suspended';

/** Public user profile returned by every auth endpoint.
 *  Never includes the password hash. */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

/** Payload encoded inside the signed JWT. */
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/** Standardized API error response body. */
export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Standardized API success response body. */
export interface ApiSuccessBody<T> {
  success: true;
  data: T;
}
