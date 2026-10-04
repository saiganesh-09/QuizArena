import { NavLink } from 'react-router-dom';
import './InstructorSidebar.scss';

/**
 * InstructorSidebar organism — navigation for the instructor section.
 * Mirrors the AdminSidebar structure with instructor-specific links.
 */
export function InstructorSidebar(): JSX.Element {
  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    `qa-instructor-sidebar__link${isActive ? ' qa-instructor-sidebar__link--active' : ''}`;

  return (
    <aside className="qa-instructor-sidebar">
      <div className="qa-instructor-sidebar__brand">
        <span className="qa-instructor-sidebar__brand-mark">Q</span>
        <div className="qa-instructor-sidebar__brand-text">
          <span className="qa-instructor-sidebar__brand-name">QuizArena</span>
          <span className="qa-instructor-sidebar__brand-role">Instructor</span>
        </div>
      </div>

      <nav className="qa-instructor-sidebar__nav" aria-label="Instructor navigation">
        <NavLink to="/instructor/dashboard" className={linkClass}>
          <span className="qa-instructor-sidebar__icon" aria-hidden="true">▦</span>
          Dashboard
        </NavLink>
        <NavLink to="/instructor/quizzes" className={linkClass}>
          <span className="qa-instructor-sidebar__icon" aria-hidden="true">📋</span>
          My Quizzes
        </NavLink>
        <NavLink to="/instructor/homework" className={linkClass}>
          <span className="qa-instructor-sidebar__icon" aria-hidden="true">📝</span>
          Homework
        </NavLink>
        <NavLink to="/instructor/analytics" className={linkClass}>
          <span className="qa-instructor-sidebar__icon" aria-hidden="true">📊</span>
          Analytics
        </NavLink>
      </nav>
    </aside>
  );
}
