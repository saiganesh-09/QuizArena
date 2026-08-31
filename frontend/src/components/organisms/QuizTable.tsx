import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Pagination } from '@/components/atoms/Pagination';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SearchBar } from '@/components/molecules/SearchBar';
import { useDeleteQuizMutation } from '@/store/api/adminApi';
import { useToast } from '@/components/organisms/ToastProvider';
import { extractErrorMessage } from '@/utils/errors';
import { formatDateTime, statusLabel } from '@/utils/date';
import type { Quiz } from '@/types/quiz';
import type { QuizRowAction } from '@/interfaces/quiz';
import './QuizTable.scss';

export interface QuizTableProps {
  quizzes: Quiz[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  search: string;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  /** Called to open the assign-instructor modal for a quiz. */
  onAssignInstructor: (quiz: Quiz) => void;
  /** Called to open the cancel confirmation for a quiz. */
  onCancelQuiz: (quiz: Quiz) => void;
}

/**
 * QuizTable organism — the admin quizzes table with search, status
 * color-coding, row actions (Edit, Cancel, Assign Instructor), and
 * empty states for "no quizzes" and "no search results".
 */
export function QuizTable({
  quizzes,
  total,
  page,
  totalPages,
  isLoading,
  search,
  onPageChange,
  onSearchChange,
  onAssignInstructor,
  onCancelQuiz,
}: QuizTableProps): JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [deleteQuiz] = useDeleteQuizMutation();

  const hasQuizzes = quizzes.length > 0;
  const hasSearch = search.trim().length > 0;

  const rowActions = useMemo<QuizRowAction[]>(() => [
    {
      label: 'Edit',
      variant: 'secondary',
      onClick: (q) => navigate(`/admin/quizzes/${q.id}/edit`),
      disabled: (q) => q.status !== 'draft' && q.status !== 'scheduled',
      title: (q) =>
        q.status === 'draft' || q.status === 'scheduled'
          ? 'Edit quiz'
          : `Cannot edit a ${statusLabel(q.status)} quiz`,
    },
    {
      label: 'Assign Instructor',
      variant: 'ghost',
      onClick: (q) => onAssignInstructor(q),
      disabled: (q) => q.status === 'cancelled',
      title: (q) => (q.status === 'cancelled' ? 'Cannot assign to a cancelled quiz' : 'Assign instructor'),
    },
    {
      label: 'Cancel',
      variant: 'danger',
      onClick: (q) => onCancelQuiz(q),
      disabled: (q) => q.status === 'completed' || q.status === 'cancelled',
      title: (q) =>
        q.status === 'completed'
          ? 'Completed quizzes cannot be cancelled'
          : q.status === 'cancelled'
            ? 'Already cancelled'
            : 'Cancel quiz',
    },
  ], [navigate, onAssignInstructor, onCancelQuiz]);

  async function handleDelete(quiz: Quiz): Promise<void> {
    try {
      await deleteQuiz(quiz.id).unwrap();
      showToast('success', 'Quiz deleted');
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    }
  }

  return (
    <section className="qa-quiz-table">
      <div className="qa-quiz-table__toolbar">
        <h2 className="qa-quiz-table__title">Quizzes</h2>
        <div className="qa-quiz-table__actions">
          <SearchBar value={search} onChange={onSearchChange} placeholder="Search quizzes…" />
          <Button variant="primary" onClick={() => navigate('/admin/quizzes/new')}>
            + New Quiz
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="qa-quiz-table__loading">Loading quizzes…</div>
      ) : !hasQuizzes && !hasSearch ? (
        <EmptyState
          icon="📋"
          title="No quizzes yet"
          message="Create your first quiz to get started."
          action={
            <Button variant="primary" onClick={() => navigate('/admin/quizzes/new')}>
              + New Quiz
            </Button>
          }
        />
      ) : !hasQuizzes && hasSearch ? (
        <EmptyState
          icon="🔍"
          title="No results found"
          message={`No quizzes match "${search}". Try a different search term.`}
          action={
            <Button variant="secondary" onClick={() => onSearchChange('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <>
          <div className="qa-quiz-table__scroll">
            <table className="qa-quiz-table__table">
              <thead>
                <tr>
                  <th className="qa-quiz-table__th">Title</th>
                  <th className="qa-quiz-table__th">Status</th>
                  <th className="qa-quiz-table__th">Starts</th>
                  <th className="qa-quiz-table__th">Ends</th>
                  <th className="qa-quiz-table__th">Duration</th>
                  <th className="qa-quiz-table__th">Instructors</th>
                  <th className="qa-quiz-table__th qa-quiz-table__th--right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="qa-quiz-table__tr">
                    <td className="qa-quiz-table__td qa-quiz-table__td--title">
                      <span className="qa-quiz-table__quiz-title">{quiz.title}</span>
                      {quiz.description ? (
                        <span className="qa-quiz-table__quiz-desc">{quiz.description}</span>
                      ) : null}
                    </td>
                    <td className="qa-quiz-table__td">
                      <Badge status={quiz.status} />
                    </td>
                    <td className="qa-quiz-table__td">{formatDateTime(quiz.startTime)}</td>
                    <td className="qa-quiz-table__td">{formatDateTime(quiz.endTime)}</td>
                    <td className="qa-quiz-table__td">{quiz.durationMinutes}m</td>
                    <td className="qa-quiz-table__td">
                      {quiz.instructors.length > 0 ? (
                        <span className="qa-quiz-table__instructors">
                          {quiz.instructors.length} assigned
                        </span>
                      ) : (
                        <span className="qa-quiz-table__muted">None</span>
                      )}
                    </td>
                    <td className="qa-quiz-table__td qa-quiz-table__td--right">
                      <div className="qa-quiz-table__row-actions">
                        {rowActions.map((action) => {
                          const disabled = action.disabled?.(quiz) ?? false;
                          const title = action.title?.(quiz) ?? action.label;
                          return (
                            <Button
                              key={action.label}
                              variant={action.variant}
                              onClick={() => action.onClick(quiz)}
                              disabled={disabled}
                              title={title}
                            >
                              {action.label}
                            </Button>
                          );
                        })}
                        {quiz.status === 'draft' ? (
                          <Button
                            variant="ghost"
                            onClick={() => void handleDelete(quiz)}
                            title="Delete draft quiz"
                          >
                            Delete
                          </Button>
                        ) : null}
                      </div>
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
            onPageChange={onPageChange}
          />
        </>
      )}
    </section>
  );
}
