import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  const latestPoint = trend.length > 0 ? trend[trend.length - 1] : null;

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
              <span className="qa-performance__stat-label">Quizzes taken</span>
              <span className="qa-performance__stat-value">{attemptsTaken}</span>
            </div>
            <div className="qa-performance__stat qa-performance__stat--best">
              <span className="qa-performance__stat-label">Best score</span>
              <span className="qa-performance__stat-value">{bestPercentage}%</span>
              <span className="qa-performance__stat-sub">{bestQuizTitle ?? ''}</span>
            </div>
            <div className="qa-performance__stat qa-performance__stat--latest">
              <span className="qa-performance__stat-label">Latest score</span>
              <span className="qa-performance__stat-value">
                {latestPoint ? `${latestPoint.percentage}%` : '—'}
              </span>
              <span className="qa-performance__stat-sub">{latestPoint?.quizTitle ?? ''}</span>
            </div>
            <div className="qa-performance__stat qa-performance__stat--rank">
              <span className="qa-performance__stat-label">Latest rank</span>
              <span className="qa-performance__stat-value">
                {latestRank !== null ? `#${latestRank}` : '—'}
              </span>
              <span className="qa-performance__stat-sub">
                {latestRankOutOf !== null
                  ? `of ${latestRankOutOf}${latestQuizTitle ? ` · ${latestQuizTitle}` : ''}`
                  : ''}
              </span>
            </div>
          </div>

          <div className="qa-performance__trend">
            <h3 className="qa-performance__trend-title">Score trend — click a bar to view the result</h3>
            <div className="qa-performance__trend-bars">
              {trend.map((point) => (
                <button
                  type="button"
                  key={point.quizId}
                  className="qa-performance__trend-row"
                  title={`${point.quizTitle}: ${point.percentage}% — view result`}
                  onClick={() => navigate(`/candidate/quizzes/${point.quizId}/result`)}
                >
                  <span className="qa-performance__trend-label" title={point.quizTitle}>
                    {point.quizTitle}
                  </span>
                  <span className="qa-performance__trend-track">
                    <span
                      className={`qa-performance__trend-bar qa-performance__trend-bar--${
                        point.percentage >= 80 ? 'high' : point.percentage >= 50 ? 'mid' : 'low'
                      }`}
                      style={{ width: `${Math.max(point.percentage, 4)}%` }}
                    />
                  </span>
                  <span className="qa-performance__trend-pct">{point.percentage}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
