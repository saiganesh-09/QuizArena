import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListMyQuizzesQuery } from '@/store/api/instructorApi';
import { EmptyState } from '@/components/atoms/EmptyState';
import { formatDateTime } from '@/utils/date';
import './InstructorResultsHubPage.scss';

/**
 * InstructorResultsHubPage — all the teacher's quizzes with submission
 * counts and average scores; click a row to open its full results table.
 */
export function InstructorResultsHubPage(): JSX.Element {
  const navigate = useNavigate();
  const { data, isLoading } = useListMyQuizzesQuery({
    page: 1,
    limit: 50,
    sortBy: 'startTime',
    sortOrder: 'desc',
  });

  const quizzes = (data?.items ?? []).filter((q) => (q.submittedCount ?? 0) > 0 || q.status === 'completed' || q.status === 'live');

  const openResults = useCallback(
    (id: string) => navigate(`/instructor/quizzes/${id}/results`),
    [navigate],
  );

  return (
    <div className="qa-resultshub">
      <div className="qa-resultshub__header">
        <h1 className="qa-resultshub__heading">Results</h1>
        <p className="qa-resultshub__subheading">
          Pick a quiz or homework to review scores, rankings, and remarks.
        </p>
      </div>

      {isLoading ? (
        <div className="qa-resultshub__loading">Loading results…</div>
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No results yet"
          message="Results appear once students submit your quizzes or homework."
        />
      ) : (
        <div className="qa-resultshub__card">
          <table className="qa-resultshub__table">
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Status</th>
                <th>Window</th>
                <th>Students</th>
                <th>Submissions</th>
                <th>Avg score</th>
                <th className="qa-resultshub__th--right">Action</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id}>
                  <td className="qa-resultshub__title">
                    {q.title}
                    {q.kind === 'homework' ? (
                      <span className="qa-kind-badge qa-kind-badge--homework">Homework</span>
                    ) : null}
                  </td>
                  <td>
                    <span className={`qa-resultshub__status qa-resultshub__status--${q.status}`}>
                      {q.status === 'live' ? 'Live' : q.status === 'completed' ? 'Completed' : q.status}
                    </span>
                  </td>
                  <td className="qa-resultshub__window">
                    {formatDateTime(q.startTime)} → {formatDateTime(q.endTime)}
                  </td>
                  <td>{q.participantCount}</td>
                  <td>
                    <span className={`qa-resultshub__subs${(q.submittedCount ?? 0) > 0 ? ' qa-resultshub__subs--has' : ''}`}>
                      {q.submittedCount ?? 0}
                    </span>
                  </td>
                  <td>
                    {q.averagePercentage === null || q.averagePercentage === undefined ? (
                      <span className="qa-resultshub__na">—</span>
                    ) : (
                      `${q.averagePercentage}%`
                    )}
                  </td>
                  <td className="qa-resultshub__td--right">
                    <button
                      type="button"
                      className="qa-resultshub__view"
                      onClick={() => openResults(q.id)}
                    >
                      View results
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
