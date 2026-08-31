import { Link } from 'react-router-dom';
import './NotFoundPage.scss';

/** 404 page for unmatched routes. */
export function NotFoundPage(): JSX.Element {
  return (
    <main className="qa-not-found">
      <h1 className="qa-not-found__code">404</h1>
      <p className="qa-not-found__text">The page you were looking for does not exist.</p>
      <Link to="/login" className="qa-not-found__link">
        Back to login
      </Link>
    </main>
  );
}
