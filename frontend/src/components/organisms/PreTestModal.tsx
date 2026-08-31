import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import type { CandidateQuizMeta } from '@/types/quiz';
import { formatDateTime } from '@/utils/date';
import './PreTestModal.scss';

export interface PreTestModalProps {
  open: boolean;
  quiz: CandidateQuizMeta | null;
  onStart: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * PreTestModal organism — shows instructions before the candidate
 * starts the test. Displays quiz metadata, rules, and a start button.
 */
export function PreTestModal({ open, quiz, onStart, onCancel, isLoading }: PreTestModalProps): JSX.Element {
  if (!quiz) return <></>;

  return (
    <Modal
      open={open}
      title="Quiz Instructions"
      onClose={onCancel}
      disableBackdropClose={true}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" onClick={onStart} isLoading={isLoading}>
            Start Test
          </Button>
        </>
      }
    >
      <div className="qa-pre-test">
        <h2 className="qa-pre-test__title">{quiz.title}</h2>
        {quiz.description ? (
          <p className="qa-pre-test__description">{quiz.description}</p>
        ) : null}

        <div className="qa-pre-test__meta">
          <div className="qa-pre-test__meta-row">
            <span className="qa-pre-test__meta-label">Duration</span>
            <span className="qa-pre-test__meta-value">{quiz.durationMinutes} minutes</span>
          </div>
          <div className="qa-pre-test__meta-row">
            <span className="qa-pre-test__meta-label">Questions</span>
            <span className="qa-pre-test__meta-value">{quiz.questionCount}</span>
          </div>
          <div className="qa-pre-test__meta-row">
            <span className="qa-pre-test__meta-label">Window closes</span>
            <span className="qa-pre-test__meta-value">{formatDateTime(quiz.endTime)}</span>
          </div>
        </div>

        <div className="qa-pre-test__rules">
          <h3 className="qa-pre-test__rules-title">Before you begin:</h3>
          <ul className="qa-pre-test__rules-list">
            <li>The timer starts immediately when you click "Start Test".</li>
            <li>You can navigate freely between questions using the navigator panel.</li>
            <li>Your selected answers persist when you move between questions.</li>
            <li>The test auto-submits when the timer reaches zero.</li>
            <li>You can submit manually at any time using the "Submit Test" button.</li>
            <li>You have exactly one attempt — you cannot re-enter the test after submission.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
