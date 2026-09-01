import { useEffect, useState } from 'react';
import { useGetMeQuery } from '@/store/api/authApi';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setAuthLoading, setUser, clearUser } from '@/store/slices/authSlice';
import type { UserProfile } from '@/types/auth';

/**
 * useAuthBoot — kicks off the getMe query on app mount to hydrate the
 * auth slice from the existing HTTP-only cookie. Returns a boolean
 * indicating when the initial check has settled (success or failure),
 * so the router can decide whether to render protected content or
 * redirect to login without flicker.
 *
 * IMPORTANT: This only runs the getMe query once on initial mount.
 * If the user is already unauthenticated (e.g. after logout), the
 * query is skipped to prevent re-authentication races.
 */
export function useAuthBoot(): { bootstrapped: boolean } {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector((state) => state.auth.status);
  const [bootstrapped, setBootstrapped] = useState<boolean>(false);

  // Skip the getMe query if the user is already unauthenticated (e.g.
  // after a logout). This prevents the "logout blink" where getMe
  // refetches with a stale cookie and re-authenticates the user.
  const skip = authStatus === 'unauthenticated';

  const { data, isError, isLoading } = useGetMeQuery(undefined, {
    skip,
  });

  useEffect(() => {
    if (isLoading) {
      dispatch(setAuthLoading());
      return;
    }
    if (data) {
      dispatch(setUser(data as UserProfile));
    } else if (isError) {
      dispatch(clearUser());
    }
    setBootstrapped(true);
  }, [data, isError, isLoading, dispatch]);

  return { bootstrapped };
}
