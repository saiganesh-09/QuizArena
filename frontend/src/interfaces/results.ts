import type { AdminAnalytics } from '@/types/quiz';

/** Query params for the instructor results endpoint. */
export interface InstructorResultsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'score' | 'timeTakenSeconds' | 'submittedAt' | 'candidateName';
  sortOrder?: 'asc' | 'desc';
}

/** Query params for the admin analytics endpoint. */
export interface AdminAnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  instructorId?: string;
}

/** Helper to format seconds as a human-readable duration string. */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
}

/** Re-export for convenience. */
export type { AdminAnalytics };
