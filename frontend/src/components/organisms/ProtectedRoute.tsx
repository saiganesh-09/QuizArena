import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { Spinner } from '@/components/atoms/Spinner';
import type { UserRole } from '@/types/auth';

export interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional role restriction; if omitted, any authenticated user may pass. */
  allowedRoles?: UserRole[];
}

/**
 * ProtectedRoute — guards routes that require authentication.
 *
 * Behavior:
 * - While the initial auth boot check is in flight, show a spinner.
 * - If unauthenticated, redirect to /login preserving the intended path.
 * - If allowedRoles is set and the user's role is not permitted, redirect
 *   to /dashboard (authenticated but unauthorized).
 */
export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps): JSX.Element {
  const location = useLocation();
  const { user, status } = useAppSelector((state) => state.auth);

  // 'loading' covers the getMe boot check; 'idle' is the pre-boot state.
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="qa-protected-loading" role="status" aria-live="polite">
        <Spinner size="lg" label="Checking your session" />
      </div>
    );
  }

  if (!user || status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
