import { useNavigate, Link } from 'react-router-dom';
import { LiveClock } from '@/components/atoms/LiveClock';
import { Button } from '@/components/atoms/Button';
import { ThemeToggle } from '@/components/atoms/ThemeToggle';
import { useLogoutMutation, authApi } from '@/store/api/authApi';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { clearUser } from '@/store/slices/authSlice';
import './Navbar.scss';

/**
 * Navbar organism — shown on authenticated routes. Displays the brand,
 * the signed-in user's name/role, a live updating clock, and a logout
 * button that clears Redux state and invokes the backend logout to
 * destroy the HTTP-only cookie.
 */
export function Navbar(): JSX.Element {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [logout, { isLoading }] = useLogoutMutation();

  async function handleLogout(): Promise<void> {
    // 1. Clear the auth slice immediately so UI is unauthenticated.
    dispatch(clearUser());
    // 2. Reset the entire RTK Query cache so no stale cached data
    //    (getMe, quizzes, results, etc.) can re-hydrate the user.
    dispatch(authApi.util.resetApiState());
    // 3. Ask the backend to clear the HTTP-only cookie.
    try {
      await logout().unwrap();
    } catch {
      // Even if the network call fails, local state is already cleared.
    } finally {
      navigate('/login');
    }
  }

  return (
    <header className="qa-navbar">
      <div className="qa-navbar__inner">
        <Link to="/dashboard" className="qa-navbar__brand">
          <span className="qa-navbar__brand-mark">Q</span>
          <span className="qa-navbar__brand-text">QuizArena</span>
        </Link>

        <div className="qa-navbar__right">
          <ThemeToggle />
          <LiveClock />
          {user ? (
            <div className="qa-navbar__user">
              <span className="qa-navbar__user-name">{user.name}</span>
              <span className="qa-navbar__user-role">{user.role}</span>
            </div>
          ) : null}
          {user?.role === 'admin' ? (
            <Link to="/admin/dashboard" className="qa-navbar__admin-link">
              Admin
            </Link>
          ) : null}
          {user?.role === 'instructor' ? (
            <Link to="/instructor/dashboard" className="qa-navbar__admin-link">
              Instructor
            </Link>
          ) : null}
          {user?.role === 'candidate' ? (
            <Link to="/candidate/dashboard" className="qa-navbar__admin-link">
              Dashboard
            </Link>
          ) : null}
          <Button variant="danger" onClick={handleLogout} isLoading={isLoading}>
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
