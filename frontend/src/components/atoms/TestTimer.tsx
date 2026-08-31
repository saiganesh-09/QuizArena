import { useState, useEffect, useRef } from 'react';
import './TestTimer.scss';

export interface TestTimerProps {
  /** The deadline as an ISO-8601 UTC string. */
  deadlineAt: string;
  /** Callback fired once when the timer reaches zero (auto-submit). */
  onZero?: () => void;
}

/** Breakdown of a remaining duration. */
interface Remaining {
  hours: number;
  minutes: number;
  seconds: number;
  isZero: boolean;
}

/** Compute the remaining time until the deadline, clamped at zero. */
function computeRemaining(deadlineMs: number): Remaining {
  const diff = Math.max(0, deadlineMs - Date.now());
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  return { hours, minutes, seconds, isZero: diff <= 0 };
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * TestTimer atom — counts down from the attempt deadline.
 *
 * Starts ticking immediately when the quiz is opened (the deadline is
 * `startedAt + durationMinutes` from the server, not the scheduled
 * start time). Triggers `onZero` exactly once when the timer reaches
 * zero, for the auto-submission flow. Turns red when < 5 minutes remain.
 */
export function TestTimer({ deadlineAt, onZero }: TestTimerProps): JSX.Element {
  const deadlineMs = new Date(deadlineAt).getTime();
  const [remaining, setRemaining] = useState<Remaining>(() => computeRemaining(deadlineMs));
  const firedRef = useRef<boolean>(false);

  useEffect(() => {
    const initial = computeRemaining(deadlineMs);
    if (initial.isZero && !firedRef.current) {
      firedRef.current = true;
      onZero?.();
    }

    const interval = window.setInterval(() => {
      const next = computeRemaining(deadlineMs);
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
  }, [deadlineMs, onZero]);

  const isLow = !remaining.isZero && remaining.hours === 0 && remaining.minutes < 5;

  return (
    <span
      className={`qa-test-timer${isLow ? ' qa-test-timer--low' : ''}${remaining.isZero ? ' qa-test-timer--zero' : ''}`}
      role="timer"
      aria-label={`Time remaining: ${remaining.hours} hours, ${remaining.minutes} minutes, ${remaining.seconds} seconds`}
    >
      <span className="qa-test-timer__icon" aria-hidden="true">⏱</span>
      <span className="qa-test-timer__value">
        {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
      </span>
    </span>
  );
}
