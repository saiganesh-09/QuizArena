import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/atoms/StatCard';
import { CandidateQuizTable } from '@/components/organisms/CandidateQuizTable';
import { CandidatePerformancePanel } from '@/components/organisms/CandidatePerformancePanel';
import { UpcomingQuizCard } from '@/components/organisms/UpcomingQuizCard';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useListCandidateQuizzesQuery, useGetCandidatePerformanceQuery } from '@/store/api/candidateApi';
import type { CandidateQuizMeta } from '@/types/quiz';
import './CandidateDashboardPage.scss';

/**
 * Candidate Dashboard page — the main candidate landing screen.
 *
 * Renders:
 * - Summary stat cards (total, upcoming, live, completed)
 * - Upcoming quiz cards with real-time countdown timers
 * - Assigned quizzes table with search, pagination, and row actions
 *
 * SECURITY: All data comes from the assignment-filtered /candidate/quizzes
 * endpoint. The backend guarantees no unassigned quiz metadata leaks.
 */
export function CandidateDashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const limit = 10;

  // Main table query (all assigned quizzes, paginated + searchable).
  const { data, isLoading, isFetching } = useListCandidateQuizzesQuery({ page, limit, search });

  // Separate query for upcoming quiz cards (scheduled, sorted by soonest start).
  const { data: upcomingData } = useListCandidateQuizzesQuery({
    filter: 'upcoming',
    limit: 4,
    sortBy: 'startTime',
    sortOrder: 'asc',
  });

  // Own performance summary (avg score, best score, latest rank, trend).
  const { data: performance } = useGetCandidatePerformanceQuery();

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStart = useCallback((quiz: CandidateQuizMeta) => {
    navigate(`/candidate/quizzes/${quiz.id}/start`);
  }, [navigate]);

  const handleViewResult = useCallback((quiz: CandidateQuizMeta) => {
    navigate(`/candidate/quizzes/${quiz.id}/result`);
  }, [navigate]);

  const stats = data?.stats;
  const quizzes = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const upcomingQuizzes = useMemo<CandidateQuizMeta[]>(
    () => upcomingData?.items ?? [],
    [upcomingData],
  );

  return (
    <div className="qa-candidate-dashboard">
      <div className="qa-candidate-dashboard__header">
        <h1 className="qa-candidate-dashboard__heading">My Dashboard</h1>
        <p className="qa-candidate-dashboard__subheading">
          Quizzes assigned to you by your instructors.
        </p>
      </div>

      <section className="qa-candidate-dashboard__stats">
        <StatCard label="Total Assigned" value={stats?.total ?? 0} icon="📋" tone="info" />
        <StatCard label="Upcoming" value={stats?.upcoming ?? 0} icon="◷" tone="info" />
        <StatCard label="Live Now" value={stats?.live ?? 0} icon="●" tone="success" />
        <StatCard label="Completed" value={stats?.completed ?? 0} icon="✓" tone="warning" />
      </section>

      {/* Own performance: average score ring, highlights, score trend */}
      {performance && <CandidatePerformancePanel performance={performance} />}

      {/* Upcoming quiz cards with countdown timers */}
      <section className="qa-candidate-dashboard__upcoming">
        <h2 className="qa-candidate-dashboard__section-title">Upcoming Quizzes</h2>
        {upcomingQuizzes.length === 0 ? (
          <EmptyState
            icon="🗓"
            title="No upcoming quizzes"
            message="You have no scheduled quizzes at the moment."
          />
        ) : (
          <div className="qa-candidate-dashboard__upcoming-grid">
            {upcomingQuizzes.map((quiz) => (
              <UpcomingQuizCard key={quiz.id} quiz={quiz} onStart={handleStart} />
            ))}
          </div>
        )}
      </section>

      {/* Full assigned quizzes table */}
      <CandidateQuizTable
        quizzes={quizzes}
        total={total}
        page={page}
        totalPages={totalPages}
        isLoading={isLoading || isFetching}
        search={search}
        onPageChange={setPage}
        onSearchChange={handleSearchChange}
        onStart={handleStart}
        onViewResult={handleViewResult}
      />
    </div>
  );
}
