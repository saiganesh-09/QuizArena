import { Modal } from '@/components/atoms/Modal';
import { Button } from '@/components/atoms/Button';
import type { ConfirmDialogProps } from '@/interfaces/quiz';
import './ConfirmDialog.scss';

/**
 * ConfirmDialog organism — a reusable confirmation pop-up built on the
 * Modal atom. Used for destructive actions like cancelling a quiz.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): JSX.Element {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      disableBackdropClose={isLoading}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="qa-confirm-dialog__message">{message}</p>
    </Modal>
  );
}
