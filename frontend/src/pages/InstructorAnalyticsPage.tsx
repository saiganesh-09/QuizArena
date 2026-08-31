import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/molecules/SearchBar';
import { Pagination } from '@/components/atoms/Pagination';
import { EmptyState } from '@/components/atoms/EmptyState';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { useListMyQuizzesQuery } from '@/store/api/instructorApi';
import { formatDateTime } from '@/utils/date';
import type { InstructorQuiz } from '@/types/quiz';
import './InstructorAnalyticsPage.scss';

/**
 * InstructorAnalyticsPage — list of all the instructor's quizzes with
 * search (debounced) and backend pagination. Clicking "View Results"
 * navigates to the aggregated results page for that quiz.
 */
export function InstructorAnalyticsPage(): JSX.Element {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(1);
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Debounce the search input (300ms).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useListMyQuizzesQuery({
    page,
    limit: 10,
    search: debouncedSearch,
    sortBy: 'startTime',
    sortOrder: 'desc',
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const quizzes = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasSearch = debouncedSearch.trim().length > 0;

  function canViewResults(quiz: InstructorQuiz): boolean {
    // Results are available for quizzes that have been live or completed
    // (i.e., candidates may have submitted attempts).
    return quiz.status === 'live' || quiz.status === 'completed';
  }

  return (
    <div className="qa-instructor-analytics">
      <div className="qa-instructor-analytics__header">
        <h1 className="qa-instructor-analytics__title">Analytics</h1>
        <p className="qa-instructor-analytics__subtitle">
          View aggregated results for your quizzes.
        </p>
      </div>

      <div className="qa-instructor-analytics__toolbar">
        <SearchBar
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search quizzes by title…"
        />
      </div>

      {isLoading || isFetching ? (
        <div className="qa-instructor-analytics__loading">Loading quizzes…</div>
      ) : quizzes.length === 0 && !hasSearch ? (
        <EmptyState
          icon="📊"
          title="No quizzes yet"
          message="Your quizzes will appear here once you create and publish them."
        />
      ) : quizzes.length === 0 && hasSearch ? (
        <EmptyState
          icon="🔍"
          title="No results found"
          message={`No quizzes match "${debouncedSearch}". Try a different search.`}
          action={
            <Button variant="secondary" onClick={() => setSearchInput('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <>
          <div className="qa-instructor-analytics__table-scroll">
            <table className="qa-instructor-analytics__table">
              <thead>
                <tr>
                  <th className="qa-instructor-analytics__th">Title</th>
                  <th className="qa-instructor-analytics__th">Status</th>
                  <th className="qa-instructor-analytics__th">Questions</th>
                  <th className="qa-instructor-analytics__th">Participants</th>
                  <th className="qa-instructor-analytics__th">Starts</th>
                  <th className="qa-instructor-analytics__th qa-instructor-analytics__th--right">Action</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="qa-instructor-analytics__tr">
                    <td className="qa-instructor-analytics__td qa-instructor-analytics__td--title">
                      {quiz.title}
                    </td>
                    <td className="qa-instructor-analytics__td">
                      <Badge status={quiz.status} />
                    </td>
                    <td className="qa-instructor-analytics__td">{quiz.questionCount}</td>
                    <td className="qa-instructor-analytics__td">{quiz.participantCount}</td>
                    <td className="qa-instructor-analytics__td">{formatDateTime(quiz.startTime)}</td>
                    <td className="qa-instructor-analytics__td qa-instructor-analytics__td--right">
                      {canViewResults(quiz) ? (
                        <Button
                          variant="ghost"
                          onClick={() => navigate(`/instructor/quizzes/${quiz.id}/results`)}
                        >
                          View Results
                        </Button>
                      ) : (
                        <span className="qa-instructor-analytics__no-action">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
