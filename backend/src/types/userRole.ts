import type { UserRole } from './auth';

/**
 * Runtime helper to assert a value is a valid UserRole.
 *
 * NOTE: The Express Request augmentation (`declare module`) lives in
 * `express.d.ts` since it is a type-only declaration. This file holds
 * the runtime helper so it can be imported as a value at runtime.
 */
export function isUserRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'instructor' || value === 'candidate';
}
