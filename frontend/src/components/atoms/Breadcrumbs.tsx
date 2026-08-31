import { Link } from 'react-router-dom';
import type { BreadcrumbItem } from '@/interfaces/instructor';
import './Breadcrumbs.scss';

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/** Breadcrumbs atom — navigation trail for the update-quiz workspace. */
export function Breadcrumbs({ items }: BreadcrumbsProps): JSX.Element {
  return (
    <nav className="qa-breadcrumbs" aria-label="Breadcrumb">
      <ol className="qa-breadcrumbs__list">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="qa-breadcrumbs__item">
              {item.to && !isLast ? (
                <Link to={item.to} className="qa-breadcrumbs__link">
                  {item.label}
                </Link>
              ) : (
                <span className="qa-breadcrumbs__current" aria-current="page">
                  {item.label}
                </span>
              )}
              {!isLast ? <span className="qa-breadcrumbs__sep" aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
