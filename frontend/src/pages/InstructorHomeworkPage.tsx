import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { InstructorQuizTable } from '@/components/organisms/InstructorQuizTable';
import { Modal } from '@/components/atoms/Modal';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { useListMyQuizzesQuery, useCreateMyQuizMutation } from '@/store/api/instructorApi';
import type { InstructorQuiz } from '@/types/quiz';
import './InstructorHomeworkPage.scss';

/**
 * InstructorHomeworkPage — daily homework assignments (kind='homework').
 *
 * Teachers create a homework draft for today (window: now → end of day
 * UTC), then add >= 10 questions and participants on the quiz workspace
 * page, and publish — the readiness gate enforces the 10-question rule.
 */
export function InstructorHomeworkPage(): JSX.Element {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('30');
  const [formError, setFormError] = useState<string>('');
  const limit = 10;

  const { data, isLoading, isFetching } = useListMyQuizzesQuery({
    page,
    limit,
    search,
    kind: 'homework',
  });
  const [createQuiz, { isLoading: isCreating }] = useCreateMyQuizMutation();

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleOpen = useCallback((quiz: InstructorQuiz) => {
    navigate(`/instructor/quizzes/${quiz.id}`);
  }, [navigate]);

  const handleCreate = useCallback(() => {
    setFormError('');
    const trimmed = title.trim();
    if (trimmed.length < 3) {
      setFormError('Title must be at least 3 characters.');
      return;
    }
    const minutes = parseInt(durationMinutes, 10);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 10080) {
      setFormError('Duration must be between 1 and 10080 minutes.');
      return;
    }

    const start = new Date();
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999); // homework is due end of today (UTC)

    void (async () => {
      try {
        const quiz = await createQuiz({
          title: trimmed,
          description: description.trim(),
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          durationMinutes: minutes,
          kind: 'homework',
        }).unwrap();
        setCreateOpen(false);
        setTitle('');
        setDescription('');
        setDurationMinutes('30');
        navigate(`/instructor/quizzes/${quiz.id}`);
      } catch {
        setFormError('Could not create the homework. Please try again.');
      }
    })();
  }, [title, description, durationMinutes, createQuiz, navigate]);

  return (
    <div className="qa-instructor-homework">
      <div className="qa-instructor-homework__header">
        <div>
          <h1 className="qa-instructor-homework__heading">Homework</h1>
          <p className="qa-instructor-homework__subheading">
            Assign daily homework to your students — each homework requires at least 10 questions.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          + Assign Homework
        </Button>
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
        onEdit={handleOpen}
        onViewResult={handleOpen}
      />

      <Modal
        open={createOpen}
        title="Assign Homework"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create & add questions'}
            </Button>
          </>
        }
      >
        <div className="qa-instructor-homework__form">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Algebra Practice — Day 1"
          />
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should students focus on?"
          />
          <Input
            label="Duration (minutes)"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
          <p className="qa-instructor-homework__hint">
            After creating, you'll add at least 10 questions and pick the students
            on the next screen, then publish — it goes live immediately and is
            due by end of day.
          </p>
          {formError ? <p className="qa-instructor-homework__error">{formError}</p> : null}
        </div>
      </Modal>
    </div>
  );
}
