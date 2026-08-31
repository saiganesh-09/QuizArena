import { Button } from '@/components/atoms/Button';
import type { AttemptPayload } from '@/types/quiz';
import { formatDateTime } from '@/utils/date';
import './PostSubmitScreen.scss';

export interface PostSubmitScreenProps {
  attempt: AttemptPayload;
  onBackToDashboard: () => void;
  onViewResults?: () => void;
}

/**
 * PostSubmitScreen organism — shown after the candidate submits their
 * test (manually or auto-submitted). Displays the final score and
 * blocks any re-entry to the test screen.
 */
export function PostSubmitScreen({ attempt, onBackToDashboard, onViewResults }: PostSubmitScreenProps): JSX.Element {
  const percentage = attempt.maxScore > 0
    ? Math.round((attempt.score / attempt.maxScore) * 100)
    : 0;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const totalCount = attempt.answers.length;

  return (
    <div className="qa-post-submit">
      <div className="qa-post-submit__card">
        <div className="qa-post-submit__icon">
          {attempt.autoSubmitted ? '⏱' : '✓'}
        </div>
        <h1 className="qa-post-submit__title">
          {attempt.autoSubmitted ? 'Time Up — Auto Submitted' : 'Test Submitted!'}
        </h1>
        <p className="qa-post-submit__quiz-title">{attempt.quizTitle}</p>

        <div className="qa-post-submit__score">
          <div className="qa-post-submit__score-main">
            <span className="qa-post-submit__score-value">{attempt.score}</span>
            <span className="qa-post-submit__score-max">/ {attempt.maxScore}</span>
          </div>
          <span className="qa-post-submit__score-percent">{percentage}%</span>
        </div>

        <div className="qa-post-submit__breakdown">
          <div className="qa-post-submit__breakdown-item">
            <span className="qa-post-submit__breakdown-value">{correctCount}</span>
            <span className="qa-post-submit__breakdown-label">Correct</span>
          </div>
          <div className="qa-post-submit__breakdown-item">
            <span className="qa-post-submit__breakdown-value">{totalCount - correctCount}</span>
            <span className="qa-post-submit__breakdown-label">Incorrect / Unanswered</span>
          </div>
          <div className="qa-post-submit__breakdown-item">
            <span className="qa-post-submit__breakdown-value">{totalCount}</span>
            <span className="qa-post-submit__breakdown-label">Total Questions</span>
          </div>
        </div>

        <div className="qa-post-submit__meta">
          <div className="qa-post-submit__meta-row">
            <span className="qa-post-submit__meta-label">Submitted at</span>
            <span className="qa-post-submit__meta-value">
              {attempt.submittedAt ? formatDateTime(attempt.submittedAt) : '—'}
            </span>
          </div>
        </div>

        <div className="qa-post-submit__notice">
          Your answers have been recorded. You cannot re-enter the test.
        </div>

        <div className="qa-post-submit__buttons">
          <Button variant="secondary" onClick={onBackToDashboard}>
            Back to Dashboard
          </Button>
          {onViewResults ? (
            <Button variant="primary" onClick={onViewResults}>
              View Results
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
