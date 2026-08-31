import { authApi } from './authApi';
import type { ApiResponse } from '@/types/auth';
import type {
  CandidateQuizMeta,
  CandidateQuizListPayload,
} from '@/types/quiz';
import type { CandidateQuizListQuery } from '@/interfaces/candidate';

/**
 * Candidate API slice (RTK Query).
 *
 * Injects endpoints into the existing authApi (single reducer, shared
 * cache tags). All requests include credentials for the HTTP-only cookie.
 */

type CandidateQuizResponse = ApiResponse<CandidateQuizMeta>;
type CandidateQuizListResponse = ApiResponse<CandidateQuizListPayload>;

function unwrap<T>(envelope: ApiResponse<T>): T {
  if (envelope.success) return envelope.data;
  throw new Error(envelope.error.message);
}

/** Build a query string from a query object, skipping undefined values. */
function toQueryString(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const candidateApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    listCandidateQuizzes: builder.query<CandidateQuizListPayload, CandidateQuizListQuery | void>({
      query: (arg) => `/candidate/quizzes${toQueryString((arg ?? {}) as Record<string, unknown>)}`,
      transformResponse: (response: CandidateQuizListResponse) => unwrap(response),
      providesTags: [{ type: 'Quiz', id: 'candidate-list' }],
    }),

    getCandidateQuiz: builder.query<CandidateQuizMeta, string>({
      query: (id) => `/candidate/quizzes/${id}`,
      transformResponse: (response: CandidateQuizResponse) => unwrap(response),
      providesTags: (_result, _error, id) => [{ type: 'Quiz', id: `candidate-${id}` }],
    }),
  }),
});

export const {
  useListCandidateQuizzesQuery,
  useGetCandidateQuizQuery,
} = candidateApi;
