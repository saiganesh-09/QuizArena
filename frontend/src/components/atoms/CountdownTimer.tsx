import { useState, useEffect, useRef } from 'react';
import './CountdownTimer.scss';

export interface CountdownTimerProps {
  /** The target time as an ISO-8601 UTC string. */
  targetTime: string;
  /** Callback fired once when the countdown reaches zero. */
  onZero?: () => void;
  /** Optional compact mode (smaller text). */
  compact?: boolean;
}

/** Breakdown of a remaining duration. */
interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isZero: boolean;
}

/** Compute the remaining time until the target, clamped at zero. */
function computeRemaining(targetMs: number): Remaining {
  const diff = Math.max(0, targetMs - Date.now());
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  return { days, hours, minutes, seconds, isZero: diff <= 0 };
}

/** Pad a number to 2 digits. */
function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * CountdownTimer atom — a real-time countdown to a target time.
 *
 * Updates every second via setInterval. Fires `onZero` exactly once
 * when the countdown reaches zero. Cleans up the interval on unmount.
 */
export function CountdownTimer({ targetTime, onZero, compact = false }: CountdownTimerProps): JSX.Element {
  const targetMs = new Date(targetTime).getTime();
  const [remaining, setRemaining] = useState<Remaining>(() => computeRemaining(targetMs));
  const firedRef = useRef<boolean>(false);

  useEffect(() => {
    // If already past the target on mount, fire immediately.
    const initial = computeRemaining(targetMs);
    if (initial.isZero && !firedRef.current) {
      firedRef.current = true;
      onZero?.();
    }

    const interval = window.setInterval(() => {
      const next = computeRemaining(targetMs);
      setRemaining(next);
      if (next.isZero && !firedRef.current) {
        firedRef.current = true;
        onZero?.();
        window.clearInterval(interval);
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [targetMs, onZero]);

  if (remaining.isZero) {
    return <span className={`qa-countdown qa-countdown--zero${compact ? ' qa-countdown--compact' : ''}`}>Live now</span>;
  }

  return (
    <span className={`qa-countdown${compact ? ' qa-countdown--compact' : ''}`}>
      {remaining.days > 0 ? (
        <span className="qa-countdown__unit">
          <span className="qa-countdown__value">{remaining.days}</span>
          <span className="qa-countdown__label">d</span>
        </span>
      ) : null}
      <span className="qa-countdown__unit">
        <span className="qa-countdown__value">{pad(remaining.hours)}</span>
        <span className="qa-countdown__label">h</span>
      </span>
      <span className="qa-countdown__unit">
        <span className="qa-countdown__value">{pad(remaining.minutes)}</span>
        <span className="qa-countdown__label">m</span>
      </span>
      <span className="qa-countdown__unit">
        <span className="qa-countdown__value">{pad(remaining.seconds)}</span>
        <span className="qa-countdown__label">s</span>
      </span>
    </span>
  );
}
