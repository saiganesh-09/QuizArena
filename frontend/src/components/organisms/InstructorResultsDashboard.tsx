import { useState, useCallback } from 'react';
import { StatCard } from '@/components/atoms/StatCard';
import { DistributionChart } from '@/components/atoms/DistributionChart';
import { Pagination } from '@/components/atoms/Pagination';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SearchBar } from '@/components/molecules/SearchBar';
import { Button } from '@/components/atoms/Button';
import { formatDuration } from '@/interfaces/results';
import { formatDateTime } from '@/utils/date';
import type { InstructorQuizResults, CandidateResultRow } from '@/types/quiz';
import './InstructorResultsDashboard.scss';

export interface InstructorResultsDashboardProps {
  results: InstructorQuizResults;
  search: string;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onViewDetails: (row: CandidateResultRow) => void;
}

/**
 * InstructorResultsDashboard organism — the visual dashboard for an
 * instructor viewing aggregated results for one of their quizzes.
 *
 * Shows:
 * - Stat cards (Average Score, Top Score, Completion Rate, Total Assigned)
 * - Score distribution bar chart
 * - Paginated candidate results table with search and "View Details"
 */
export function InstructorResultsDashboard({
  results,
  search,
  isLoading,
  onPageChange,
  onSearchChange,
  onViewDetails,
}: InstructorResultsDashboardProps): JSX.Element {
  const [localSearch, setLocalSearch] = useState<string>(search);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    onSearchChange(localSearch);
  }, [localSearch, onSearchChange]);

  const hasCandidates = results.candidates.length > 0;
  const hasSearch = search.trim().length > 0;

  return (
    <div className="qa-instructor-results">
      {/* Stat cards */}
      <section className="qa-instructor-results__stats">
        <StatCard label="Total Assigned" value={results.totalAssigned} icon="👥" tone="info" />
        <StatCard label="Completed" value={results.totalCompleted} icon="✓" tone="success" />
        <StatCard label="Completion Rate" value={`${results.completionRate}%`} icon="%" tone="info" />
        <StatCard label="Average Score" value={results.averageScore} icon="avg" tone="info" />
        <StatCard label="Top Score" value={results.highestScore} icon="★" tone="success" />
        <StatCard label="Lowest Score" value={results.lowestScore} icon="↓" tone="warning" />
      </section>

      {/* Score distribution chart */}
      <section className="qa-instructor-results__chart">
        <div className="qa-instructor-results__chart-card">
          <DistributionChart
            buckets={results.scoreDistribution}
            title="Score Distribution"
          />
        </div>
      </section>

      {/* Candidate results table */}
      <section className="qa-instructor-results__table-section">
        <div className="qa-instructor-results__toolbar">
          <h2 className="qa-instructor-results__table-title">Candidate Results</h2>
          <div className="qa-instructor-results__search">
            <SearchBar
              value={localSearch}
              onChange={handleSearchChange}
              placeholder="Search by name or email…"
            />
            <Button variant="secondary" onClick={handleSearchSubmit}>Search</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="qa-instructor-results__loading">Loading results…</div>
        ) : !hasCandidates && !hasSearch ? (
          <EmptyState
            icon="📊"
            title="No submissions yet"
            message="Candidates' results will appear here once they submit their attempts."
          />
        ) : !hasCandidates && hasSearch ? (
          <EmptyState
            icon="🔍"
            title="No results found"
            message={`No candidates match "${search}". Try a different search.`}
            action={
              <Button variant="secondary" onClick={() => { setLocalSearch(''); onSearchChange(''); }}>
                Clear search
              </Button>
            }
          />
        ) : (
          <>
            <div className="qa-instructor-results__table-scroll">
              <table className="qa-instructor-results__table">
                <thead>
                  <tr>
                    <th className="qa-instructor-results__th">Candidate</th>
                    <th className="qa-instructor-results__th">Score</th>
                    <th className="qa-instructor-results__th">Percentage</th>
                    <th className="qa-instructor-results__th">Time Taken</th>
                    <th className="qa-instructor-results__th">Status</th>
                    <th className="qa-instructor-results__th">Submitted</th>
                    <th className="qa-instructor-results__th qa-instructor-results__th--right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.candidates.map((row) => (
                    <tr key={row.attemptId} className="qa-instructor-results__tr">
                      <td className="qa-instructor-results__td qa-instructor-results__td--name">
                        <div className="qa-instructor-results__candidate">
                          <span className="qa-instructor-results__candidate-name">{row.candidateName}</span>
                          <span className="qa-instructor-results__candidate-email">{row.candidateEmail}</span>
                        </div>
                      </td>
                      <td className="qa-instructor-results__td">
                        {row.score} / {row.maxScore}
                      </td>
                      <td className="qa-instructor-results__td">
                        <span className={`qa-instructor-results__pct qa-instructor-results__pct--${row.percentage >= 80 ? 'high' : row.percentage >= 50 ? 'mid' : 'low'}`}>
                          {row.percentage}%
                        </span>
                      </td>
                      <td className="qa-instructor-results__td">{formatDuration(row.timeTakenSeconds)}</td>
                      <td className="qa-instructor-results__td">
                        <span className={`qa-instructor-results__status qa-instructor-results__status--${row.status}`}>
                          {row.status === 'auto-submitted' ? 'Auto' : 'Submitted'}
                        </span>
                      </td>
                      <td className="qa-instructor-results__td">
                        {row.submittedAt ? formatDateTime(row.submittedAt) : '—'}
                      </td>
                      <td className="qa-instructor-results__td qa-instructor-results__td--right">
                        <Button variant="ghost" onClick={() => onViewDetails(row)}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={results.page}
              totalPages={results.totalPages}
              total={results.total}
              onPageChange={onPageChange}
            />
          </>
        )}
      </section>
    </div>
  );
}
