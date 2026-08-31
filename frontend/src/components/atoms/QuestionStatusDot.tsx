import type { QuestionNavStatus } from '@/interfaces/attempt';
import './QuestionStatusDot.scss';

export interface QuestionStatusDotProps {
  status: QuestionNavStatus;
  label: string;
  index: number;
  active: boolean;
  onClick: () => void;
}

/**
 * QuestionStatusDot atom — a single dot in the question navigator.
 * Colors:
 * - not-visited: gray (default)
 * - visited: blue (seen but not answered)
 * - answered: green (visited + answered)
 */
export function QuestionStatusDot({
  status,
  label,
  index,
  active,
  onClick,
}: QuestionStatusDotProps): JSX.Element {
  return (
    <button
      type="button"
      className={`qa-q-dot qa-q-dot--${status}${active ? ' qa-q-dot--active' : ''}`}
      onClick={onClick}
      title={`Q${index + 1}: ${label}`}
      aria-label={`Question ${index + 1}, status: ${status}`}
    >
      {index + 1}
    </button>
  );
}
