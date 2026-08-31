import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@/components/atoms/ThemeToggle';

/**
 * ThemeToggle component tests — verify rendering and toggle behavior.
 */
describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders a switch button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('switch');
    expect(button).toBeInTheDocument();
  });

  it('toggles to dark mode on click', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('switch');

    // Initially light (aria-checked = false)
    expect(button).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles back to light mode on second click', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('switch');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-checked', 'false');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persists the theme to localStorage', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('switch');

    fireEvent.click(button);
    expect(localStorage.getItem('quizarena-theme')).toBe('dark');
  });
});
