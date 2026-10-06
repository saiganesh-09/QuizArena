import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Pagination } from '@/components/atoms/Pagination';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SearchBar } from '@/components/molecules/SearchBar';
import { formatDateTime } from '@/utils/date';
import type { CandidateQuizMeta } from '@/types/quiz';
import './CandidateQuizTable.scss';

export interface CandidateQuizTableProps {
  quizzes: CandidateQuizMeta[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  search: string;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  onStart: (quiz: CandidateQuizMeta) => void;
  onViewResult: (quiz: CandidateQuizMeta) => void;
}

/**
 * CandidateQuizTable organism — the assigned-quizzes table with search,
 * status color-coding, pagination, and an action column:
 * - "Start Test" for Live quizzes
 * - "View Result" for Completed quizzes
 * - date/time for Upcoming (Scheduled) quizzes
 * - "—" for Cancelled quizzes
 */
export function CandidateQuizTable({
  quizzes,
  total,
  page,
  totalPages,
  isLoading,
  search,
  onPageChange,
  onSearchChange,
  onStart,
  onViewResult,
}: CandidateQuizTableProps): JSX.Element {
  const hasQuizzes = quizzes.length > 0;
  const hasSearch = search.trim().length > 0;

  function renderAction(quiz: CandidateQuizMeta): JSX.Element {
    if (quiz.status === 'live' || quiz.isLiveNow) {
      return (
        <Button variant="primary" onClick={() => onStart(quiz)}>
          Start Test
        </Button>
      );
    }
    if (quiz.status === 'completed') {
      return (
        <Button variant="secondary" onClick={() => onViewResult(quiz)}>
          View Result
        </Button>
      );
    }
    if (quiz.status === 'scheduled') {
      return (
        <span className="qa-candidate-quiz-table__upcoming">
          {formatDateTime(quiz.startTime)}
        </span>
      );
    }
    return <span className="qa-candidate-quiz-table__no-action">—</span>;
  }

  return (
    <section className="qa-candidate-quiz-table">
      <div className="qa-candidate-quiz-table__toolbar">
        <h2 className="qa-candidate-quiz-table__title">Assigned Quizzes</h2>
        <SearchBar value={search} onChange={onSearchChange} placeholder="Search assigned quizzes…" />
      </div>

      {isLoading ? (
        <div className="qa-candidate-quiz-table__loading">Loading quizzes…</div>
      ) : !hasQuizzes && !hasSearch ? (
        <EmptyState
          icon="📋"
          title="No quizzes assigned"
          message="Quizzes assigned to you by an instructor will appear here."
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
          <div className="qa-candidate-quiz-table__scroll">
            <table className="qa-candidate-quiz-table__table">
              <thead>
                <tr>
                  <th className="qa-candidate-quiz-table__th">Title</th>
                  <th className="qa-candidate-quiz-table__th">Status</th>
                  <th className="qa-candidate-quiz-table__th">Starts</th>
                  <th className="qa-candidate-quiz-table__th">Ends</th>
                  <th className="qa-candidate-quiz-table__th">Duration</th>
                  <th className="qa-candidate-quiz-table__th">Questions</th>
                  <th className="qa-candidate-quiz-table__th qa-candidate-quiz-table__th--right">Action</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="qa-candidate-quiz-table__tr">
                    <td className="qa-candidate-quiz-table__td qa-candidate-quiz-table__td--title">
                      {quiz.title}
                      {quiz.kind === 'homework' ? (
                        <span className="qa-kind-badge qa-kind-badge--homework">Homework</span>
                      ) : null}
                    </td>
                    <td className="qa-candidate-quiz-table__td">
                      <Badge status={quiz.status} />
                    </td>
                    <td className="qa-candidate-quiz-table__td">{formatDateTime(quiz.startTime)}</td>
                    <td className="qa-candidate-quiz-table__td">{formatDateTime(quiz.endTime)}</td>
                    <td className="qa-candidate-quiz-table__td">{quiz.durationMinutes} min</td>
                    <td className="qa-candidate-quiz-table__td">{quiz.questionCount}</td>
                    <td className="qa-candidate-quiz-table__td qa-candidate-quiz-table__td--right">
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
