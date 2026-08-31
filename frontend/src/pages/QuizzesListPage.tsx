import { useState, useCallback } from 'react';
import { QuizTable } from '@/components/organisms/QuizTable';
import { AssignInstructorModal } from '@/components/organisms/AssignInstructorModal';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import { useListQuizzesQuery, useCancelQuizMutation } from '@/store/api/adminApi';
import { useToast } from '@/components/organisms/ToastProvider';
import { extractErrorMessage } from '@/utils/errors';
import type { Quiz } from '@/types/quiz';
import './QuizzesListPage.scss';

/**
 * Quizzes List page — the full quizzes management table at /admin/quizzes.
 * Hosts search, pagination, row actions, and the assign/cancel modals.
 */
export function QuizzesListPage(): JSX.Element {
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

  return (
    <div className="qa-quizzes-list-page">
      <div className="qa-quizzes-list-page__header">
        <h1 className="qa-quizzes-list-page__heading">Manage Quizzes</h1>
        <p className="qa-quizzes-list-page__subheading">
          Create, edit, schedule, and cancel quizzes.
        </p>
      </div>

      <QuizTable
        quizzes={data?.items ?? []}
        total={data?.total ?? 0}
        page={page}
        totalPages={data?.totalPages ?? 1}
        isLoading={isLoading || isFetching}
        search={search}
        onPageChange={setPage}
        onSearchChange={handleSearchChange}
        onAssignInstructor={(q) => setAssignTarget(q)}
        onCancelQuiz={(q) => setCancelTarget(q)}
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
