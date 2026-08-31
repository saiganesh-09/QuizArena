import { Outlet } from 'react-router-dom';
import { InstructorSidebar } from './InstructorSidebar';
import { Navbar } from './Navbar';
import { useMobileSidebar } from '@/hooks/useMobileSidebar';
import './InstructorLayout.scss';

/**
 * InstructorLayout organism — wraps all /instructor/* routes with the
 * instructor sidebar and the authenticated Navbar. On mobile, the
 * sidebar is toggled by a hamburger button.
 */
export function InstructorLayout(): JSX.Element {
  const { isOpen, toggle, close } = useMobileSidebar();

  return (
    <div className="qa-instructor-layout">
      <button
        type="button"
        className="qa-instructor-layout__hamburger"
        onClick={toggle}
        aria-label="Toggle sidebar"
        aria-expanded={isOpen}
      >
        ☰
      </button>
      {isOpen ? <div className="qa-instructor-layout__backdrop" onClick={close} /> : null}
      <div className={`qa-instructor-layout__sidebar${isOpen ? ' qa-instructor-layout__sidebar--open' : ''}`}>
        <InstructorSidebar />
      </div>
      <div className="qa-instructor-layout__main">
        <Navbar />
        <div className="qa-instructor-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
