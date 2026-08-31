import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CandidateQuizTable } from '@/components/organisms/CandidateQuizTable';
import { useListCandidateQuizzesQuery } from '@/store/api/candidateApi';
import type { CandidateQuizMeta } from '@/types/quiz';
import './MyCandidateQuizzesPage.scss';

/**
 * MyCandidateQuizzesPage — full-page list of quizzes assigned to the
 * candidate. Supports search, pagination, and row actions.
 */
export function MyCandidateQuizzesPage(): JSX.Element {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const limit = 10;

  const { data, isLoading, isFetching } = useListCandidateQuizzesQuery({ page, limit, search });

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

  return (
    <div className="qa-my-candidate-quizzes-page">
      <div className="qa-my-candidate-quizzes-page__header">
        <h1 className="qa-my-candidate-quizzes-page__heading">My Quizzes</h1>
        <p className="qa-my-candidate-quizzes-page__subheading">
          Quizzes assigned to you by your instructors.
        </p>
      </div>

      <CandidateQuizTable
        quizzes={data?.items ?? []}
        total={data?.total ?? 0}
        page={page}
        totalPages={data?.totalPages ?? 1}
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
