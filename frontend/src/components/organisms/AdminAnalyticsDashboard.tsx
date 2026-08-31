import { StatCard } from '@/components/atoms/StatCard';
import { DistributionChart } from '@/components/atoms/DistributionChart';
import { EmptyState } from '@/components/atoms/EmptyState';
import type { AdminAnalytics, QuizStatus } from '@/types/quiz';
import './AdminAnalyticsDashboard.scss';

export interface AdminAnalyticsDashboardProps {
  analytics: AdminAnalytics;
  isLoading: boolean;
}

/** Status labels for display. */
const STATUS_LABELS: Record<QuizStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_ORDER: QuizStatus[] = ['draft', 'scheduled', 'live', 'completed', 'cancelled'];

/**
 * AdminAnalyticsDashboard organism — the platform-wide analytics
 * dashboard for admins. Shows:
 * - Stat cards (total quizzes, candidates, instructors, attempts, avg score)
 * - Quizzes by status (bar chart + breakdown table)
 * - Attempt completion rate
 */
export function AdminAnalyticsDashboard({ analytics, isLoading }: AdminAnalyticsDashboardProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="qa-admin-analytics qa-admin-analytics--loading">
        <p>Loading analytics…</p>
      </div>
    );
  }

  const hasQuizzes = analytics.quizCount > 0;

  // Build distribution buckets from quizzesByStatus for the chart.
  const statusBuckets = STATUS_ORDER.map((status) => ({
    label: STATUS_LABELS[status],
    min: 0,
    max: 0,
    count: analytics.quizzesByStatus[status] ?? 0,
  }));

  return (
    <div className="qa-admin-analytics">
      {/* Top stat cards */}
      <section className="qa-admin-analytics__stats">
        <StatCard label="Total Quizzes" value={analytics.quizCount} icon="📋" tone="info" />
        <StatCard label="Candidates" value={analytics.totalCandidates} icon="👥" tone="info" />
        <StatCard label="Instructors" value={analytics.totalInstructors} icon="🎓" tone="info" />
        <StatCard label="Total Attempts" value={analytics.totalAttempts} icon="📝" tone="info" />
        <StatCard label="Completed Attempts" value={analytics.totalCompletedAttempts} icon="✓" tone="success" />
        <StatCard label="Avg Score" value={analytics.averageScore} icon="avg" tone="info" />
      </section>

      {/* Attempt completion rate */}
      <section className="qa-admin-analytics__completion">
        <div className="qa-admin-analytics__completion-card">
          <h3 className="qa-admin-analytics__completion-title">Attempt Completion Rate</h3>
          <div className="qa-admin-analytics__completion-bar">
            <div
              className="qa-admin-analytics__completion-fill"
              style={{ width: `${analytics.attemptCompletionRate}%` }}
            />
          </div>
          <span className="qa-admin-analytics__completion-value">
            {analytics.attemptCompletionRate}% ({analytics.totalCompletedAttempts} / {analytics.totalAttempts})
          </span>
        </div>
      </section>

      {/* Quizzes by status */}
      <section className="qa-admin-analytics__status-section">
        <h2 className="qa-admin-analytics__section-title">Quizzes by Status</h2>
        {hasQuizzes ? (
          <div className="qa-admin-analytics__status-grid">
            <div className="qa-admin-analytics__status-chart-card">
              <DistributionChart buckets={statusBuckets} />
            </div>
            <div className="qa-admin-analytics__status-table-card">
              <table className="qa-admin-analytics__status-table">
                <thead>
                  <tr>
                    <th className="qa-admin-analytics__status-th">Status</th>
                    <th className="qa-admin-analytics__status-th qa-admin-analytics__status-th--right">Count</th>
                    <th className="qa-admin-analytics__status-th qa-admin-analytics__status-th--right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {STATUS_ORDER.map((status) => {
                    const count = analytics.quizzesByStatus[status] ?? 0;
                    const pct = analytics.quizCount > 0 ? Math.round((count / analytics.quizCount) * 100) : 0;
                    return (
                      <tr key={status}>
                        <td className="qa-admin-analytics__status-td">
                          <span className={`qa-admin-analytics__status-dot qa-admin-analytics__status-dot--${status}`} />
                          {STATUS_LABELS[status]}
                        </td>
                        <td className="qa-admin-analytics__status-td qa-admin-analytics__status-td--right">{count}</td>
                        <td className="qa-admin-analytics__status-td qa-admin-analytics__status-td--right">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="qa-admin-analytics__status-td qa-admin-analytics__status-td--bold">Total</td>
                    <td className="qa-admin-analytics__status-td qa-admin-analytics__status-td--right qa-admin-analytics__status-td--bold">
                      {analytics.quizCount}
                    </td>
                    <td className="qa-admin-analytics__status-td qa-admin-analytics__status-td--right qa-admin-analytics__status-td--bold">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon="📊"
            title="No quizzes found"
            message="No quizzes match the current filters. Try adjusting the date range or instructor filter."
          />
        )}
      </section>
    </div>
  );
}
