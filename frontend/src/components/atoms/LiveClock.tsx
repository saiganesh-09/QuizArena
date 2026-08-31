import { useEffect, useState } from 'react';
import './LiveClock.scss';

export interface LiveClockProps {
  /** Update interval in ms. Defaults to 1000 for seconds accuracy. */
  intervalMs?: number;
}

/**
 * LiveClock atom — renders the current time and updates every second.
 * Uses a single interval and cleans up on unmount.
 */
export function LiveClock({ intervalMs = 1000 }: LiveClockProps): JSX.Element {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const handle = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(handle);
  }, [intervalMs]);

  const time = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const date = now.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="qa-live-clock" title="Current date and time">
      <span className="qa-live-clock__date">{date}</span>
      <span className="qa-live-clock__time">{time}</span>
    </div>
  );
}
