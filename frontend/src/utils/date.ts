/**
 * Stable date/time formatting helpers.
 * All datetimes from the backend are ISO-8601 UTC strings.
 */

/** Format an ISO-8601 string as a locale date (e.g. "Aug 31, 2026"). */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format an ISO-8601 string as a locale time (e.g. "2:30 PM"). */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Format an ISO-8601 string as date + time (e.g. "Aug 31, 2026, 2:30 PM"). */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

/**
 * Convert an ISO-8601 string to the value expected by an
 * <input type="datetime-local"> (yyyy-MM-ddThh:mm), in the user's
 * local timezone, for pre-populating edit forms.
 */
export function toDateTimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number): string => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/**
 * Convert a datetime-local input value (local time) to an ISO-8601 UTC
 * string for sending to the backend.
 */
export function fromDateTimeLocalValue(local: string): string {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

/** Human-readable label for a quiz status. */
export function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
