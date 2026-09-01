import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '@/utils/env';
import type { UserProfile, ApiResponse } from '@/types/auth';
import type { LoginFormData, SignupFormData } from '@/interfaces/auth';

/**
 * Auth API slice (RTK Query).
 *
 * All requests include credentials so the HTTP-only JWT cookie is sent
 * with every call. The token itself is never read by JS.
 *
 * Note: the backend returns { success, data } envelopes. We unwrap them
 * via `transformResponse` so the hooks expose the inner `data` directly.
 */

/** Inner payload returned by signup/login (a user profile). */
type ProfileResponse = ApiResponse<UserProfile>;
type EmptyResponse = ApiResponse<null>;

function unwrap<T>(envelope: ApiResponse<T>): T {
  if (envelope.success) return envelope.data;
  // Should not happen for 2xx, but guard anyway.
  throw new Error(envelope.error.message);
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: env.VITE_API_BASE_URL,
    credentials: 'include', // send/receive HTTP-only cookies
  }),
  tagTypes: ['User', 'Quiz'],
  endpoints: (builder) => ({
    signup: builder.mutation<UserProfile, SignupFormData>({
      query: (body) => ({
        url: '/auth/signup',
        method: 'POST',
        body: {
          name: body.name,
          email: body.email,
          password: body.password,
        },
      }),
      transformResponse: (response: ProfileResponse) => unwrap(response),
      invalidatesTags: [{ type: 'User', id: 'me' }],
    }),

    login: builder.mutation<UserProfile, LoginFormData>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ProfileResponse) => unwrap(response),
      invalidatesTags: [{ type: 'User', id: 'me' }],
    }),

    logout: builder.mutation<null, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      transformResponse: (response: EmptyResponse) => unwrap(response),
      // Do NOT invalidateTags here — invalidating 'User' would trigger
      // getMe to refetch, which races with the cookie being cleared and
      // can re-authenticate the user (the "logout blink" bug).
    }),

    getMe: builder.query<UserProfile, void>({
      query: () => '/auth/me',
      transformResponse: (response: ProfileResponse) => unwrap(response),
      providesTags: [{ type: 'User', id: 'me' }],
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  usePrefetch,
} = authApi;
