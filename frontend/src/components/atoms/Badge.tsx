import type { QuizStatus } from '@/types/quiz';
import { statusLabel } from '@/utils/date';
import './Badge.scss';

/** Visual tone for a badge, derived from the quiz status. */
type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  status: QuizStatus;
}

/** Map a quiz status to a visual tone for color-coding. */
function toneForStatus(status: QuizStatus): BadgeTone {
  switch (status) {
    case 'draft':
      return 'neutral';
    case 'scheduled':
      return 'info';
    case 'live':
      return 'success';
    case 'completed':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** Status badge atom — color-coded pill reflecting the quiz lifecycle state. */
export function Badge({ status }: BadgeProps): JSX.Element {
  const tone = toneForStatus(status);
  return (
    <span className={`qa-badge qa-badge--${tone}`} title={`Status: ${statusLabel(status)}`}>
      <span className="qa-badge__dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
