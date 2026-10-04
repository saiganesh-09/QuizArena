import { ScoreRing } from '@/components/atoms/ScoreRing';
import type { CandidatePerformance } from '@/types/quiz';
import './CandidatePerformancePanel.scss';

export interface CandidatePerformancePanelProps {
  performance: CandidatePerformance;
}

/**
 * CandidatePerformancePanel organism — the candidate's own performance
 * overview on the dashboard: average score ring, best score, latest
 * rank, and a per-quiz score trend bar chart.
 */
export function CandidatePerformancePanel({
  performance,
}: CandidatePerformancePanelProps): JSX.Element {
  const {
    attemptsTaken,
    averagePercentage,
    bestPercentage,
    bestQuizTitle,
    latestRank,
    latestRankOutOf,
    latestQuizTitle,
    trend,
  } = performance;

  return (
    <section className="qa-performance">
      <h2 className="qa-performance__title">Your Performance</h2>

      {attemptsTaken === 0 ? (
        <div className="qa-performance__empty">
          Take your first quiz to see your score trend and ranking here.
        </div>
      ) : (
        <div className="qa-performance__grid">
          <div className="qa-performance__ring">
            <ScoreRing percentage={averagePercentage} size={130} label="avg score" />
          </div>

          <div className="qa-performance__highlights">
            <div className="qa-performance__stat">
              <span className="qa-performance__stat-value">{attemptsTaken}</span>
              <span className="qa-performance__stat-label">Quizzes taken</span>
            </div>
            <div className="qa-performance__stat">
              <span className="qa-performance__stat-value">{bestPercentage}%</span>
              <span className="qa-performance__stat-label">
                Best score{bestQuizTitle ? ` · ${bestQuizTitle}` : ''}
              </span>
            </div>
            <div className="qa-performance__stat">
              <span className="qa-performance__stat-value">
                {latestRank !== null ? `#${latestRank}` : '—'}
              </span>
              <span className="qa-performance__stat-label">
                {latestRankOutOf !== null
                  ? `Rank of ${latestRankOutOf}${latestQuizTitle ? ` · ${latestQuizTitle}` : ''}`
                  : 'Latest rank'}
              </span>
            </div>
          </div>

          <div className="qa-performance__trend">
            <h3 className="qa-performance__trend-title">Score trend</h3>
            <div className="qa-performance__trend-bars">
              {trend.map((point) => (
                <div key={point.quizId} className="qa-performance__trend-row">
                  <span className="qa-performance__trend-label" title={point.quizTitle}>
                    {point.quizTitle}
                  </span>
                  <div className="qa-performance__trend-track">
                    <div
                      className={`qa-performance__trend-bar qa-performance__trend-bar--${
                        point.percentage >= 80 ? 'high' : point.percentage >= 50 ? 'mid' : 'low'
                      }`}
                      style={{ width: `${Math.max(point.percentage, 4)}%` }}
                    />
                  </div>
                  <span className="qa-performance__trend-pct">{point.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
