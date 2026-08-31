import './ReadinessBadge.scss';
import type { ReadinessBadgeProps } from '@/interfaces/instructor';

/**
 * ReadinessBadge atom — shows whether a quiz is ready to publish,
 * with a tooltip/list of missing requirements when not ready.
 */
export function ReadinessBadge({ ready, missing }: ReadinessBadgeProps): JSX.Element {
  return (
    <div className={`qa-readiness${ready ? ' qa-readiness--ready' : ' qa-readiness--not-ready'}`}>
      <span className="qa-readiness__icon" aria-hidden="true">
        {ready ? '✓' : '⚠'}
      </span>
      <div className="qa-readiness__body">
        <span className="qa-readiness__label">
          {ready ? 'Ready to publish' : 'Not ready to publish'}
        </span>
        {!ready && missing.length > 0 ? (
          <ul className="qa-readiness__missing">
            {missing.map((m, idx) => (
              <li key={idx} className="qa-readiness__missing-item">
                {m}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
