import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TestTimer } from '@/components/atoms/TestTimer';
import { Button } from '@/components/atoms/Button';
import { PreTestModal } from '@/components/organisms/PreTestModal';
import { QuestionPanel } from '@/components/organisms/QuestionPanel';
import { QuestionNavigator } from '@/components/organisms/QuestionNavigator';
import { SubmitConfirmModal } from '@/components/organisms/SubmitConfirmModal';
import { PostSubmitScreen } from '@/components/organisms/PostSubmitScreen';
import { useGetCandidateQuizQuery } from '@/store/api/candidateApi';
import { useStartAttemptMutation, useSubmitAttemptMutation, useGetAttemptQuery } from '@/store/api/attemptApi';
import { useToast } from '@/components/organisms/ToastProvider';
import { extractErrorMessage } from '@/utils/errors';
import type { AttemptPayload } from '@/types/quiz';
import type { AnswerMap, NavStatusMap } from '@/interfaces/attempt';
import { answersToSelections, buildInitialNavStatus, countAnswered } from '@/interfaces/attempt';
import './QuizAttemptPage.scss';

/**
 * QuizAttemptPage — the main test-taking screen.
 *
 * Flow:
 * 1. Pre-test instruction modal (with quiz metadata).
 * 2. On "Start Test": calls startAttempt, receives questions (no answers).
 * 3. Main test screen: question panel + navigator sidebar + timer.
 * 4. Timer auto-submits when it reaches zero.
 * 5. Manual submit: confirmation modal with unanswered count.
 * 6. Post-submit screen: score breakdown, blocks re-entry.
 *
 * Session Lock: after submission, the page shows PostSubmitScreen and
 * prevents navigation back to the test.
 */
export function QuizAttemptPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Fetch quiz metadata for the pre-test modal.
  const { data: quizMeta, isLoading: quizLoading } = useGetCandidateQuizQuery(id);

  // Check for an existing attempt (e.g. page refresh mid-test or post-submit).
  const { data: existingAttempt, isLoading: attemptLoading } = useGetAttemptQuery(id, {
    skip: !id,
  });

  const [startAttempt, { isLoading: starting }] = useStartAttemptMutation();
  const [submitAttempt, { isLoading: submitting }] = useSubmitAttemptMutation();

  // Page state: 'pre-test' | 'in-progress' | 'submitted'
  const [phase, setPhase] = useState<'pre-test' | 'in-progress' | 'submitted'>('pre-test');
  const [attempt, setAttempt] = useState<AttemptPayload | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [navStatus, setNavStatus] = useState<NavStatusMap>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [submitModalOpen, setSubmitModalOpen] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Ref to prevent double auto-submit.
  const autoSubmittedRef = useRef<boolean>(false);

  // If an existing attempt is found on mount, transition to the right phase.
  useEffect(() => {
    if (attemptLoading || !existingAttempt) return;
    if (existingAttempt.status === 'submitted' || existingAttempt.status === 'auto-submitted') {
      setAttempt(existingAttempt);
      setPhase('submitted');
    } else if (existingAttempt.status === 'in-progress') {
      setAttempt(existingAttempt);
      setAnswers({});
      setNavStatus(buildInitialNavStatus(existingAttempt.questions));
      setCurrentIndex(0);
      setPhase('in-progress');
    }
  }, [existingAttempt, attemptLoading]);

  const handleStart = useCallback(async () => {
    setSubmitError(null);
    try {
      const result = await startAttempt(id).unwrap();
      setAttempt(result);
      setAnswers({});
      setNavStatus(buildInitialNavStatus(result.questions));
      setCurrentIndex(0);
      setPhase('in-progress');
    } catch (err) {
      // 409 means already submitted — check if we have the attempt in the error.
      const errorObj = err as { status?: number; data?: { data?: AttemptPayload; error?: { message?: string } } };
      if (errorObj?.status === 409 && errorObj?.data?.data) {
        setAttempt(errorObj.data.data);
        setPhase('submitted');
      } else {
        showToast('error', extractErrorMessage(err));
      }
    }
  }, [id, startAttempt, showToast]);

  const handleSelectionChange = useCallback((optionIds: string[]) => {
    if (!attempt) return;
    const qid = attempt.questions[currentIndex].id;
    setAnswers((prev) => ({ ...prev, [qid]: optionIds }));
    setNavStatus((prev) => ({
      ...prev,
      [qid]: optionIds.length > 0 ? 'answered' : 'visited',
    }));
  }, [attempt, currentIndex]);

  const goToQuestion = useCallback((index: number) => {
    if (!attempt) return;
    setCurrentIndex(index);
    // Mark as visited if not already answered.
    const qid = attempt.questions[index].id;
    setNavStatus((prev) => ({
      ...prev,
      [qid]: prev[qid] === 'answered' ? 'answered' : 'visited',
    }));
  }, [attempt]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((idx) => Math.max(0, idx - 1));
  }, []);

  const handleNext = useCallback(() => {
    if (!attempt) return;
    setCurrentIndex((idx) => Math.min(attempt.questions.length - 1, idx + 1));
  }, [attempt]);

  const doSubmit = useCallback(async (isAuto: boolean) => {
    if (!attempt || autoSubmittedRef.current) return;
    if (isAuto) autoSubmittedRef.current = true;
    setSubmitError(null);
    try {
      const result = await submitAttempt({
        quizId: id,
        answers: answersToSelections(answers),
      }).unwrap();
      setAttempt(result);
      setPhase('submitted');
      if (isAuto) {
        showToast('info', 'Time is up — your test has been auto-submitted.');
      } else {
        showToast('success', 'Test submitted successfully.');
      }
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
      showToast('error', extractErrorMessage(err));
      // If it's a conflict (already submitted), show post-submit.
      const errorObj = err as { status?: number };
      if (errorObj?.status === 409) {
        setPhase('submitted');
      }
    }
  }, [attempt, answers, id, submitAttempt, showToast]);

  const handleManualSubmit = useCallback(() => {
    setSubmitModalOpen(false);
    void doSubmit(false);
  }, [doSubmit]);

  const handleAutoSubmit = useCallback(() => {
    void doSubmit(true);
  }, [doSubmit]);

  // --- Render phases ---

  // Loading state
  if (quizLoading || attemptLoading) {
    return (
      <div className="qa-quiz-attempt qa-quiz-attempt--loading">
        <p>Loading quiz…</p>
      </div>
    );
  }

  // Post-submit phase (session lock)
  if (phase === 'submitted' && attempt) {
    return (
      <PostSubmitScreen
        attempt={attempt}
        onBackToDashboard={() => navigate('/candidate/dashboard')}
        onViewResults={() => navigate(`/candidate/quizzes/${id}/result`)}
      />
    );
  }

  // In-progress phase (main test screen)
  if (phase === 'in-progress' && attempt) {
    const currentQuestion = attempt.questions[currentIndex];
    const answeredCount = countAnswered(answers);

    return (
      <div className="qa-quiz-attempt">
        <div className="qa-quiz-attempt__topbar">
          <div className="qa-quiz-attempt__topbar-left">
            <h1 className="qa-quiz-attempt__title">{attempt.quizTitle}</h1>
          </div>
          <div className="qa-quiz-attempt__topbar-right">
            <TestTimer deadlineAt={attempt.deadlineAt} onZero={handleAutoSubmit} />
            <Button variant="primary" onClick={() => setSubmitModalOpen(true)}>
              Submit Test
            </Button>
          </div>
        </div>

        {submitError ? (
          <div className="qa-quiz-attempt__error" role="alert">{submitError}</div>
        ) : null}

        <div className="qa-quiz-attempt__body">
          <QuestionPanel
            question={currentQuestion}
            index={currentIndex}
            total={attempt.questions.length}
            selectedOptionIds={answers[currentQuestion.id] ?? []}
            onSelectionChange={handleSelectionChange}
            onPrev={handlePrev}
            onNext={handleNext}
            isFirst={currentIndex === 0}
            isLast={currentIndex === attempt.questions.length - 1}
          />
          <QuestionNavigator
            questions={attempt.questions}
            navStatus={navStatus}
            currentIndex={currentIndex}
            answeredCount={answeredCount}
            onJumpTo={goToQuestion}
            onSubmit={() => setSubmitModalOpen(true)}
          />
        </div>

        <SubmitConfirmModal
          open={submitModalOpen}
          questions={attempt.questions}
          answers={answers}
          isLoading={submitting}
          onConfirm={handleManualSubmit}
          onCancel={() => setSubmitModalOpen(false)}
        />
      </div>
    );
  }

  // Pre-test phase (instruction modal)
  return (
    <div className="qa-quiz-attempt qa-quiz-attempt--pre-test">
      <div className="qa-quiz-attempt__pre-test-info">
        <h1 className="qa-quiz-attempt__title">{quizMeta?.title ?? 'Quiz'}</h1>
        <p className="qa-quiz-attempt__pre-test-text">
          Review the instructions and click "Start Test" when you are ready.
          The timer will begin immediately.
        </p>
      </div>
      <PreTestModal
        open={true}
        quiz={quizMeta ?? null}
        onStart={() => void handleStart()}
        onCancel={() => navigate('/candidate/dashboard')}
        isLoading={starting}
      />
    </div>
  );
}
