import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CandidateQuizTable } from '@/components/organisms/CandidateQuizTable';
import { useListCandidateQuizzesQuery } from '@/store/api/candidateApi';
import type { CandidateQuizMeta } from '@/types/quiz';
import './CandidateHomeworkPage.scss';

/**
 * CandidateHomeworkPage — daily homework assignments (quizzes with
 * kind='homework'). Uses the same attempt engine as regular quizzes.
 */
export function CandidateHomeworkPage(): JSX.Element {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const limit = 10;

  const { data, isLoading, isFetching } = useListCandidateQuizzesQuery({
    page,
    limit,
    search,
    kind: 'homework',
  });

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
    <div className="qa-homework-page">
      <div className="qa-homework-page__header">
        <h1 className="qa-homework-page__heading">My Homework</h1>
        <p className="qa-homework-page__subheading">
          Daily assignments from your teachers — each homework has at least 10 questions.
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
