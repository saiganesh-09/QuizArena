import { authApi } from './authApi';
import type { ApiResponse } from '@/types/auth';
import type { AttemptPayload, AnswerSelection } from '@/types/quiz';

/**
 * Attempt API slice (RTK Query) — the examination engine endpoints.
 *
 * Injects endpoints into the existing authApi (single reducer, shared
 * cache tags). All requests include credentials for the HTTP-only cookie.
 */

type AttemptResponse = ApiResponse<AttemptPayload>;

function unwrap<T>(envelope: ApiResponse<T>): T {
  if (envelope.success) return envelope.data;
  throw new Error(envelope.error.message);
}

export const attemptApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    /** POST /candidate/quizzes/:id/start — start (or resume) a quiz attempt. */
    startAttempt: builder.mutation<AttemptPayload, string>({
      query: (quizId) => ({
        url: `/candidate/quizzes/${quizId}/start`,
        method: 'POST',
      }),
      transformResponse: (response: AttemptResponse) => unwrap(response),
      invalidatesTags: (_result, _error, quizId) => [
        { type: 'Quiz', id: `candidate-${quizId}` },
        { type: 'Quiz', id: 'candidate-list' },
      ],
    }),

    /** POST /candidate/quizzes/:id/submit — submit the attempt with answers. */
    submitAttempt: builder.mutation<AttemptPayload, { quizId: string; answers: AnswerSelection[] }>({
      query: ({ quizId, answers }) => ({
        url: `/candidate/quizzes/${quizId}/submit`,
        method: 'POST',
        body: { answers },
      }),
      transformResponse: (response: AttemptResponse) => unwrap(response),
      invalidatesTags: (_result, _error, { quizId }) => [
        { type: 'Quiz', id: `candidate-${quizId}` },
        { type: 'Quiz', id: 'candidate-list' },
      ],
    }),

    /** GET /candidate/quizzes/:id/attempt — get the current attempt state. */
    getAttempt: builder.query<AttemptPayload, string>({
      query: (quizId) => `/candidate/quizzes/${quizId}/attempt`,
      transformResponse: (response: AttemptResponse) => unwrap(response),
      providesTags: (_result, _error, quizId) => [{ type: 'Quiz', id: `attempt-${quizId}` }],
    }),
  }),
});

export const {
  useStartAttemptMutation,
  useSubmitAttemptMutation,
  useGetAttemptQuery,
} = attemptApi;
