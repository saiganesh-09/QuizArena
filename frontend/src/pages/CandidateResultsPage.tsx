import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetCandidateResultsQuery } from '@/store/api/candidateApi';
import { EmptyState } from '@/components/atoms/EmptyState';
import { formatDateTime } from '@/utils/date';
import './CandidateResultsPage.scss';

const REMARK_CLASS: Record<string, string> = {
  'Excellent': 'excellent',
  'Good': 'good',
  'Average': 'average',
  'Needs Improvement': 'poor',
};

/**
 * CandidateResultsPage — the student's full score history: one row per
 * submitted attempt with score, remark, rank, and a View link.
 */
export function CandidateResultsPage(): JSX.Element {
  const navigate = useNavigate();
  const { data, isLoading } = useGetCandidateResultsQuery();

  const handleView = useCallback((quizId: string) => {
    navigate(`/candidate/quizzes/${quizId}/result`);
  }, [navigate]);

  const rows = data ?? [];

  return (
    <div className="qa-results-page">
      <div className="qa-results-page__header">
        <h1 className="qa-results-page__heading">My Results</h1>
        <p className="qa-results-page__subheading">
          Every quiz and homework you&apos;ve submitted — score, rank, and remarks.
        </p>
      </div>

      {isLoading ? (
        <div className="qa-results-page__loading">Loading your results…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No results yet"
          message="Submit a quiz or homework to see your scores, rank, and remarks here."
        />
      ) : (
        <div className="qa-results-page__card">
          <table className="qa-results-page__table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Quiz</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Remark</th>
                <th>Submitted</th>
                <th className="qa-results-page__th--right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.attemptId}>
                  <td>
                    <span className={`qa-results-page__rank${r.rank <= 3 ? ` qa-results-page__rank--${r.rank}` : ''}`}>
                      #{r.rank}
                    </span>
                    <span className="qa-results-page__of">of {r.rankOutOf}</span>
                  </td>
                  <td className="qa-results-page__td--title">
                    {r.quizTitle}
                    {r.kind === 'homework' ? (
                      <span className="qa-kind-badge qa-kind-badge--homework">Homework</span>
                    ) : null}
                  </td>
                  <td>{r.score} / {r.maxScore}</td>
                  <td>{r.percentage}%</td>
                  <td>
                    <span className={`qa-results-page__remark qa-results-page__remark--${REMARK_CLASS[r.remark] ?? 'average'}`}>
                      {r.remark}
                    </span>
                  </td>
                  <td>{r.submittedAt ? formatDateTime(r.submittedAt) : '—'}</td>
                  <td className="qa-results-page__td--right">
                    <button
                      type="button"
                      className="qa-results-page__view"
                      onClick={() => handleView(r.quizId)}
                    >
                      View
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
