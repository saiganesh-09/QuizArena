import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Toast, type ToastVariant } from '@/components/atoms/Toast';
import './ToastContainer.scss';

/** A unique id for each toast so we can dismiss them individually. */
interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

/** Shape of the toast context exposed via useToast. */
interface ToastContextValue {
  showToast: (variant: ToastVariant, message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

/**
 * ToastProvider — renders a stack of toasts in a fixed container and
 * exposes a `showToast` function via context. Auto-dismisses each toast
 * after a configurable duration (default 3.5s).
 */
export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (variant: ToastVariant, message: string, durationMs = 3500) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, variant, message }]);
      if (durationMs > 0) {
        window.setTimeout(() => dismiss(id), durationMs);
      }
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="qa-toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            message={t.message}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Hook to imperatively show a toast from anywhere inside the provider. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
