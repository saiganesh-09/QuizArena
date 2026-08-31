import { ScoreRing } from '@/components/atoms/ScoreRing';
import { Button } from '@/components/atoms/Button';
import type { CandidateResult, QuestionReview } from '@/types/quiz';
import { formatDuration } from '@/interfaces/results';
import { formatDateTime } from '@/utils/date';
import './CandidateResultView.scss';

export interface CandidateResultViewProps {
  result: CandidateResult;
  onBack: () => void;
}

/**
 * CandidateResultView organism — the detailed result screen for a
 * candidate after they've submitted their quiz. Shows:
 * - A visual score summary (ScoreRing, correct count, time taken).
 * - A scrolling review of all questions with selected vs correct
 *   answers side-by-side.
 *
 * SECURITY: correct answers are only present because the backend
 * returned them AFTER the candidate submitted their attempt.
 */
export function CandidateResultView({ result, onBack }: CandidateResultViewProps): JSX.Element {
  return (
    <div className="qa-candidate-result">
      {/* Score summary header */}
      <div className="qa-candidate-result__summary">
        <div className="qa-candidate-result__summary-left">
          <h1 className="qa-candidate-result__title">{result.quizTitle}</h1>
          <p className="qa-candidate-result__subtitle">
            {result.autoSubmitted ? 'Auto-submitted (time expired)' : 'Submitted'} on{' '}
            {result.submittedAt ? formatDateTime(result.submittedAt) : '—'}
          </p>
        </div>
        <div className="qa-candidate-result__summary-right">
          <ScoreRing percentage={result.percentage} label="Score" size={100} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="qa-candidate-result__stats">
        <div className="qa-candidate-result__stat">
          <span className="qa-candidate-result__stat-value">
            {result.score} / {result.maxScore}
          </span>
          <span className="qa-candidate-result__stat-label">Total Score</span>
        </div>
        <div className="qa-candidate-result__stat">
          <span className="qa-candidate-result__stat-value">
            {result.correctCount} / {result.totalQuestions}
          </span>
          <span className="qa-candidate-result__stat-label">Correct Answers</span>
        </div>
        <div className="qa-candidate-result__stat">
          <span className="qa-candidate-result__stat-value">
            {formatDuration(result.timeTakenSeconds)}
          </span>
          <span className="qa-candidate-result__stat-label">Time Taken</span>
        </div>
      </div>

      {/* Question-by-question review */}
      <div className="qa-candidate-result__review">
        <h2 className="qa-candidate-result__review-title">Question Review</h2>
        {result.questions.map((q, idx) => (
          <QuestionReviewCard key={q.questionId} question={q} index={idx} />
        ))}
      </div>

      <div className="qa-candidate-result__actions">
        <Button variant="primary" onClick={onBack}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

/** A single question review card showing selected vs correct answers. */
function QuestionReviewCard({ question, index }: { question: QuestionReview; index: number }): JSX.Element {
  const correctSet = new Set(question.correctOptionIds);
  const selectedSet = new Set(question.selectedOptionIds);

  return (
    <div className={`qa-q-review${question.isCorrect ? ' qa-q-review--correct' : ' qa-q-review--incorrect'}`}>
      <div className="qa-q-review__header">
        <span className="qa-q-review__number">Q{index + 1}</span>
        <span className="qa-q-review__text">{question.questionText}</span>
        <span className={`qa-q-review__badge${question.isCorrect ? ' qa-q-review__badge--correct' : ' qa-q-review__badge--incorrect'}`}>
          {question.isCorrect ? '✓ Correct' : '✗ Incorrect'}
        </span>
        <span className="qa-q-review__points">
          {question.awardedPoints} / {question.points} pt
        </span>
      </div>

      <div className="qa-q-review__options">
        {question.options.map((option) => {
          const isSelected = selectedSet.has(option.id);
          const isCorrect = correctSet.has(option.id);
          const className = [
            'qa-q-review__option',
            isSelected ? 'qa-q-review__option--selected' : '',
            isCorrect ? 'qa-q-review__option--correct' : '',
            isSelected && !isCorrect ? 'qa-q-review__option--wrong' : '',
          ].filter(Boolean).join(' ');

          return (
            <div key={option.id} className={className}>
              <span className="qa-q-review__option-marker">
                {isSelected && isCorrect ? '✓' : isSelected && !isCorrect ? '✗' : isCorrect ? '✓' : '○'}
              </span>
              <span className="qa-q-review__option-text">{option.text}</span>
              <span className="qa-q-review__option-tags">
                {isSelected ? <span className="qa-q-review__tag qa-q-review__tag--selected">Your answer</span> : null}
                {isCorrect ? <span className="qa-q-review__tag qa-q-review__tag--correct">Correct</span> : null}
              </span>
            </div>
          );
        })}
      </div>

      {question.selectedOptionIds.length === 0 ? (
        <p className="qa-q-review__unanswered">You did not answer this question.</p>
      ) : null}
    </div>
  );
}
