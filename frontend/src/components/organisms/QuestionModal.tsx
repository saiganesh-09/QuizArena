import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { useToast } from '@/components/organisms/ToastProvider';
import { extractErrorMessage } from '@/utils/errors';
import { randomId } from '@/utils/randomId';
import type { Question, QuestionType, QuestionOption } from '@/types/quiz';
import type { QuestionFormValues, QuestionFieldErrors } from '@/interfaces/instructor';
import './QuestionModal.scss';

export interface QuestionModalProps {
  open: boolean;
  quizId: string;
  /** The question being edited, or null for create mode. */
  question: Question | null;
  onClose: () => void;
  onCreate: (quizId: string, values: QuestionFormValues) => Promise<void>;
  onEdit: (quizId: string, questionId: string, values: Partial<QuestionFormValues>) => Promise<void>;
}

/** Default form for a new single-choice question with 2 options. */
function emptyForm(): QuestionFormValues {
  const o1: QuestionOption = { id: randomId(), text: '' };
  const o2: QuestionOption = { id: randomId(), text: '' };
  return {
    type: 'single-choice',
    text: '',
    options: [o1, o2],
    correctOptionIds: [],
    points: 1,
  };
}

/** Build a form from an existing question (edit mode). */
function formFromQuestion(q: Question): QuestionFormValues {
  return {
    type: q.type,
    text: q.text,
    options: q.options.map((o) => ({ ...o })),
    correctOptionIds: [...q.correctOptionIds],
    points: q.points,
  };
}

/**
 * QuestionModal organism — manual add/edit of a question.
 * Supports single-choice, multi-select, and true-false types.
 * For true-false, auto-generates True/False options.
 */
export function QuestionModal({
  open,
  quizId,
  question,
  onClose,
  onCreate,
  onEdit,
}: QuestionModalProps): JSX.Element {
  const { showToast } = useToast();
  const isEdit = question !== null;

  const [form, setForm] = useState<QuestionFormValues>(emptyForm());
  const [fieldErrors, setFieldErrors] = useState<QuestionFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Reset/populate form when the modal opens or the question changes.
  useEffect(() => {
    if (open) {
      setForm(question ? formFromQuestion(question) : emptyForm());
      setFieldErrors({});
      setSubmitError(null);
    }
  }, [open, question]);

  function updateType(type: QuestionType): void {
    if (type === 'true-false') {
      setForm((prev) => ({
        ...prev,
        type,
        options: [
          { id: 'true', text: 'True' },
          { id: 'false', text: 'False' },
        ],
        correctOptionIds: [],
      }));
    } else {
      setForm((prev) => ({ ...prev, type, correctOptionIds: [] }));
    }
  }

  function updateOptionText(idx: number, text: string): void {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === idx ? { ...o, text } : o)),
    }));
  }

  function addOption(): void {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { id: randomId(), text: '' }],
    }));
  }

  function removeOption(idx: number): void {
    setForm((prev) => {
      const removedId = prev.options[idx].id;
      return {
        ...prev,
        options: prev.options.filter((_, i) => i !== idx),
        correctOptionIds: prev.correctOptionIds.filter((id) => id !== removedId),
      };
    });
  }

  function toggleCorrect(optionId: string): void {
    setForm((prev) => {
      if (prev.type === 'single-choice' || prev.type === 'true-false') {
        return { ...prev, correctOptionIds: [optionId] };
      }
      // multi-select: toggle membership
      const exists = prev.correctOptionIds.includes(optionId);
      return {
        ...prev,
        correctOptionIds: exists
          ? prev.correctOptionIds.filter((id) => id !== optionId)
          : [...prev.correctOptionIds, optionId],
      };
    });
  }

  function validate(): boolean {
    const errors: QuestionFieldErrors = {};
    if (!form.text.trim()) errors.text = 'Question text is required';
    else if (form.text.trim().length < 3) errors.text = 'Question text must be at least 3 characters';

    if (form.options.length < 2) errors.options = 'At least 2 options are required';
    const emptyOptions = form.options.filter((o) => !o.text.trim());
    if (emptyOptions.length > 0) errors.options = 'All options must have text';

    if (form.correctOptionIds.length === 0) {
      errors.correctOptionIds = 'At least one correct option is required';
    }
    if ((form.type === 'single-choice' || form.type === 'true-false') && form.correctOptionIds.length > 1) {
      errors.correctOptionIds = 'This question type requires exactly one correct option';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSaving(true);
    try {
      if (isEdit && question) {
        await onEdit(quizId, question.id, form);
        showToast('success', 'Question updated');
      } else {
        await onCreate(quizId, form);
        showToast('success', 'Question added');
      }
      onClose();
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const isTrueFalse = form.type === 'true-false';

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Question' : 'Add Question'}
      onClose={onClose}
      disableBackdropClose={saving}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => void handleSubmit(new Event('submit') as unknown as FormEvent<HTMLFormElement>)}
            isLoading={saving}
          >
            {isEdit ? 'Save Changes' : 'Add Question'}
          </Button>
        </>
      }
    >
      <form className="qa-question-modal" onSubmit={handleSubmit} noValidate>
        {submitError ? (
          <div className="qa-question-modal__alert" role="alert">{submitError}</div>
        ) : null}

        <div className="qa-question-modal__field">
          <label className="qa-question-modal__label">Question type</label>
          <div className="qa-question-modal__type-row">
            {(['single-choice', 'multi-select', 'true-false'] as QuestionType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`qa-question-modal__type-btn${form.type === t ? ' qa-question-modal__type-btn--active' : ''}`}
                onClick={() => updateType(t)}
              >
                {t === 'single-choice' ? 'Single Choice' : t === 'multi-select' ? 'Multi Select' : 'True / False'}
              </button>
            ))}
          </div>
        </div>

        <Input
          type="text"
          name="text"
          label="Question text"
          placeholder="e.g. What is the capital of France?"
          value={form.text}
          error={fieldErrors.text ?? undefined}
          onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
        />

        <div className="qa-question-modal__field">
          <label className="qa-question-modal__label">Options</label>
          {fieldErrors.options ? (
            <p className="qa-question-modal__field-error">{fieldErrors.options}</p>
          ) : null}
          <div className="qa-question-modal__options">
            {form.options.map((opt, idx) => (
              <div key={opt.id} className="qa-question-modal__option">
                <button
                  type="button"
                  className={`qa-question-modal__correct${form.correctOptionIds.includes(opt.id) ? ' qa-question-modal__correct--on' : ''}`}
                  onClick={() => toggleCorrect(opt.id)}
                  title="Mark as correct"
                  aria-label="Mark as correct"
                >
                  {form.correctOptionIds.includes(opt.id) ? '✓' : '○'}
                </button>
                <input
                  type="text"
                  className="qa-question-modal__option-input"
                  placeholder={`Option ${idx + 1}`}
                  value={opt.text}
                  disabled={isTrueFalse}
                  onChange={(e) => updateOptionText(idx, e.target.value)}
                />
                {!isTrueFalse && form.options.length > 2 ? (
                  <button
                    type="button"
                    className="qa-question-modal__remove-option"
                    onClick={() => removeOption(idx)}
                    aria-label="Remove option"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {!isTrueFalse && form.options.length < 10 ? (
            <Button variant="ghost" onClick={addOption}>+ Add option</Button>
          ) : null}
          {fieldErrors.correctOptionIds ? (
            <p className="qa-question-modal__field-error">{fieldErrors.correctOptionIds}</p>
          ) : null}
        </div>

        <Input
          type="number"
          name="points"
          label="Points"
          min={1}
          max={100}
          value={form.points}
          error={fieldErrors.points ?? undefined}
          onChange={(e) => setForm((prev) => ({ ...prev, points: Number(e.target.value) }))}
        />
      </form>
    </Modal>
  );
}
