import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { InstructorQuizTable } from '@/components/organisms/InstructorQuizTable';
import { useListMyQuizzesQuery } from '@/store/api/instructorApi';
import type { InstructorQuiz } from '@/types/quiz';
import './MyQuizzesPage.scss';

/**
 * MyQuizzesPage — full-page list of quizzes assigned to the instructor.
 * Supports search, pagination, and row actions (Edit / View Result).
 */
export function MyQuizzesPage(): JSX.Element {
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
    navigate(`/instructor/quizzes/${quiz.id}`);
  }, [navigate]);

  return (
    <div className="qa-my-quizzes-page">
      <div className="qa-my-quizzes-page__header">
        <h1 className="qa-my-quizzes-page__heading">My Quizzes</h1>
        <p className="qa-my-quizzes-page__subheading">
          Quizzes assigned to you by an administrator.
        </p>
      </div>

      <InstructorQuizTable
        quizzes={data?.items ?? []}
        total={data?.total ?? 0}
        page={page}
        totalPages={data?.totalPages ?? 1}
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
