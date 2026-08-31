import { Button } from '@/components/atoms/Button';
import type { AttemptQuestion } from '@/types/quiz';
import './QuestionPanel.scss';

export interface QuestionPanelProps {
  question: AttemptQuestion;
  index: number;
  total: number;
  selectedOptionIds: string[];
  onSelectionChange: (optionIds: string[]) => void;
  onPrev: () => void;
  onNext: () => void;
  onMarkForReview?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * QuestionPanel organism — displays the current question text and
 * option selectors. Supports single-choice (radio), multi-select
 * (checkbox), and true-false (radio) question types.
 */
export function QuestionPanel({
  question,
  index,
  total,
  selectedOptionIds,
  onSelectionChange,
  onPrev,
  onNext,
  isFirst,
  isLast,
}: QuestionPanelProps): JSX.Element {
  const isMultiSelect = question.type === 'multi-select';

  function toggleOption(optionId: string): void {
    if (isMultiSelect) {
      // Multi-select: toggle membership.
      if (selectedOptionIds.includes(optionId)) {
        onSelectionChange(selectedOptionIds.filter((id) => id !== optionId));
      } else {
        onSelectionChange([...selectedOptionIds, optionId]);
      }
    } else {
      // Single-choice / true-false: replace selection.
      onSelectionChange([optionId]);
    }
  }

  function clearSelection(): void {
    onSelectionChange([]);
  }

  return (
    <div className="qa-question-panel">
      <div className="qa-question-panel__header">
        <span className="qa-question-panel__number">
          Question {index + 1} of {total}
        </span>
        <div className="qa-question-panel__meta">
          <span className="qa-question-panel__type">
            {question.type === 'single-choice' ? 'Single Choice' : question.type === 'multi-select' ? 'Multi Select' : 'True / False'}
          </span>
          <span className="qa-question-panel__points">{question.points} pt</span>
        </div>
      </div>

      <div className="qa-question-panel__body">
        <p className="qa-question-panel__text">{question.text}</p>

        <div className="qa-question-panel__options">
          {question.options.map((option) => {
            const isSelected = selectedOptionIds.includes(option.id);
            return (
              <label
                key={option.id}
                className={`qa-question-panel__option${isSelected ? ' qa-question-panel__option--selected' : ''}`}
              >
                <input
                  type={isMultiSelect ? 'checkbox' : 'radio'}
                  name={`question-${question.id}`}
                  className="qa-question-panel__option-input"
                  checked={isSelected}
                  onChange={() => toggleOption(option.id)}
                />
                <span className="qa-question-panel__option-marker">
                  {isMultiSelect ? (isSelected ? '☑' : '☐') : (isSelected ? '◉' : '○')}
                </span>
                <span className="qa-question-panel__option-text">{option.text}</span>
              </label>
            );
          })}
        </div>

        {selectedOptionIds.length > 0 ? (
          <button
            type="button"
            className="qa-question-panel__clear"
            onClick={clearSelection}
          >
            Clear selection
          </button>
        ) : null}
      </div>

      <div className="qa-question-panel__nav">
        <Button variant="secondary" onClick={onPrev} disabled={isFirst}>
          ← Previous
        </Button>
        <Button variant="primary" onClick={onNext} disabled={isLast}>
          {isLast ? 'Last Question' : 'Next →'}
        </Button>
      </div>
    </div>
  );
}
