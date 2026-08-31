import { QuestionStatusDot } from '@/components/atoms/QuestionStatusDot';
import { Button } from '@/components/atoms/Button';
import type { AttemptQuestion } from '@/types/quiz';
import type { NavStatusMap } from '@/interfaces/attempt';
import './QuestionNavigator.scss';

export interface QuestionNavigatorProps {
  questions: AttemptQuestion[];
  navStatus: NavStatusMap;
  currentIndex: number;
  answeredCount: number;
  onJumpTo: (index: number) => void;
  onSubmit: () => void;
}

/**
 * QuestionNavigator organism — sidebar showing question status dots
 * with clear colors: Not Visited (gray), Visited (blue), Answered (green).
 * Includes a legend and a submit button.
 */
export function QuestionNavigator({
  questions,
  navStatus,
  currentIndex,
  answeredCount,
  onJumpTo,
  onSubmit,
}: QuestionNavigatorProps): JSX.Element {
  const total = questions.length;
  const notVisited = total - answeredCount - Object.values(navStatus).filter((s) => s === 'visited').length;

  return (
    <aside className="qa-question-navigator">
      <div className="qa-question-navigator__header">
        <h3 className="qa-question-navigator__title">Question Navigator</h3>
        <div className="qa-question-navigator__summary">
          <span className="qa-question-navigator__summary-item">
            <span className="qa-question-navigator__summary-value">{answeredCount}</span> answered
          </span>
          <span className="qa-question-navigator__summary-item">
            <span className="qa-question-navigator__summary-value">{notVisited}</span> not visited
          </span>
        </div>
      </div>

      <div className="qa-question-navigator__grid">
        {questions.map((q, idx) => (
          <QuestionStatusDot
            key={q.id}
            status={navStatus[q.id] ?? 'not-visited'}
            label={q.text.slice(0, 60)}
            index={idx}
            active={idx === currentIndex}
            onClick={() => onJumpTo(idx)}
          />
        ))}
      </div>

      <div className="qa-question-navigator__legend">
        <div className="qa-question-navigator__legend-item">
          <span className="qa-question-navigator__legend-dot qa-question-navigator__legend-dot--not-visited" />
          Not Visited
        </div>
        <div className="qa-question-navigator__legend-item">
          <span className="qa-question-navigator__legend-dot qa-question-navigator__legend-dot--visited" />
          Visited
        </div>
        <div className="qa-question-navigator__legend-item">
          <span className="qa-question-navigator__legend-dot qa-question-navigator__legend-dot--answered" />
          Answered
        </div>
      </div>

      <Button variant="primary" onClick={onSubmit} className="qa-question-navigator__submit">
        Submit Test
      </Button>
    </aside>
  );
}
