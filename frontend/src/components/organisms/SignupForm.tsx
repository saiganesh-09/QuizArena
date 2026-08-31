import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { useSignupMutation } from '@/store/api/authApi';
import { useToast } from '@/components/organisms/ToastProvider';
import { extractErrorMessage } from '@/utils/errors';
import {
  isValidEmail,
  isStrongPassword,
  PASSWORD_RULES_TEXT,
} from '@/utils/validation';
import type { SignupFormData, FieldErrors } from '@/interfaces/auth';
import './SignupForm.scss';

/**
 * SignupForm organism — validates required fields, valid email, strong
 * password, and matching confirm password. Handles duplicate-email
 * (409) and validation (400) errors from the backend. On success, shows
 * a "Signup successful" toast and redirects to the login screen.
 */
export function SignupForm(): JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [signup, { isLoading }] = useSignupMutation();

  const [form, setForm] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<SignupFormData>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<K extends keyof SignupFormData>(key: K, value: string): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    if (submitError) setSubmitError(null);
  }

  function validate(): boolean {
    const errors: FieldErrors<SignupFormData> = {};
    if (!form.name.trim()) {
      errors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(form.email)) {
      errors.email = 'Enter a valid email address';
    }
    if (!form.password) {
      errors.password = 'Password is required';
    } else if (!isStrongPassword(form.password)) {
      errors.password = PASSWORD_RULES_TEXT;
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (form.confirmPassword !== form.password) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    try {
      // Backend only needs name/email/password; confirmPassword is UI-only.
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      }).unwrap();

      showToast('success', 'Signup successful');
      navigate('/login');
    } catch (err) {
      const message = extractErrorMessage(err);
      setSubmitError(message);
    }
  }

  return (
    <form className="qa-signup-form" onSubmit={handleSubmit} noValidate>
      <h2 className="qa-signup-form__title">Create your account</h2>
      <p className="qa-signup-form__subtitle">Join QuizArena as a participant</p>

      {submitError ? (
        <div className="qa-signup-form__alert" role="alert">
          {submitError}
        </div>
      ) : null}

      <Input
        type="text"
        name="name"
        label="Full name"
        placeholder="Jane Doe"
        autoComplete="name"
        value={form.name}
        error={fieldErrors.name ?? undefined}
        onChange={(e) => updateField('name', e.target.value)}
      />

      <Input
        type="email"
        name="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        value={form.email}
        error={fieldErrors.email ?? undefined}
        onChange={(e) => updateField('email', e.target.value)}
      />

      <Input
        type="password"
        name="password"
        label="Password"
        placeholder="••••••••"
        autoComplete="new-password"
        value={form.password}
        error={fieldErrors.password ?? undefined}
        hint={fieldErrors.password ? undefined : PASSWORD_RULES_TEXT}
        onChange={(e) => updateField('password', e.target.value)}
      />

      <Input
        type="password"
        name="confirmPassword"
        label="Confirm password"
        placeholder="••••••••"
        autoComplete="new-password"
        value={form.confirmPassword}
        error={fieldErrors.confirmPassword ?? undefined}
        onChange={(e) => updateField('confirmPassword', e.target.value)}
      />

      <Button type="submit" fullWidth isLoading={isLoading}>
        Create account
      </Button>

      <p className="qa-signup-form__footer">
        Already have an account?{' '}
        <button
          type="button"
          className="qa-signup-form__link"
          onClick={() => navigate('/login')}
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
