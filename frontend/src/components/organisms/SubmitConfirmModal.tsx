import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import type { AttemptQuestion } from '@/types/quiz';
import type { AnswerMap } from '@/interfaces/attempt';
import { countAnswered } from '@/interfaces/attempt';
import './SubmitConfirmModal.scss';

export interface SubmitConfirmModalProps {
  open: boolean;
  questions: AttemptQuestion[];
  answers: AnswerMap;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * SubmitConfirmModal organism — confirmation modal shown when the
 * candidate clicks "Submit Test". Summarizes the number of answered
 * and unanswered questions before final submission.
 */
export function SubmitConfirmModal({
  open,
  questions,
  answers,
  isLoading,
  onConfirm,
  onCancel,
}: SubmitConfirmModalProps): JSX.Element {
  const total = questions.length;
  const answered = countAnswered(answers);
  const unanswered = total - answered;

  return (
    <Modal
      open={open}
      title="Submit Test?"
      onClose={onCancel}
      disableBackdropClose={isLoading}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Go Back
          </Button>
          <Button variant="primary" onClick={onConfirm} isLoading={isLoading}>
            Confirm Submit
          </Button>
        </>
      }
    >
      <div className="qa-submit-confirm">
        <p className="qa-submit-confirm__text">
          You are about to submit your test. This action cannot be undone.
        </p>

        <div className="qa-submit-confirm__summary">
          <div className="qa-submit-confirm__summary-item qa-submit-confirm__summary-item--answered">
            <span className="qa-submit-confirm__summary-value">{answered}</span>
            <span className="qa-submit-confirm__summary-label">Answered</span>
          </div>
          <div className="qa-submit-confirm__summary-item qa-submit-confirm__summary-item--unanswered">
            <span className="qa-submit-confirm__summary-value">{unanswered}</span>
            <span className="qa-submit-confirm__summary-label">Unanswered</span>
          </div>
          <div className="qa-submit-confirm__summary-item qa-submit-confirm__summary-item--total">
            <span className="qa-submit-confirm__summary-value">{total}</span>
            <span className="qa-submit-confirm__summary-label">Total</span>
          </div>
        </div>

        {unanswered > 0 ? (
          <p className="qa-submit-confirm__warning">
            ⚠ You have {unanswered} unanswered {unanswered === 1 ? 'question' : 'questions'}.
            Unanswered questions will score zero.
          </p>
        ) : (
          <p className="qa-submit-confirm__all-answered">
            ✓ You have answered all questions.
          </p>
        )}
      </div>
    </Modal>
  );
}
