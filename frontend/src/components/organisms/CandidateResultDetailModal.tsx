import { useEffect, useState } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { ScoreRing } from '@/components/atoms/ScoreRing';
import { Spinner } from '@/components/atoms/Spinner';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { useGetInstructorAttemptDetailQuery, useGradeAttemptMutation } from '@/store/api/resultsApi';
import { formatDuration } from '@/interfaces/results';
import { formatDateTime } from '@/utils/date';
import './CandidateResultDetailModal.scss';

export interface CandidateResultDetailModalProps {
  quizId: string;
  /** Attempt to display; null hides the modal. */
  attemptId: string | null;
  onClose: () => void;
}

/**
 * CandidateResultDetailModal organism — per-student deep dive for the
 * instructor results table. Shows a score ring, rank, remark, and a
 * question-by-question score graph with selected vs correct answers.
 */
export function CandidateResultDetailModal({
  quizId,
  attemptId,
  onClose,
}: CandidateResultDetailModalProps): JSX.Element | null {
  const { data, isLoading } = useGetInstructorAttemptDetailQuery(
    { quizId, attemptId: attemptId ?? '' },
    { skip: !attemptId },
  );
  const [gradeAttempt, { isLoading: isSaving }] = useGradeAttemptMutation();

  const [gradeScore, setGradeScore] = useState<string>('');
  const [gradeRemark, setGradeRemark] = useState<string>('');
  const [gradeError, setGradeError] = useState<string>('');

  // Sync the form whenever a different attempt loads.
  useEffect(() => {
    setGradeScore(data ? String(data.score) : '');
    setGradeRemark(data?.teacherRemark ?? '');
    setGradeError('');
  }, [data?.attemptId, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveGrade = (): void => {
    if (!attemptId || !data) return;
    setGradeError('');
    const score = gradeScore.trim() === '' ? undefined : parseInt(gradeScore, 10);
    if (score !== undefined && (!Number.isFinite(score) || score < 0 || score > data.maxScore)) {
      setGradeError(`Score must be between 0 and ${data.maxScore}.`);
      return;
    }
    void gradeAttempt({ quizId, attemptId, score, teacherRemark: gradeRemark.trim() })
      .unwrap()
      .catch(() => setGradeError('Could not save the grade. Please try again.'));
  };

  return (
    <Modal open={attemptId !== null} title="Candidate Performance" onClose={onClose}>
      {isLoading || !data ? (
        <div className="qa-cand-detail__loading">
          <Spinner />
        </div>
      ) : (
        <div className="qa-cand-detail">
          <div className="qa-cand-detail__summary">
            <ScoreRing percentage={data.percentage} size={110} />
            <div className="qa-cand-detail__meta">
              <span className="qa-cand-detail__name">{data.candidateName}</span>
              <span className="qa-cand-detail__email">{data.candidateEmail}</span>
              <div className="qa-cand-detail__chips">
                <span className="qa-cand-detail__chip qa-cand-detail__chip--rank">Rank #{data.rank}</span>
                <span className="qa-cand-detail__chip">Score {data.score}/{data.maxScore}</span>
                <span className={`qa-cand-detail__chip qa-cand-detail__chip--${data.percentage >= 80 ? 'excellent' : data.percentage >= 60 ? 'good' : data.percentage >= 40 ? 'average' : 'poor'}`}>
                  {data.remark}
                </span>
              </div>
              <div className="qa-cand-detail__facts">
                <span>Correct: {data.correctCount}/{data.totalQuestions}</span>
                <span>Time: {formatDuration(data.timeTakenSeconds)}</span>
                <span>Submitted: {data.submittedAt ? formatDateTime(data.submittedAt) : '—'}</span>
              </div>
            </div>
          </div>

          <div className="qa-cand-detail__graph">
            <h3 className="qa-cand-detail__graph-title">Question-by-question</h3>
            {data.answers.map((a, idx) => {
              const barPct = a.maxPoints > 0 ? Math.round((a.awardedPoints / a.maxPoints) * 100) : 0;
              const selectedTexts = a.options.filter((o) => a.selectedOptionIds.includes(o.id)).map((o) => o.text);
              const correctTexts = a.options.filter((o) => a.correctOptionIds.includes(o.id)).map((o) => o.text);
              return (
                <div key={a.questionId} className="qa-cand-detail__qrow">
                  <div className="qa-cand-detail__qrow-head">
                    <span className={`qa-cand-detail__qnum ${a.isCorrect ? 'qa-cand-detail__qnum--ok' : 'qa-cand-detail__qnum--miss'}`}>
                      Q{idx + 1}
                    </span>
                    <span className="qa-cand-detail__qtext">{a.questionText}</span>
                    <span className="qa-cand-detail__qpts">{a.awardedPoints}/{a.maxPoints} pts</span>
                  </div>
                  <div className="qa-cand-detail__bar-track">
                    <div
                      className={`qa-cand-detail__bar ${a.isCorrect ? 'qa-cand-detail__bar--ok' : 'qa-cand-detail__bar--miss'}`}
                      style={{ width: `${Math.max(barPct, 3)}%` }}
                    />
                  </div>
                  <div className="qa-cand-detail__answers">
                    <span className={`qa-cand-detail__pick ${a.isCorrect ? 'qa-cand-detail__pick--ok' : 'qa-cand-detail__pick--miss'}`}>
                      Answered: {selectedTexts.length ? selectedTexts.join(', ') : '—'}
                    </span>
                    {!a.isCorrect && (
                      <span className="qa-cand-detail__pick qa-cand-detail__pick--correct">
                        Correct: {correctTexts.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="qa-cand-detail__grade">
            <h3 className="qa-cand-detail__graph-title">Teacher grading</h3>
            <div className="qa-cand-detail__grade-form">
              <Input
                label={`Score (0–${data.maxScore})`}
                type="number"
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
              />
              <Input
                label="Remark for student"
                value={gradeRemark}
                onChange={(e) => setGradeRemark(e.target.value)}
                placeholder="e.g. Great effort — revise closures"
              />
            </div>
            {gradeError ? <p className="qa-cand-detail__grade-error">{gradeError}</p> : null}
            <Button variant="primary" onClick={handleSaveGrade} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save grade'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
