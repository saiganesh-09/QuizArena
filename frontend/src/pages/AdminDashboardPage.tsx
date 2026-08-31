import { useState, useCallback } from 'react';
import { StatCard } from '@/components/atoms/StatCard';
import { StatChart } from '@/components/organisms/StatChart';
import { QuizTable } from '@/components/organisms/QuizTable';
import { AssignInstructorModal } from '@/components/organisms/AssignInstructorModal';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import { useListQuizzesQuery, useCancelQuizMutation } from '@/store/api/adminApi';
import { useToast } from '@/components/organisms/ToastProvider';
import { extractErrorMessage } from '@/utils/errors';
import type { Quiz } from '@/types/quiz';
import './AdminDashboardPage.scss';

/**
 * Admin Dashboard page — the main admin landing screen.
 * Renders stat cards, a quiz-status donut chart, and the quizzes table
 * with search, pagination, and row actions. Hosts the assign-instructor
 * and cancel-confirmation modals.
 */
export function AdminDashboardPage(): JSX.Element {
  const { showToast } = useToast();
  const [cancelQuiz, { isLoading: isCancelling }] = useCancelQuizMutation();

  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const limit = 10;

  const { data, isLoading, isFetching } = useListQuizzesQuery({ page, limit, search });
  const [assignTarget, setAssignTarget] = useState<Quiz | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Quiz | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleAssignInstructor = useCallback((quiz: Quiz) => {
    setAssignTarget(quiz);
  }, []);

  const handleCancelQuiz = useCallback((quiz: Quiz) => {
    setCancelTarget(quiz);
  }, []);

  async function confirmCancel(): Promise<void> {
    if (!cancelTarget) return;
    try {
      await cancelQuiz(cancelTarget.id).unwrap();
      showToast('success', `Quiz "${cancelTarget.title}" cancelled`);
      setCancelTarget(null);
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    }
  }

  const stats = data?.stats;
  const quizzes = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="qa-admin-dashboard">
      <div className="qa-admin-dashboard__header">
        <h1 className="qa-admin-dashboard__heading">Admin Dashboard</h1>
        <p className="qa-admin-dashboard__subheading">
          Manage quizzes, instructors, and quiz lifecycles.
        </p>
      </div>

      <section className="qa-admin-dashboard__stats">
        <StatCard
          label="Total Quizzes"
          value={stats?.total ?? 0}
          icon="📋"
          tone="info"
        />
        <StatCard
          label="Live Now"
          value={stats?.live ?? 0}
          icon="●"
          tone="success"
        />
        <StatCard
          label="Scheduled"
          value={stats?.scheduled ?? 0}
          icon="◷"
          tone="info"
        />
        <StatCard
          label="Completed"
          value={stats?.completed ?? 0}
          icon="✓"
          tone="warning"
        />
        <StatCard
          label="Cancelled"
          value={stats?.cancelled ?? 0}
          icon="✕"
          tone="danger"
        />
      </section>

      <section className="qa-admin-dashboard__chart">
        {stats ? <StatChart stats={stats} /> : null}
      </section>

      <QuizTable
        quizzes={quizzes}
        total={total}
        page={page}
        totalPages={totalPages}
        isLoading={isLoading || isFetching}
        search={search}
        onPageChange={setPage}
        onSearchChange={handleSearchChange}
        onAssignInstructor={handleAssignInstructor}
        onCancelQuiz={handleCancelQuiz}
      />

      <AssignInstructorModal
        quiz={assignTarget}
        open={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel Quiz"
        message={
          cancelTarget
            ? `Are you sure you want to cancel "${cancelTarget.title}"? This will set its status to Cancelled and it will become read-only. This action cannot be undone.`
            : ''
        }
        confirmLabel="Yes, cancel quiz"
        isLoading={isCancelling}
        onConfirm={() => void confirmCancel()}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
