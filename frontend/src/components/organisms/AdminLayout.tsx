import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Navbar } from './Navbar';
import { useMobileSidebar } from '@/hooks/useMobileSidebar';
import './AdminLayout.scss';

/**
 * AdminLayout organism — wraps all /admin/* routes with the admin
 * sidebar and the authenticated Navbar. On mobile, the sidebar is
 * toggled by a hamburger button and overlays the content.
 */
export function AdminLayout(): JSX.Element {
  const { isOpen, toggle, close } = useMobileSidebar();

  return (
    <div className="qa-admin-layout">
      <button
        type="button"
        className="qa-admin-layout__hamburger"
        onClick={toggle}
        aria-label="Toggle sidebar"
        aria-expanded={isOpen}
      >
        ☰
      </button>
      {isOpen ? <div className="qa-admin-layout__backdrop" onClick={close} /> : null}
      <div className={`qa-admin-layout__sidebar${isOpen ? ' qa-admin-layout__sidebar--open' : ''}`}>
        <AdminSidebar />
      </div>
      <div className="qa-admin-layout__main">
        <Navbar />
        <div className="qa-admin-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
