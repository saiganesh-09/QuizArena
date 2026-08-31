import { useState, useCallback } from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { CountdownTimer } from '@/components/atoms/CountdownTimer';
import { formatDateTime } from '@/utils/date';
import type { CandidateQuizMeta } from '@/types/quiz';
import './UpcomingQuizCard.scss';

export interface UpcomingQuizCardProps {
  quiz: CandidateQuizMeta;
  onStart: (quiz: CandidateQuizMeta) => void;
}

/**
 * UpcomingQuizCard organism — displays key metadata for an upcoming quiz
 * with correct color coding and a real-time countdown timer to the
 * scheduled start time. The "Start Test" button stays disabled until
 * the current time enters the live scheduled window.
 */
export function UpcomingQuizCard({ quiz, onStart }: UpcomingQuizCardProps): JSX.Element {
  // Track whether the live window has opened. The CountdownTimer fires
  // onZero when the countdown reaches the start time.
  const [liveOpen, setLiveOpen] = useState<boolean>(quiz.isLiveNow);

  const handleZero = useCallback(() => {
    setLiveOpen(true);
  }, []);

  const canStart = liveOpen && quiz.status !== 'cancelled' && quiz.status !== 'completed';

  return (
    <article className={`qa-upcoming-card qa-upcoming-card--${quiz.status}`}>
      <div className="qa-upcoming-card__header">
        <h3 className="qa-upcoming-card__title">{quiz.title}</h3>
        <Badge status={quiz.status} />
      </div>

      {quiz.description ? (
        <p className="qa-upcoming-card__description">{quiz.description}</p>
      ) : null}

      <div className="qa-upcoming-card__meta">
        <div className="qa-upcoming-card__meta-item">
          <span className="qa-upcoming-card__meta-label">Starts</span>
          <span className="qa-upcoming-card__meta-value">{formatDateTime(quiz.startTime)}</span>
        </div>
        <div className="qa-upcoming-card__meta-item">
          <span className="qa-upcoming-card__meta-label">Duration</span>
          <span className="qa-upcoming-card__meta-value">{quiz.durationMinutes} min</span>
        </div>
        <div className="qa-upcoming-card__meta-item">
          <span className="qa-upcoming-card__meta-label">Questions</span>
          <span className="qa-upcoming-card__meta-value">{quiz.questionCount}</span>
        </div>
      </div>

      <div className="qa-upcoming-card__countdown">
        {!liveOpen ? (
          <>
            <span className="qa-upcoming-card__countdown-label">Starts in</span>
            <CountdownTimer targetTime={quiz.startTime} onZero={handleZero} />
          </>
        ) : (
          <span className="qa-upcoming-card__live-now">● Live now — you can start the test</span>
        )}
      </div>

      <div className="qa-upcoming-card__action">
        <Button
          variant="primary"
          onClick={() => onStart(quiz)}
          disabled={!canStart}
          title={!canStart ? 'The test will be available when the live window opens' : 'Start the test'}
        >
          Start Test
        </Button>
      </div>
    </article>
  );
}
