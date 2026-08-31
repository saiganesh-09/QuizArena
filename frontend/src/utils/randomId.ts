/**
 * Generate a short random id (sufficient for client-side option ids).
 * Not cryptographically secure — used only for form state before server save.
 */
export function randomId(): string {
  return `o_${Math.random().toString(36).slice(2, 10)}`;
}
