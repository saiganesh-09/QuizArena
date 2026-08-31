/**
 * Pure, strictly-typed validation helpers for auth forms.
 * No external library — keeps the bundle lean and types exact.
 */

/** RFC-ish email check (good enough for client-side pre-validation). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Strong password policy (mirrors backend Zod schema):
 * >= 8 chars, upper, lower, number, special.
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8 || password.length > 128) return false;
  return (
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/** Human-readable description of the strong-password rules. */
export const PASSWORD_RULES_TEXT =
  'At least 8 characters with uppercase, lowercase, number, and special character.';
