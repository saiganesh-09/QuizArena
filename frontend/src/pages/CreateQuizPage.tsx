import { QuizForm } from '@/components/organisms/QuizForm';
import './CreateQuizPage.scss';

/** Create Quiz page — renders the QuizForm in create mode. */
export function CreateQuizPage(): JSX.Element {
  return (
    <div className="qa-create-quiz-page">
      <QuizForm mode="create" />
    </div>
  );
}
