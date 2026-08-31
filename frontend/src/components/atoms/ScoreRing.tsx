import './ScoreRing.scss';

export interface ScoreRingProps {
  /** Score percentage (0-100). */
  percentage: number;
  /** Optional label shown below the percentage. */
  label?: string;
  /** Optional size in pixels (default 120). */
  size?: number;
  /** Optional stroke width (default 8). */
  strokeWidth?: number;
}

/**
 * ScoreRing atom — a circular progress indicator showing the score
 * percentage. Uses SVG with a stroke-dasharray animation. Color
 * changes based on the percentage tier (red/amber/green).
 */
export function ScoreRing({
  percentage,
  label,
  size = 120,
  strokeWidth = 8,
}: ScoreRingProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const tier = clamped >= 80 ? 'high' : clamped >= 50 ? 'mid' : 'low';

  return (
    <div className={`qa-score-ring qa-score-ring--${tier}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="qa-score-ring__svg">
        <circle
          className="qa-score-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          className="qa-score-ring__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="qa-score-ring__content">
        <span className="qa-score-ring__value">{clamped}%</span>
        {label ? <span className="qa-score-ring__label">{label}</span> : null}
      </div>
    </div>
  );
}
