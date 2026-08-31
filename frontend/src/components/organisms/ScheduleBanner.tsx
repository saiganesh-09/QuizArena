import { Badge } from '@/components/atoms/Badge';
import { formatDateTime } from '@/utils/date';
import type { InstructorQuiz } from '@/types/quiz';
import './ScheduleBanner.scss';

export interface ScheduleBannerProps {
  quiz: InstructorQuiz;
}

/**
 * ScheduleBanner organism — a color-coded banner showing the quiz's
 * schedule window and current status. The color changes dynamically
 * based on the quiz state (draft=neutral, scheduled=info, live=success,
 * completed=warning, cancelled=danger).
 */
export function ScheduleBanner({ quiz }: ScheduleBannerProps): JSX.Element {
  const now = Date.now();
  const start = new Date(quiz.startTime).getTime();
  const end = new Date(quiz.endTime).getTime();

  let bannerNote = '';
  if (quiz.status === 'cancelled') {
    bannerNote = 'This quiz has been cancelled and is read-only.';
  } else if (quiz.status === 'completed') {
    bannerNote = 'This quiz has been completed.';
  } else if (quiz.status === 'live') {
    bannerNote = 'This quiz is currently live.';
  } else if (quiz.status === 'scheduled') {
    if (start > now) {
      bannerNote = 'This quiz is scheduled and will go live at the start time.';
    } else if (end > now) {
      bannerNote = 'The schedule window is open but the quiz has not transitioned to Live.';
    } else {
      bannerNote = 'The schedule window has passed.';
    }
  } else {
    bannerNote = 'This quiz is a draft. Publish it once it meets readiness requirements.';
  }

  return (
    <div className={`qa-schedule-banner qa-schedule-banner--${quiz.status}`}>
      <div className="qa-schedule-banner__left">
        <h2 className="qa-schedule-banner__title">{quiz.title}</h2>
        <Badge status={quiz.status} />
      </div>
      <div className="qa-schedule-banner__right">
        <div className="qa-schedule-banner__times">
          <div className="qa-schedule-banner__time">
            <span className="qa-schedule-banner__time-label">Starts</span>
            <span className="qa-schedule-banner__time-value">{formatDateTime(quiz.startTime)}</span>
          </div>
          <div className="qa-schedule-banner__time">
            <span className="qa-schedule-banner__time-label">Ends</span>
            <span className="qa-schedule-banner__time-value">{formatDateTime(quiz.endTime)}</span>
          </div>
          <div className="qa-schedule-banner__time">
            <span className="qa-schedule-banner__time-label">Duration</span>
            <span className="qa-schedule-banner__time-value">{quiz.durationMinutes} min</span>
          </div>
        </div>
        <p className="qa-schedule-banner__note">{bannerNote}</p>
      </div>
    </div>
  );
}
