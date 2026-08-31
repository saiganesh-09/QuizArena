import { useState, useCallback, useEffect } from 'react';

/**
 * useMobileSidebar — manages the open/closed state of a mobile sidebar.
 *
 * - Starts closed.
 * - `toggle` flips the state.
 * - `close` closes it (used when navigating or clicking a link).
 * - Auto-closes on resize to desktop (>= 769px).
 */
export function useMobileSidebar(): {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
} {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function handleResize(): void {
      if (window.innerWidth >= 769) setIsOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isOpen, toggle, close };
}
