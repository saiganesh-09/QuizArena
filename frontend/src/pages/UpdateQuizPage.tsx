import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/atoms/Breadcrumbs';
import { Button } from '@/components/atoms/Button';
import { Tabs } from '@/components/atoms/Tabs';
import { ReadinessBadge } from '@/components/atoms/ReadinessBadge';
import { ScheduleBanner } from '@/components/organisms/ScheduleBanner';
import { QuestionTab } from '@/components/organisms/QuestionTab';
import { ParticipantTab } from '@/components/organisms/ParticipantTab';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import { useGetMyQuizQuery, useCancelMyQuizMutation, usePublishMyQuizMutation } from '@/store/api/instructorApi';
import { useToast } from '@/components/organisms/ToastProvider';
import { extractErrorMessage } from '@/utils/errors';
import type { QuizTab } from '@/interfaces/instructor';
import './UpdateQuizPage.scss';

/**
 * UpdateQuizPage — the instructor's tabbed quiz workspace.
 *
 * Contains:
 * - Breadcrumbs + "Back to Quiz List" button
 * - Schedule banner (color-coded, dynamic)
 * - Draft Readiness indicators
 * - Questions Tab (manual add modal, CSV import, list with edit/delete)
 * - Participants Tab (manual email add, CSV import, list with remove)
 * - Cancel Quiz + Publish buttons
 */
export function UpdateQuizPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: quiz, isLoading } = useGetMyQuizQuery(id);
  const [cancelQuiz] = useCancelMyQuizMutation();
  const [publishQuiz] = usePublishMyQuizMutation();

  const [activeTab, setActiveTab] = useState<QuizTab>('questions');
  const [cancelOpen, setCancelOpen] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      await cancelQuiz(id).unwrap();
      showToast('success', 'Quiz cancelled');
      setCancelOpen(false);
      navigate('/instructor/quizzes');
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }, [cancelQuiz, id, navigate, showToast]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      await publishQuiz(id).unwrap();
      showToast('success', 'Quiz published — status is now Scheduled');
    } catch (err) {
      const msg = extractErrorMessage(err);
      showToast('error', msg || 'Quiz is not ready to publish');
    } finally {
      setPublishing(false);
    }
  }, [publishQuiz, id, showToast]);

  if (isLoading || !quiz) {
    return (
      <div className="qa-update-quiz qa-update-quiz--loading">
        <p>Loading quiz…</p>
      </div>
    );
  }

  const isEditable = quiz.status === 'draft' || quiz.status === 'scheduled';
  const canRemoveParticipants = quiz.status === 'draft' || quiz.status === 'scheduled';
  const canPublish = quiz.status === 'draft';
  const canCancel = quiz.status !== 'completed' && quiz.status !== 'cancelled';

  return (
    <div className="qa-update-quiz">
      <div className="qa-update-quiz__topbar">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/instructor/dashboard' },
            { label: 'My Quizzes', to: '/instructor/quizzes' },
            { label: quiz.title },
          ]}
        />
        <Link to="/instructor/quizzes" className="qa-update-quiz__back">
          ← Back to Quiz List
        </Link>
      </div>

      <ScheduleBanner quiz={quiz} />

      {canPublish ? <ReadinessBadge ready={quiz.readiness.ready} missing={quiz.readiness.missing} /> : null}

      <div className="qa-update-quiz__actions">
        {canCancel ? (
          <Button variant="danger" onClick={() => setCancelOpen(true)} disabled={cancelling}>
            Cancel Quiz
          </Button>
        ) : null}
        {canPublish ? (
          <Button
            variant="primary"
            onClick={() => void handlePublish()}
            isLoading={publishing}
            disabled={!quiz.readiness.ready}
            title={quiz.readiness.ready ? 'Publish this quiz (Draft → Scheduled)' : 'Quiz is not ready to publish'}
          >
            Publish Quiz
          </Button>
        ) : null}
      </div>

      <div className="qa-update-quiz__tabs">
        <Tabs
          tabs={[
            { id: 'questions', label: 'Questions', badge: quiz.questionCount },
            { id: 'participants', label: 'Participants', badge: quiz.participantCount },
          ]}
          active={activeTab}
          onChange={(t) => setActiveTab(t as QuizTab)}
        />
      </div>

      <div className="qa-update-quiz__panel">
        {activeTab === 'questions' ? (
          <QuestionTab quizId={id} isEditable={isEditable} />
        ) : (
          <ParticipantTab quizId={id} isEditable={isEditable} canRemove={canRemoveParticipants} />
        )}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel Quiz"
        message={`Are you sure you want to cancel "${quiz.title}"? This action cannot be undone.`}
        confirmLabel="Cancel Quiz"
        isLoading={cancelling}
        onConfirm={() => void handleCancel()}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}
