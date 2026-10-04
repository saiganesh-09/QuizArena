import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Breadcrumbs } from '@/components/atoms/Breadcrumbs';
import { InstructorResultsDashboard } from '@/components/organisms/InstructorResultsDashboard';
import { CandidateResultDetailModal } from '@/components/organisms/CandidateResultDetailModal';
import { useGetInstructorResultsQuery } from '@/store/api/resultsApi';
import type { CandidateResultRow } from '@/types/quiz';
import './InstructorResultsPage.scss';

/**
 * InstructorResultsPage — the aggregated results page for an
 * instructor's quiz. Shows stat cards, score distribution chart, and
 * a paginated candidate results table with search.
 */
export function InstructorResultsPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>();

  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  const { data: results, isLoading } = useGetInstructorResultsQuery(
    { quizId: id, page, limit: 10, search, sortBy: 'score', sortOrder: 'desc' },
    { skip: !id },
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleViewDetails = useCallback((row: CandidateResultRow) => {
    setSelectedAttemptId(row.attemptId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedAttemptId(null);
  }, []);

  if (!results) {
    return (
      <div className="qa-instructor-results-page qa-instructor-results-page--loading">
        <p>Loading results…</p>
      </div>
    );
  }

  return (
    <div className="qa-instructor-results-page">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/instructor/dashboard' },
          { label: 'My Quizzes', to: '/instructor/quizzes' },
          { label: results.quizTitle, to: `/instructor/quizzes/${id}` },
          { label: 'Results' },
        ]}
      />

      <div className="qa-instructor-results-page__header">
        <h1 className="qa-instructor-results-page__title">Results: {results.quizTitle}</h1>
      </div>

      <InstructorResultsDashboard
        results={results}
        search={search}
        isLoading={isLoading}
        onPageChange={setPage}
        onSearchChange={handleSearchChange}
        onViewDetails={handleViewDetails}
      />

      <CandidateResultDetailModal
        quizId={id}
        attemptId={selectedAttemptId}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
