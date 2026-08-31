import { NavLink } from 'react-router-dom';
import './CandidateSidebar.scss';

/**
 * CandidateSidebar organism — navigation for the candidate section.
 * Mirrors the admin/instructor sidebar structure with candidate links.
 */
export function CandidateSidebar(): JSX.Element {
  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    `qa-candidate-sidebar__link${isActive ? ' qa-candidate-sidebar__link--active' : ''}`;

  return (
    <aside className="qa-candidate-sidebar">
      <div className="qa-candidate-sidebar__brand">
        <span className="qa-candidate-sidebar__brand-mark">Q</span>
        <div className="qa-candidate-sidebar__brand-text">
          <span className="qa-candidate-sidebar__brand-name">QuizArena</span>
          <span className="qa-candidate-sidebar__brand-role">Candidate</span>
        </div>
      </div>

      <nav className="qa-candidate-sidebar__nav" aria-label="Candidate navigation">
        <NavLink to="/candidate/dashboard" className={linkClass}>
          <span className="qa-candidate-sidebar__icon" aria-hidden="true">▦</span>
          Dashboard
        </NavLink>
        <NavLink to="/candidate/quizzes" className={linkClass}>
          <span className="qa-candidate-sidebar__icon" aria-hidden="true">📋</span>
          My Quizzes
        </NavLink>
      </nav>
    </aside>
  );
}
