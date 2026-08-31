import { useEffect, type ReactNode } from 'react';
import './Modal.scss';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** When true, clicking the backdrop does not close the modal. */
  disableBackdropClose?: boolean;
}

/**
 * Modal atom — accessible overlay dialog with a backdrop, escape-to-close,
 * and focus containment via role="dialog". Renders nothing when closed.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  disableBackdropClose = false,
}: ModalProps): JSX.Element | null {
  // Close on Escape key.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    // Prevent body scroll while the modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (): void => {
    if (!disableBackdropClose) onClose();
  };

  return (
    <div className="qa-modal__backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        className="qa-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qa-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="qa-modal__header">
          <h2 className="qa-modal__title" id="qa-modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="qa-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </header>
        <div className="qa-modal__body">{children}</div>
        {footer ? <footer className="qa-modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
