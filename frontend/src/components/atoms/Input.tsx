import type { InputHTMLAttributes, ReactNode } from 'react';
import './Input.scss';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
}

/**
 * Input atom — a labeled text field with inline error support.
 * Spread of native input attributes keeps it flexible and strictly typed.
 */
export function Input({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: InputProps): JSX.Element {
  const inputId = id ?? rest.name ?? undefined;
  const classes = ['qa-input', error ? 'qa-input--error' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {label ? (
        <label className="qa-input__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className="qa-input__field"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error ? (
        <p className="qa-input__error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="qa-input__hint">{hint}</p>
      ) : null}
    </div>
  );
}
