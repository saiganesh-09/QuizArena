import { useEffect, useState } from 'react';
import { useGetMeQuery } from '@/store/api/authApi';
import { useAppDispatch } from '@/hooks/redux';
import { setAuthLoading, setUser, clearUser } from '@/store/slices/authSlice';
import type { UserProfile } from '@/types/auth';

/**
 * useAuthBoot — kicks off the getMe query on app mount to hydrate the
 * auth slice from the existing HTTP-only cookie. Returns a boolean
 * indicating when the initial check has settled (success or failure),
 * so the router can decide whether to render protected content or
 * redirect to login without flicker.
 */
export function useAuthBoot(): { bootstrapped: boolean } {
  const dispatch = useAppDispatch();
  const [bootstrapped, setBootstrapped] = useState<boolean>(false);

  // skip=false so the query runs immediately on mount.
  const { data, isError, isLoading } = useGetMeQuery(undefined, {
    skip: false,
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
