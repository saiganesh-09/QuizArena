import type { ReactNode } from 'react';
import './EmptyState.scss';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

/**
 * EmptyState atom — a friendly placeholder for "no quizzes" and
 * "no search results" states. Optionally renders a call-to-action.
 */
export function EmptyState({ icon, title, message, action }: EmptyStateProps): JSX.Element {
  return (
    <div className="qa-empty-state" role="status">
      {icon ? <div className="qa-empty-state__icon">{icon}</div> : null}
      <h3 className="qa-empty-state__title">{title}</h3>
      {message ? <p className="qa-empty-state__message">{message}</p> : null}
      {action ? <div className="qa-empty-state__action">{action}</div> : null}
    </div>
  );
}
