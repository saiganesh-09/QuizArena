import { authApi } from './authApi';
import type { ApiResponse } from '@/types/auth';
import type {
  Quiz,
  QuizListPayload,
  AdminUserListPayload,
} from '@/types/quiz';
import type {
  QuizListQuery,
  UserListQuery,
  QuizFormValues,
  AssignInstructorFormValues,
} from '@/interfaces/quiz';
import { fromDateTimeLocalValue } from '@/utils/date';

/**
 * Admin API slice (RTK Query).
 *
 * Reuses the same baseQuery as authApi (credentials: 'include') by
 * injecting endpoints into the existing authApi. This keeps a single
 * reducer path and a single set of cached tags.
 */

type QuizResponse = ApiResponse<Quiz>;
type QuizListResponse = ApiResponse<QuizListPayload>;
type UserListResponse = ApiResponse<AdminUserListPayload>;
type EmptyResponse = ApiResponse<null>;

function unwrap<T>(envelope: ApiResponse<T>): T {
  if (envelope.success) return envelope.data;
  throw new Error(envelope.error.message);
}

/** Convert form values (datetime-local) to the backend payload shape. */
interface QuizCreatePayload {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

function toCreatePayload(values: QuizFormValues): QuizCreatePayload {
  return {
    title: values.title,
    description: values.description,
    startTime: fromDateTimeLocalValue(values.startTime),
    endTime: fromDateTimeLocalValue(values.endTime),
    durationMinutes: values.durationMinutes,
  };
}

/** Partial payload for edits (only changed fields are sent). */
type QuizEditPayload = Partial<QuizCreatePayload>;

function toEditPayload(values: QuizFormValues): QuizEditPayload {
  const payload: QuizEditPayload = {};
  if (values.title) payload.title = values.title;
  if (values.description !== undefined) payload.description = values.description;
  if (values.startTime) payload.startTime = fromDateTimeLocalValue(values.startTime);
  if (values.endTime) payload.endTime = fromDateTimeLocalValue(values.endTime);
  if (values.durationMinutes) payload.durationMinutes = values.durationMinutes;
  return payload;
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

export const adminApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    // ---- Users ----
    listUsers: builder.query<AdminUserListPayload, UserListQuery | void>({
      query: (arg) => `/admin/users${toQueryString((arg ?? {}) as Record<string, unknown>)}`,
      transformResponse: (response: UserListResponse) => unwrap(response),
      providesTags: [{ type: 'User', id: 'admin-list' }],
    }),

    // ---- Quizzes ----
    listQuizzes: builder.query<QuizListPayload, QuizListQuery | void>({
      query: (arg) => `/admin/quizzes${toQueryString((arg ?? {}) as Record<string, unknown>)}`,
      transformResponse: (response: QuizListResponse) => unwrap(response),
      providesTags: [{ type: 'Quiz', id: 'list' }],
    }),

    getQuiz: builder.query<Quiz, string>({
      query: (id) => `/admin/quizzes/${id}`,
      transformResponse: (response: QuizResponse) => unwrap(response),
      providesTags: (_result, _error, id) => [{ type: 'Quiz', id }],
    }),

    createQuiz: builder.mutation<Quiz, QuizFormValues>({
      query: (values) => ({
        url: '/admin/quizzes',
        method: 'POST',
        body: toCreatePayload(values),
      }),
      transformResponse: (response: QuizResponse) => unwrap(response),
      invalidatesTags: [{ type: 'Quiz', id: 'list' }],
    }),

    editQuiz: builder.mutation<Quiz, { id: string; values: QuizFormValues }>({
      query: ({ id, values }) => ({
        url: `/admin/quizzes/${id}`,
        method: 'PATCH',
        body: toEditPayload(values),
      }),
      transformResponse: (response: QuizResponse) => unwrap(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Quiz', id },
        { type: 'Quiz', id: 'list' },
      ],
    }),

    deleteQuiz: builder.mutation<null, string>({
      query: (id) => ({ url: `/admin/quizzes/${id}`, method: 'DELETE' }),
      transformResponse: (response: EmptyResponse) => unwrap(response),
      invalidatesTags: [{ type: 'Quiz', id: 'list' }],
    }),

    cancelQuiz: builder.mutation<Quiz, string>({
      query: (id) => ({ url: `/admin/quizzes/${id}/cancel`, method: 'POST' }),
      transformResponse: (response: QuizResponse) => unwrap(response),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Quiz', id },
        { type: 'Quiz', id: 'list' },
      ],
    }),

    assignInstructor: builder.mutation<
      Quiz,
      { id: string; values: AssignInstructorFormValues }
    >({
      query: ({ id, values }) => ({
        url: `/admin/quizzes/${id}/assign-instructor`,
        method: 'POST',
        body: values,
      }),
      transformResponse: (response: QuizResponse) => unwrap(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Quiz', id },
        { type: 'Quiz', id: 'list' },
      ],
    }),
  }),
});

export const {
  useListUsersQuery,
  useListQuizzesQuery,
  useGetQuizQuery,
  useCreateQuizMutation,
  useEditQuizMutation,
  useDeleteQuizMutation,
  useCancelQuizMutation,
  useAssignInstructorMutation,
} = adminApi;
