import type { ApiError } from '@/types/auth';

/**
 * Extract a user-facing error message from an RTK Query error or any
 * thrown value, with sensible fallbacks for network failures.
 */
export function extractErrorMessage(error: unknown): string {
  // RTK Query serialized error shape (fetchBaseQuery)
  if (error && typeof error === 'object') {
    const maybeStatus = (error as { status?: unknown }).status;

    // Server returned an error body: { data: ApiError }
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object') {
      const apiErr = (data as Partial<ApiError>).error;
      if (apiErr && typeof apiErr.message === 'string') {
        return apiErr.message;
      }
    }

    // Fetch-level failures (no response)
    if (maybeStatus === 'FETCH_ERROR') {
      const msg = (error as { error?: string }).error;
      return typeof msg === 'string' ? msg : 'Network error. Please try again.';
    }
    if (maybeStatus === 'TIMEOUT_ERROR') {
      return 'Request timed out. Please try again.';
    }
    if (maybeStatus === 'PARSING_ERROR') {
      return 'Unexpected response from server.';
    }
  }

  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
