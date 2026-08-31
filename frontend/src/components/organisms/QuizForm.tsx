import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { useCreateQuizMutation, useEditQuizMutation } from '@/store/api/adminApi';
import { useToast } from '@/components/organisms/ToastProvider';
import { extractErrorMessage } from '@/utils/errors';
import { PASSWORD_RULES_TEXT } from '@/utils/validation';
import type { Quiz } from '@/types/quiz';
import type { QuizFormValues, QuizFieldErrors } from '@/interfaces/quiz';
import './QuizForm.scss';

export interface QuizFormProps {
  mode: 'create' | 'edit';
  /** For edit mode, the existing quiz to pre-populate. */
  quiz?: Quiz;
}

/** Initial values for the create form. */
const EMPTY_FORM: QuizFormValues = {
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  durationMinutes: 30,
};

/**
 * QuizForm organism — shared by the Create and Edit quiz screens.
 * Validates title, start/end datetimes (end strictly after start), and
 * duration. In edit mode, pre-populates with the quiz's current details.
 */
export function QuizForm({ mode, quiz }: QuizFormProps): JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [createQuiz, { isLoading: isCreating }] = useCreateQuizMutation();
  const [editQuiz, { isLoading: isEditing }] = useEditQuizMutation();

  const isLoading = isCreating || isEditing;

  const [form, setForm] = useState<QuizFormValues>(() => {
    if (mode === 'edit' && quiz) {
      return {
        title: quiz.title,
        description: quiz.description,
        startTime: toLocalInput(quiz.startTime),
        endTime: toLocalInput(quiz.endTime),
        durationMinutes: quiz.durationMinutes,
      };
    }
    return EMPTY_FORM;
  });

  const [fieldErrors, setFieldErrors] = useState<QuizFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<K extends keyof QuizFormValues>(key: K, value: QuizFormValues[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    if (submitError) setSubmitError(null);
  }

  function validate(): boolean {
    const errors: QuizFieldErrors = {};
    if (!form.title.trim()) {
      errors.title = 'Title is required';
    } else if (form.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }
    if (!form.startTime) errors.startTime = 'Start date and time are required';
    if (!form.endTime) errors.endTime = 'End date and time are required';
    if (form.startTime && form.endTime) {
      const start = new Date(form.startTime).getTime();
      const end = new Date(form.endTime).getTime();
      if (end <= start) {
        errors.endTime = 'End time must be strictly after start time';
      }
    }
    if (!form.durationMinutes || form.durationMinutes < 1) {
      errors.durationMinutes = 'Duration must be at least 1 minute';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    try {
      if (mode === 'create') {
        await createQuiz(form).unwrap();
        showToast('success', 'Quiz created successfully');
        navigate('/admin/quizzes');
      } else if (quiz) {
        await editQuiz({ id: quiz.id, values: form }).unwrap();
        showToast('success', 'Quiz updated successfully');
        navigate('/admin/quizzes');
      }
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    }
  }

  const isReadOnly = mode === 'edit' && quiz && quiz.status !== 'draft' && quiz.status !== 'scheduled';

  return (
    <form className="qa-quiz-form" onSubmit={handleSubmit} noValidate>
      <div className="qa-quiz-form__header">
        <h1 className="qa-quiz-form__title">
          {mode === 'create' ? 'Create Quiz' : 'Edit Quiz'}
        </h1>
        {isReadOnly ? (
          <p className="qa-quiz-form__readonly-notice">
            This quiz is in <strong>{quiz?.status}</strong> status and is read-only.
            Only Draft or Scheduled quizzes can be edited.
          </p>
        ) : null}
      </div>

      {submitError ? (
        <div className="qa-quiz-form__alert" role="alert">
          {submitError}
        </div>
      ) : null}

      <Input
        type="text"
        name="title"
        label="Quiz title"
        placeholder="e.g. JavaScript Fundamentals"
        value={form.title}
        error={fieldErrors.title ?? undefined}
        disabled={!!isReadOnly}
        onChange={(e) => updateField('title', e.target.value)}
      />

      <div className="qa-quiz-form__field">
        <label className="qa-quiz-form__label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="qa-quiz-form__textarea"
          placeholder="Optional description of the quiz"
          rows={3}
          value={form.description}
          disabled={!!isReadOnly}
          onChange={(e) => updateField('description', e.target.value)}
        />
      </div>

      <div className="qa-quiz-form__row">
        <Input
          type="datetime-local"
          name="startTime"
          label="Start date & time"
          value={form.startTime}
          error={fieldErrors.startTime ?? undefined}
          disabled={!!isReadOnly}
          onChange={(e) => updateField('startTime', e.target.value)}
        />
        <Input
          type="datetime-local"
          name="endTime"
          label="End date & time"
          value={form.endTime}
          error={fieldErrors.endTime ?? undefined}
          disabled={!!isReadOnly}
          onChange={(e) => updateField('endTime', e.target.value)}
        />
      </div>

      <Input
        type="number"
        name="durationMinutes"
        label="Duration (minutes)"
        min={1}
        max={10080}
        value={form.durationMinutes}
        error={fieldErrors.durationMinutes ?? undefined}
        disabled={!!isReadOnly}
        onChange={(e) => updateField('durationMinutes', Number(e.target.value))}
      />

      <p className="qa-quiz-form__hint">{PASSWORD_RULES_TEXT.replace('Password', 'Duration')}: 1 to 10080 minutes.</p>

      <div className="qa-quiz-form__actions">
        <Button variant="ghost" onClick={() => navigate('/admin/quizzes')} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={!!isReadOnly}>
          {mode === 'create' ? 'Create Quiz' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

/** Convert an ISO string to a datetime-local input value (local time). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
