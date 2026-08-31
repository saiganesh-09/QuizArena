import { configureStore, Middleware } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { authApi } from './api/authApi';
import { setUser, clearUser } from './slices/authSlice';
import type { UserProfile } from '@/types/auth';

/**
 * Redux store.
 *
 * A middleware listens to authApi lifecycle actions to keep the authSlice
 * in sync with successful login/signup/logout results, so UI guards have
 * a synchronous source of truth for the current user.
 */
const authSyncMiddleware: Middleware = (api) => (next) => (action) => {
  const result = next(action);

  // After a successful login/signup, mirror the user into the slice.
  if (authApi.endpoints.login.matchFulfilled(action)) {
    api.dispatch(setUser(action.payload as UserProfile));
  }
  if (authApi.endpoints.signup.matchFulfilled(action)) {
    api.dispatch(setUser(action.payload as UserProfile));
  }
  // After a successful logout, clear the slice.
  if (authApi.endpoints.logout.matchFulfilled(action)) {
    api.dispatch(clearUser());
  }
  // If getMe fails (401), mark unauthenticated.
  if (authApi.endpoints.getMe.matchRejected(action)) {
    api.dispatch(clearUser());
  }
  // If getMe succeeds, mirror the user into the slice.
  if (authApi.endpoints.getMe.matchFulfilled(action)) {
    api.dispatch(setUser(action.payload as UserProfile));
  }

  return result;
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, authSyncMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
