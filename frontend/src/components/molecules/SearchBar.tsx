import { useEffect, useRef, useState } from 'react';
import './SearchBar.scss';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce in ms before notifying the parent. */
  debounceMs?: number;
}

/**
 * SearchBar molecule — a controlled input with a search icon and a
 * debounced onChange so the parent (table) can refetch without spamming.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  debounceMs = 350,
}: SearchBarProps): JSX.Element {
  const [local, setLocal] = useState<string>(value);
  const timerRef = useRef<number | undefined>(undefined);

  // Keep local state in sync if the parent resets the value.
  useEffect(() => {
    setLocal(value);
  }, [value]);

  function handleChange(next: string): void {
    setLocal(next);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onChange(next);
    }, debounceMs);
  }

  function handleClear(): void {
    setLocal('');
    if (timerRef.current) window.clearTimeout(timerRef.current);
    onChange('');
  }

  return (
    <div className="qa-search-bar">
      <span className="qa-search-bar__icon" aria-hidden="true">
        ⌕
      </span>
      <input
        type="search"
        className="qa-search-bar__input"
        placeholder={placeholder}
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Search"
      />
      {local ? (
        <button
          type="button"
          className="qa-search-bar__clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
