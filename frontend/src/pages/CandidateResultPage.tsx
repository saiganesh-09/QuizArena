import { useParams, useNavigate } from 'react-router-dom';
import { CandidateResultView } from '@/components/organisms/CandidateResultView';
import { useGetCandidateResultQuery } from '@/store/api/resultsApi';
import { useToast } from '@/components/organisms/ToastProvider';
import { extractErrorMessage } from '@/utils/errors';
import './CandidateResultPage.scss';

/**
 * CandidateResultPage — the candidate's own result page.
 *
 * Fetches the candidate's result (with correct answers revealed, since
 * the backend only returns them after submission). Shows a 404 / not-
 * submitted message if the attempt doesn't exist or isn't submitted.
 */
export function CandidateResultPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: result, isLoading, error } = useGetCandidateResultQuery(id, {
    skip: !id,
  });

  if (isLoading) {
    return (
      <div className="qa-candidate-result-page qa-candidate-result-page--loading">
        <p>Loading your result…</p>
      </div>
    );
  }

  if (error || !result) {
    const message = error ? extractErrorMessage(error) : 'Result not found.';
    showToast('error', message);
    return (
      <div className="qa-candidate-result-page qa-candidate-result-page--error">
        <div className="qa-candidate-result-page__error-card">
          <h2>Result Unavailable</h2>
          <p>{message}</p>
          <button
            className="qa-candidate-result-page__back"
            onClick={() => navigate('/candidate/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qa-candidate-result-page">
      <CandidateResultView result={result} onBack={() => navigate('/candidate/dashboard')} />
    </div>
  );
}
