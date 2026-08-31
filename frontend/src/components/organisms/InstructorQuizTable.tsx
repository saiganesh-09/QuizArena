import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Pagination } from '@/components/atoms/Pagination';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SearchBar } from '@/components/molecules/SearchBar';
import { formatDateTime } from '@/utils/date';
import type { InstructorQuiz } from '@/types/quiz';
import './InstructorQuizTable.scss';

export interface InstructorQuizTableProps {
  quizzes: InstructorQuiz[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  search: string;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onEdit: (quiz: InstructorQuiz) => void;
  onViewResult: (quiz: InstructorQuiz) => void;
}

/**
 * InstructorQuizTable organism — the "My Quizzes" table with search,
 * status color-coding, pagination, and an action column:
 * - Edit for Draft/Scheduled
 * - View Result for Completed
 * - '--' for Cancelled
 */
export function InstructorQuizTable({
  quizzes,
  total,
  page,
  totalPages,
  isLoading,
  search,
  onPageChange,
  onSearchChange,
  onEdit,
  onViewResult,
}: InstructorQuizTableProps): JSX.Element {
  const hasQuizzes = quizzes.length > 0;
  const hasSearch = search.trim().length > 0;

  function renderAction(quiz: InstructorQuiz): JSX.Element {
    if (quiz.status === 'draft' || quiz.status === 'scheduled') {
      return (
        <Button variant="secondary" onClick={() => onEdit(quiz)}>
          Edit
        </Button>
      );
    }
    if (quiz.status === 'completed') {
      return (
        <Button variant="primary" onClick={() => onViewResult(quiz)}>
          View Result
        </Button>
      );
    }
    return <span className="qa-instructor-quiz-table__no-action">—</span>;
  }

  return (
    <section className="qa-instructor-quiz-table">
      <div className="qa-instructor-quiz-table__toolbar">
        <h2 className="qa-instructor-quiz-table__title">My Quizzes</h2>
        <SearchBar value={search} onChange={onSearchChange} placeholder="Search my quizzes…" />
      </div>

      {isLoading ? (
        <div className="qa-instructor-quiz-table__loading">Loading quizzes…</div>
      ) : !hasQuizzes && !hasSearch ? (
        <EmptyState
          icon="📋"
          title="No quizzes assigned"
          message="Quizzes assigned to you by an admin will appear here."
        />
      ) : !hasQuizzes && hasSearch ? (
        <EmptyState
          icon="🔍"
          title="No results found"
          message={`No quizzes match "${search}". Try a different search.`}
          action={
            <Button variant="secondary" onClick={() => onSearchChange('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <>
          <div className="qa-instructor-quiz-table__scroll">
            <table className="qa-instructor-quiz-table__table">
              <thead>
                <tr>
                  <th className="qa-instructor-quiz-table__th">Title</th>
                  <th className="qa-instructor-quiz-table__th">Status</th>
                  <th className="qa-instructor-quiz-table__th">Starts</th>
                  <th className="qa-instructor-quiz-table__th">Questions</th>
                  <th className="qa-instructor-quiz-table__th">Participants</th>
                  <th className="qa-instructor-quiz-table__th qa-instructor-quiz-table__th--right">Action</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="qa-instructor-quiz-table__tr">
                    <td className="qa-instructor-quiz-table__td qa-instructor-quiz-table__td--title">
                      {quiz.title}
                    </td>
                    <td className="qa-instructor-quiz-table__td">
                      <Badge status={quiz.status} />
                    </td>
                    <td className="qa-instructor-quiz-table__td">{formatDateTime(quiz.startTime)}</td>
                    <td className="qa-instructor-quiz-table__td">{quiz.questionCount}</td>
                    <td className="qa-instructor-quiz-table__td">{quiz.participantCount}</td>
                    <td className="qa-instructor-quiz-table__td qa-instructor-quiz-table__td--right">
                      {renderAction(quiz)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={onPageChange} />
        </>
      )}
    </section>
  );
}
