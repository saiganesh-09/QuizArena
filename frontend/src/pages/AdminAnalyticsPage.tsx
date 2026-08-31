import { AdminAnalyticsDashboard } from '@/components/organisms/AdminAnalyticsDashboard';
import { useGetAdminAnalyticsQuery } from '@/store/api/resultsApi';
import './AdminAnalyticsPage.scss';

/**
 * AdminAnalyticsPage — the platform-wide analytics page for admins.
 * Shows stat cards, quiz status distribution, and attempt completion.
 */
export function AdminAnalyticsPage(): JSX.Element {
  const { data: analytics, isLoading } = useGetAdminAnalyticsQuery({});

  return (
    <div className="qa-admin-analytics-page">
      <div className="qa-admin-analytics-page__header">
        <h1 className="qa-admin-analytics-page__title">Platform Analytics</h1>
        <p className="qa-admin-analytics-page__subtitle">
          Cross-quiz global summary of platform activity.
        </p>
      </div>

      {analytics ? (
        <AdminAnalyticsDashboard analytics={analytics} isLoading={isLoading} />
      ) : (
        <div className="qa-admin-analytics-page__loading">
          {isLoading ? 'Loading analytics…' : 'No analytics data available.'}
        </div>
      )}
    </div>
  );
}
