import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.scss';

/** Visual variants for the Button atom. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * Button atom — the smallest interactive unit.
 * Forwards all native button attributes and adds variant/loading states.
 */
export function Button({
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps): JSX.Element {
  const classes = [
    'qa-btn',
    `qa-btn--${variant}`,
    fullWidth ? 'qa-btn--full' : '',
    isLoading ? 'qa-btn--loading' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading ? <span className="qa-btn__spinner" aria-hidden="true" /> : null}
      <span className="qa-btn__label">{children}</span>
    </button>
  );
}
