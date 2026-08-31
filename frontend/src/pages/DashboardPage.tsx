import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { Navbar } from '@/components/organisms/Navbar';
import './DashboardPage.scss';

/**
 * Dashboard page — the post-login landing screen.
 *
 * Redirects authenticated users to their role-specific dashboard:
 * - admin     -> /admin/dashboard
 * - instructor -> /instructor/dashboard
 * - candidate -> /candidate/dashboard
 *
 * Falls back to a welcome panel if the role is unrecognized (e.g. during
 * a brief hydration window).
 */
export function DashboardPage(): JSX.Element {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    switch (user.role) {
      case 'admin':
        void navigate('/admin/dashboard', { replace: true });
        return;
      case 'instructor':
        void navigate('/instructor/dashboard', { replace: true });
        return;
      case 'candidate':
        void navigate('/candidate/dashboard', { replace: true });
        return;
      default:
        return;
    }
  }, [user, navigate]);

  return (
    <div className="qa-dashboard">
      <Navbar />
      <main className="qa-dashboard__main">
        <div className="qa-dashboard__panel">
          <h1 className="qa-dashboard__title">
            Welcome, {user?.name ?? 'user'} 👋
          </h1>
          <p className="qa-dashboard__subtitle">
            You are signed in as <strong>{user?.role ?? 'candidate'}</strong>.
          </p>
          <p className="qa-dashboard__hint">
            Redirecting you to your dashboard…
          </p>
        </div>
      </main>
    </div>
  );
}
