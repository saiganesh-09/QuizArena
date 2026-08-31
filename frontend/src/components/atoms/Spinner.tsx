import './Spinner.scss';

/** Small loading spinner atom. */
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function Spinner({ size = 'md', label }: SpinnerProps): JSX.Element {
  return (
    <span
      className={`qa-spinner qa-spinner--${size}`}
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading'}
    />
  );
}
