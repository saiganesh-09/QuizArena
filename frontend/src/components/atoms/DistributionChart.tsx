import type { ScoreBucket } from '@/types/quiz';
import './DistributionChart.scss';

export interface DistributionChartProps {
  buckets: ScoreBucket[];
  /** Optional title for the chart. */
  title?: string;
}

/**
 * DistributionChart atom — a CSS-based bar chart showing score
 * distribution across percentage buckets. No external chart library;
 * uses pure SCSS for bars with animated heights.
 */
export function DistributionChart({ buckets, title }: DistributionChartProps): JSX.Element {
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="qa-dist-chart">
      {title ? <h4 className="qa-dist-chart__title">{title}</h4> : null}
      <div className="qa-dist-chart__bars">
        {buckets.map((bucket, idx) => {
          const heightPct = (bucket.count / maxCount) * 100;
          return (
            <div key={idx} className="qa-dist-chart__bar-wrapper">
              <div className="qa-dist-chart__bar-container">
                <div
                  className={`qa-dist-chart__bar qa-dist-chart__bar--${idx}`}
                  style={{ height: `${heightPct}%` }}
                  title={`${bucket.label}: ${bucket.count} candidate${bucket.count === 1 ? '' : 's'}`}
                />
              </div>
              <span className="qa-dist-chart__count">{bucket.count}</span>
              <span className="qa-dist-chart__label">{bucket.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
