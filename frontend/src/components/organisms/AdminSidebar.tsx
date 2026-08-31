import { NavLink } from 'react-router-dom';
import './AdminSidebar.scss';

/**
 * AdminSidebar organism — navigation for the admin section.
 * Highlights the active route via NavLink.
 */
export function AdminSidebar(): JSX.Element {
  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    `qa-admin-sidebar__link${isActive ? ' qa-admin-sidebar__link--active' : ''}`;

  return (
    <aside className="qa-admin-sidebar">
      <div className="qa-admin-sidebar__brand">
        <span className="qa-admin-sidebar__brand-mark">Q</span>
        <div className="qa-admin-sidebar__brand-text">
          <span className="qa-admin-sidebar__brand-name">QuizArena</span>
          <span className="qa-admin-sidebar__brand-role">Admin</span>
        </div>
      </div>

      <nav className="qa-admin-sidebar__nav" aria-label="Admin navigation">
        <NavLink to="/admin/dashboard" className={linkClass}>
          <span className="qa-admin-sidebar__icon" aria-hidden="true">▦</span>
          Dashboard
        </NavLink>
        <NavLink to="/admin/quizzes" className={linkClass}>
          <span className="qa-admin-sidebar__icon" aria-hidden="true">📋</span>
          Quizzes
        </NavLink>
        <NavLink to="/admin/quizzes/new" className={linkClass}>
          <span className="qa-admin-sidebar__icon" aria-hidden="true">＋</span>
          Create Quiz
        </NavLink>
        <NavLink to="/admin/users" className={linkClass}>
          <span className="qa-admin-sidebar__icon" aria-hidden="true">👥</span>
          Users
        </NavLink>
        <NavLink to="/admin/analytics" className={linkClass}>
          <span className="qa-admin-sidebar__icon" aria-hidden="true">📊</span>
          Analytics
        </NavLink>
      </nav>
    </aside>
  );
}
