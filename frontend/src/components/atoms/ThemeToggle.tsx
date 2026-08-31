import { useTheme } from '@/hooks/useTheme';
import './ThemeToggle.scss';

/**
 * ThemeToggle atom — a switch that toggles between light and dark mode.
 * Persists the choice to localStorage and applies it to <html>.
 */
export function ThemeToggle(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`qa-theme-toggle${isDark ? ' qa-theme-toggle--dark' : ''}`}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="qa-theme-toggle__track">
        <span className="qa-theme-toggle__thumb">
          {isDark ? '🌙' : '☀'}
        </span>
      </span>
    </button>
  );
}
