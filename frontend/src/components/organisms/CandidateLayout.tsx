import { Outlet } from 'react-router-dom';
import { CandidateSidebar } from './CandidateSidebar';
import { Navbar } from './Navbar';
import { useMobileSidebar } from '@/hooks/useMobileSidebar';
import './CandidateLayout.scss';

/**
 * CandidateLayout organism — wraps all /candidate/* routes with the
 * candidate sidebar and the authenticated Navbar. On mobile, the
 * sidebar is toggled by a hamburger button.
 */
export function CandidateLayout(): JSX.Element {
  const { isOpen, toggle, close } = useMobileSidebar();

  return (
    <div className="qa-candidate-layout">
      <button
        type="button"
        className="qa-candidate-layout__hamburger"
        onClick={toggle}
        aria-label="Toggle sidebar"
        aria-expanded={isOpen}
      >
        ☰
      </button>
      {isOpen ? <div className="qa-candidate-layout__backdrop" onClick={close} /> : null}
      <div className={`qa-candidate-layout__sidebar${isOpen ? ' qa-candidate-layout__sidebar--open' : ''}`}>
        <CandidateSidebar />
      </div>
      <div className="qa-candidate-layout__main">
        <Navbar />
        <div className="qa-candidate-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
