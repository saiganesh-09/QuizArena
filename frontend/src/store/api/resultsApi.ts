import { authApi } from './authApi';
import type { ApiResponse } from '@/types/auth';
import type {
  CandidateResult,
  InstructorQuizResults,
  InstructorAttemptDetail,
  AdminAnalytics,
} from '@/types/quiz';
import type {
  InstructorResultsQueryParams,
  AdminAnalyticsQueryParams,
} from '@/interfaces/results';

/**
 * Results API slice (RTK Query) — result & analytics endpoints for
 * Milestone 6. Injects endpoints into the existing authApi.
 */

type CandidateResultResponse = ApiResponse<CandidateResult>;
type InstructorResultsResponse = ApiResponse<InstructorQuizResults>;
type InstructorAttemptDetailResponse = ApiResponse<InstructorAttemptDetail>;
type AdminAnalyticsResponse = ApiResponse<AdminAnalytics>;

function unwrap<T>(envelope: ApiResponse<T>): T {
  if (envelope.success) return envelope.data;
  throw new Error(envelope.error.message);
}

/** Build a query string from params, omitting undefined values. */
function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value));
    }
  }
  const str = sp.toString();
  return str ? `?${str}` : '';
}

/** Safely cast a typed params object to Record<string, unknown> for buildQuery. */
function toQueryParams<T>(params: T): Record<string, unknown> {
  return params as unknown as Record<string, unknown>;
}

export const resultsApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /candidate/quizzes/:id/result — own result with correct answers. */
    getCandidateResult: builder.query<CandidateResult, string>({
      query: (quizId) => `/candidate/quizzes/${quizId}/result`,
      transformResponse: (response: CandidateResultResponse) => unwrap(response),
      providesTags: (_result, _error, quizId) => [{ type: 'Quiz', id: `result-${quizId}` }],
    }),

    /** GET /instructor/quizzes/:id/results — aggregated quiz results. */
    getInstructorResults: builder.query<InstructorQuizResults, { quizId: string } & InstructorResultsQueryParams>({
      query: ({ quizId, ...params }) =>
        `/instructor/quizzes/${quizId}/results${buildQuery(toQueryParams(params))}`,
      transformResponse: (response: InstructorResultsResponse) => unwrap(response),
      providesTags: (_result, _error, { quizId }) => [
        { type: 'Quiz', id: `instructor-results-${quizId}` },
      ],
    }),

    /** GET /instructor/quizzes/:id/results/:attemptId — per-candidate attempt detail. */
    getInstructorAttemptDetail: builder.query<InstructorAttemptDetail, { quizId: string; attemptId: string }>({
      query: ({ quizId, attemptId }) => `/instructor/quizzes/${quizId}/results/${attemptId}`,
      transformResponse: (response: InstructorAttemptDetailResponse) => unwrap(response),
      providesTags: (_result, _error, { attemptId }) => [
        { type: 'Quiz', id: `attempt-detail-${attemptId}` },
      ],
    }),

    /** GET /admin/analytics — platform-wide analytics summary. */
    getAdminAnalytics: builder.query<AdminAnalytics, AdminAnalyticsQueryParams>({
      query: (params) => `/admin/analytics${buildQuery(toQueryParams(params))}`,
      transformResponse: (response: AdminAnalyticsResponse) => unwrap(response),
      providesTags: ['Quiz'],
    }),
  }),
});

export const {
  useGetCandidateResultQuery,
  useGetInstructorResultsQuery,
  useGetInstructorAttemptDetailQuery,
  useGetAdminAnalyticsQuery,
} = resultsApi;
