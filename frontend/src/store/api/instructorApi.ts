import { authApi } from './authApi';
import type { ApiResponse } from '@/types/auth';
import type {
  InstructorQuiz,
  InstructorQuizListPayload,
  Quiz,
  Question,
  Participant,
  BulkUploadResult,
} from '@/types/quiz';
import type {
  InstructorQuizListQuery,
  QuestionFormValues,
  AddParticipantFormValues,
} from '@/interfaces/instructor';
import type { QuizFormValues } from '@/interfaces/quiz';
import type { QuizKind } from '@/types/quiz';
import { fromDateTimeLocalValue } from '@/utils/date';

/**
 * Instructor API slice (RTK Query).
 *
 * Injects endpoints into the existing authApi (single reducer, shared
 * cache tags). All requests include credentials for the HTTP-only cookie.
 */

type InstructorQuizResponse = ApiResponse<InstructorQuiz>;
type QuizResponse = ApiResponse<Quiz>;
type InstructorQuizListResponse = ApiResponse<InstructorQuizListPayload>;
type QuestionResponse = ApiResponse<Question>;
type QuestionListResponse = ApiResponse<Question[]>;
type ParticipantListResponse = ApiResponse<Participant[]>;
type BulkQuestionResponse = ApiResponse<BulkUploadResult<Question>>;
type BulkParticipantResponse = ApiResponse<BulkUploadResult<Participant>>;
type EmptyResponse = ApiResponse<null>;

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

/** Convert quiz form values (datetime-local) to the edit payload. */
function toEditPayload(values: QuizFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (values.title) payload.title = values.title;
  if (values.description !== undefined) payload.description = values.description;
  if (values.startTime) payload.startTime = fromDateTimeLocalValue(values.startTime);
  if (values.endTime) payload.endTime = fromDateTimeLocalValue(values.endTime);
  if (values.durationMinutes) payload.durationMinutes = values.durationMinutes;
  return payload;
}

export const instructorApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    // ---- Quizzes ----
    listMyQuizzes: builder.query<InstructorQuizListPayload, InstructorQuizListQuery | void>({
      query: (arg) => `/instructor/quizzes${toQueryString((arg ?? {}) as Record<string, unknown>)}`,
      transformResponse: (response: InstructorQuizListResponse) => unwrap(response),
      providesTags: [{ type: 'Quiz', id: 'instructor-list' }],
    }),

    /** POST /instructor/quizzes — create a quiz/homework draft (auto-owned). */
    createMyQuiz: builder.mutation<
      Quiz,
      {
        title: string;
        description: string;
        startTime: string;
        endTime: string;
        durationMinutes: number;
        kind?: QuizKind;
      }
    >({
      query: (body) => ({ url: '/instructor/quizzes', method: 'POST', body }),
      transformResponse: (response: QuizResponse) => unwrap(response),
      invalidatesTags: [{ type: 'Quiz', id: 'instructor-list' }],
    }),

    getMyQuiz: builder.query<InstructorQuiz, string>({
      query: (id) => `/instructor/quizzes/${id}`,
      transformResponse: (response: InstructorQuizResponse) => unwrap(response),
      providesTags: (_result, _error, id) => [{ type: 'Quiz', id }],
    }),

    editMyQuiz: builder.mutation<InstructorQuiz, { id: string; values: QuizFormValues }>({
      query: ({ id, values }) => ({
        url: `/instructor/quizzes/${id}`,
        method: 'PATCH',
        body: toEditPayload(values),
      }),
      transformResponse: (response: InstructorQuizResponse) => unwrap(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Quiz', id },
        { type: 'Quiz', id: 'instructor-list' },
      ],
    }),

    cancelMyQuiz: builder.mutation<InstructorQuiz, string>({
      query: (id) => ({ url: `/instructor/quizzes/${id}/cancel`, method: 'POST' }),
      transformResponse: (response: InstructorQuizResponse) => unwrap(response),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Quiz', id },
        { type: 'Quiz', id: 'instructor-list' },
      ],
    }),

    deleteMyQuiz: builder.mutation<null, string>({
      query: (id) => ({ url: `/instructor/quizzes/${id}`, method: 'DELETE' }),
      transformResponse: (response: EmptyResponse) => unwrap(response),
      invalidatesTags: [{ type: 'Quiz', id: 'instructor-list' }],
    }),

    publishMyQuiz: builder.mutation<InstructorQuiz, string>({
      query: (id) => ({ url: `/instructor/quizzes/${id}/publish`, method: 'POST' }),
      transformResponse: (response: InstructorQuizResponse) => unwrap(response),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Quiz', id },
        { type: 'Quiz', id: 'instructor-list' },
      ],
    }),

    // ---- Questions ----
    listMyQuestions: builder.query<Question[], string>({
      query: (quizId) => `/instructor/quizzes/${quizId}/questions`,
      transformResponse: (response: QuestionListResponse) => unwrap(response),
      providesTags: (_result, _error, quizId) => [{ type: 'Quiz', id: `questions-${quizId}` }],
    }),

    addMyQuestion: builder.mutation<Question, { quizId: string; values: QuestionFormValues }>({
      query: ({ quizId, values }) => ({
        url: `/instructor/quizzes/${quizId}/questions`,
        method: 'POST',
        body: values,
      }),
      transformResponse: (response: QuestionResponse) => unwrap(response),
      invalidatesTags: (_result, _error, { quizId }) => [
        { type: 'Quiz', id: `questions-${quizId}` },
        { type: 'Quiz', id: quizId },
      ],
    }),

    editMyQuestion: builder.mutation<
      Question,
      { quizId: string; questionId: string; values: Partial<QuestionFormValues> }
    >({
      query: ({ quizId, questionId, values }) => ({
        url: `/instructor/quizzes/${quizId}/questions/${questionId}`,
        method: 'PATCH',
        body: values,
      }),
      transformResponse: (response: QuestionResponse) => unwrap(response),
      invalidatesTags: (_result, _error, { quizId }) => [
        { type: 'Quiz', id: `questions-${quizId}` },
        { type: 'Quiz', id: quizId },
      ],
    }),

    deleteMyQuestion: builder.mutation<null, { quizId: string; questionId: string }>({
      query: ({ quizId, questionId }) => ({
        url: `/instructor/quizzes/${quizId}/questions/${questionId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: EmptyResponse) => unwrap(response),
      invalidatesTags: (_result, _error, { quizId }) => [
        { type: 'Quiz', id: `questions-${quizId}` },
        { type: 'Quiz', id: quizId },
      ],
    }),

    bulkUploadQuestions: builder.mutation<
      BulkUploadResult<Question>,
      { quizId: string; file: File }
    >({
      query: ({ quizId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/instructor/quizzes/${quizId}/questions/bulk-csv`,
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: (response: BulkQuestionResponse) => unwrap(response),
      invalidatesTags: (_result, _error, { quizId }) => [
        { type: 'Quiz', id: `questions-${quizId}` },
        { type: 'Quiz', id: quizId },
      ],
    }),

    // ---- Participants ----
    listMyParticipants: builder.query<Participant[], string>({
      query: (quizId) => `/instructor/quizzes/${quizId}/participants`,
      transformResponse: (response: ParticipantListResponse) => unwrap(response),
      providesTags: (_result, _error, quizId) => [{ type: 'Quiz', id: `participants-${quizId}` }],
    }),

    addMyParticipant: builder.mutation<
      { participant: Participant | null; alreadyAssigned: boolean },
      { quizId: string; values: AddParticipantFormValues }
    >({
      query: ({ quizId, values }) => ({
        url: `/instructor/quizzes/${quizId}/participants`,
        method: 'POST',
        body: values,
      }),
      transformResponse: (response: ApiResponse<{ participant: Participant | null; alreadyAssigned: boolean }>) =>
        unwrap(response),
      invalidatesTags: (_result, _error, { quizId }) => [
        { type: 'Quiz', id: `participants-${quizId}` },
        { type: 'Quiz', id: quizId },
      ],
    }),

    removeMyParticipant: builder.mutation<null, { quizId: string; participantId: string }>({
      query: ({ quizId, participantId }) => ({
        url: `/instructor/quizzes/${quizId}/participants/${participantId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: EmptyResponse) => unwrap(response),
      invalidatesTags: (_result, _error, { quizId }) => [
        { type: 'Quiz', id: `participants-${quizId}` },
        { type: 'Quiz', id: quizId },
      ],
    }),

    bulkUploadParticipants: builder.mutation<
      BulkUploadResult<Participant>,
      { quizId: string; file: File }
    >({
      query: ({ quizId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/instructor/quizzes/${quizId}/participants/bulk-csv`,
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: (response: BulkParticipantResponse) => unwrap(response),
      invalidatesTags: (_result, _error, { quizId }) => [
        { type: 'Quiz', id: `participants-${quizId}` },
        { type: 'Quiz', id: quizId },
      ],
    }),
  }),
});

export const {
  useListMyQuizzesQuery,
  useCreateMyQuizMutation,
  useGetMyQuizQuery,
  useEditMyQuizMutation,
  useCancelMyQuizMutation,
  useDeleteMyQuizMutation,
  usePublishMyQuizMutation,
  useListMyQuestionsQuery,
  useAddMyQuestionMutation,
  useEditMyQuestionMutation,
  useDeleteMyQuestionMutation,
  useBulkUploadQuestionsMutation,
  useListMyParticipantsQuery,
  useAddMyParticipantMutation,
  useRemoveMyParticipantMutation,
  useBulkUploadParticipantsMutation,
} = instructorApi;
