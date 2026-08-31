import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/atoms/StatCard';
import { StatChart } from '@/components/organisms/StatChart';
import { InstructorQuizTable } from '@/components/organisms/InstructorQuizTable';
import { useListMyQuizzesQuery } from '@/store/api/instructorApi';
import type { InstructorQuiz } from '@/types/quiz';
import './InstructorDashboardPage.scss';

/**
 * Instructor Dashboard page — the main instructor landing screen.
 * Renders stat cards, a donut chart of quiz statuses, and the
 * "My Quizzes" table with search, pagination, and row actions.
 */
export function InstructorDashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const limit = 10;

  const { data, isLoading, isFetching } = useListMyQuizzesQuery({ page, limit, search });

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleEdit = useCallback((quiz: InstructorQuiz) => {
    navigate(`/instructor/quizzes/${quiz.id}`);
  }, [navigate]);

  const handleViewResult = useCallback((quiz: InstructorQuiz) => {
    // Results view will be implemented in a later milestone.
    navigate(`/instructor/quizzes/${quiz.id}`);
  }, [navigate]);

  const stats = data?.stats;
  const quizzes = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="qa-instructor-dashboard">
      <div className="qa-instructor-dashboard__header">
        <h1 className="qa-instructor-dashboard__heading">Instructor Dashboard</h1>
        <p className="qa-instructor-dashboard__subheading">
          Manage quizzes assigned to you.
        </p>
      </div>

      <section className="qa-instructor-dashboard__stats">
        <StatCard label="Total Quizzes" value={stats?.total ?? 0} icon="📋" tone="info" />
        <StatCard label="Scheduled" value={stats?.scheduled ?? 0} icon="◷" tone="info" />
        <StatCard label="Completed" value={stats?.completed ?? 0} icon="✓" tone="warning" />
        <StatCard label="Cancelled" value={stats?.cancelled ?? 0} icon="✕" tone="danger" />
      </section>

      <section className="qa-instructor-dashboard__chart">
        {stats ? <StatChart stats={stats} /> : null}
      </section>

      <InstructorQuizTable
        quizzes={quizzes}
        total={total}
        page={page}
        totalPages={totalPages}
        isLoading={isLoading || isFetching}
        search={search}
        onPageChange={setPage}
        onSearchChange={handleSearchChange}
        onEdit={handleEdit}
        onViewResult={handleViewResult}
      />
    </div>
  );
}
