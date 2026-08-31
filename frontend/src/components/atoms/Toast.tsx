import './Toast.scss';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastProps {
  variant: ToastVariant;
  message: string;
  onClose?: () => void;
}

/** Single toast item atom. */
export function Toast({ variant, message, onClose }: ToastProps): JSX.Element {
  return (
    <div className={`qa-toast qa-toast--${variant}`} role="alert">
      <span className="qa-toast__icon" aria-hidden="true">
        {variant === 'success' ? '✓' : variant === 'error' ? '!' : 'i'}
      </span>
      <p className="qa-toast__message">{message}</p>
      {onClose ? (
        <button
          type="button"
          className="qa-toast__close"
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
