import { useParams, Navigate } from 'react-router-dom';
import { QuizForm } from '@/components/organisms/QuizForm';
import { Spinner } from '@/components/atoms/Spinner';
import { useGetQuizQuery } from '@/store/api/adminApi';
import './EditQuizPage.scss';

/**
 * Edit Quiz page — fetches the quiz by id and renders the QuizForm in
 * edit mode, pre-populated with the quiz's current details. Redirects
 * to the quizzes list if the id is missing or the quiz is not found.
 */
export function EditQuizPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();

  const { data: quiz, isLoading, isError } = useGetQuizQuery(id ?? '', {
    skip: !id,
  });

  if (!id) {
    return <Navigate to="/admin/quizzes" replace />;
  }

  if (isLoading) {
    return (
      <div className="qa-edit-quiz-page qa-edit-quiz-page--loading" role="status">
        <Spinner size="lg" label="Loading quiz" />
      </div>
    );
  }

  if (isError || !quiz) {
    return <Navigate to="/admin/quizzes" replace />;
  }

  return (
    <div className="qa-edit-quiz-page">
      <QuizForm mode="edit" quiz={quiz} />
    </div>
  );
}
