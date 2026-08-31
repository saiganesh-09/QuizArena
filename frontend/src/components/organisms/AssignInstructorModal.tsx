import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/atoms/Modal';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { useAssignInstructorMutation } from '@/store/api/adminApi';
import { useToast } from '@/components/organisms/ToastProvider';
import { extractErrorMessage } from '@/utils/errors';
import { isValidEmail } from '@/utils/validation';
import type { Quiz } from '@/types/quiz';
import type { AssignInstructorFormValues } from '@/interfaces/quiz';
import './AssignInstructorModal.scss';

export interface AssignInstructorModalProps {
  quiz: Quiz | null;
  open: boolean;
  onClose: () => void;
}

/**
 * AssignInstructorModal organism — lets an admin assign an instructor
 * to a quiz by email. Validates the email client-side and surfaces
 * backend errors (user not found, not an instructor, already assigned).
 */
export function AssignInstructorModal({
  quiz,
  open,
  onClose,
}: AssignInstructorModalProps): JSX.Element {
  const { showToast } = useToast();
  const [assignInstructor, { isLoading }] = useAssignInstructorMutation();

  const [form, setForm] = useState<AssignInstructorFormValues>({ email: '' });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function reset(): void {
    setForm({ email: '' });
    setEmailError(null);
    setSubmitError(null);
  }

  function handleClose(): void {
    reset();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);

    if (!isValidEmail(form.email)) {
      setEmailError('Enter a valid instructor email');
      return;
    }
    setEmailError(null);

    if (!quiz) return;

    try {
      await assignInstructor({ id: quiz.id, values: form }).unwrap();
      showToast('success', 'Instructor assigned successfully');
      handleClose();
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      title="Assign Instructor"
      onClose={handleClose}
      disableBackdropClose={isLoading}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSubmit(new Event('submit') as unknown as FormEvent<HTMLFormElement>)}
            isLoading={isLoading}
          >
            Assign
          </Button>
        </>
      }
    >
      <form className="qa-assign-modal" onSubmit={handleSubmit} noValidate>
        {quiz ? (
          <p className="qa-assign-modal__context">
            Assigning an instructor to <strong>{quiz.title}</strong>
          </p>
        ) : null}

        {submitError ? (
          <div className="qa-assign-modal__alert" role="alert">
            {submitError}
          </div>
        ) : null}

        <Input
          type="email"
          name="email"
          label="Instructor email"
          placeholder="instructor@example.com"
          autoComplete="off"
          value={form.email}
          error={emailError ?? undefined}
          onChange={(e) => {
            setForm({ email: e.target.value });
            if (emailError) setEmailError(null);
            if (submitError) setSubmitError(null);
          }}
        />

        {quiz && quiz.instructors.length > 0 ? (
          <div className="qa-assign-modal__current">
            <p className="qa-assign-modal__current-label">Currently assigned:</p>
            <ul className="qa-assign-modal__list">
              {quiz.instructors.map((inst) => (
                <li key={inst.instructorId} className="qa-assign-modal__list-item">
                  {inst.instructorEmail}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
