import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState } from '@/interfaces/auth';
import type { UserProfile } from '@/types/auth';

/**
 * Auth slice.
 *
 * Holds the cached user profile and a coarse status flag. The actual API
 * calls live in authApi (RTK Query); this slice mirrors the result into
 * a synchronous state that UI guards (e.g. protected routes) can read.
 *
 * The user is hydrated by listening to authApi lifecycle events in the
 * store setup (see store/index.ts) and via the useGetMeQuery hook.
 */
const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Set the authenticated user (e.g. after a successful login/signup). */
    setUser(state, action: PayloadAction<UserProfile>) {
      state.user = action.payload;
      state.status = 'authenticated';
      state.error = null;
    },
    /** Clear the authenticated user (e.g. after logout). */
    clearUser(state) {
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;
    },
    /** Set an auth-related error message. */
    setAuthError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    /** Mark the slice as loading (e.g. during getMe on app boot). */
    setAuthLoading(state) {
      state.status = 'loading';
    },
  },
});

export const { setUser, clearUser, setAuthError, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
