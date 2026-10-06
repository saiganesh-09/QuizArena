import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { useLoginMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/hooks/redux';
import { setAuthError } from '@/store/slices/authSlice';
import { extractErrorMessage } from '@/utils/errors';
import { isValidEmail } from '@/utils/validation';
import type { LoginFormData, FieldErrors } from '@/interfaces/auth';
import './LoginForm.scss';

/**
 * LoginForm organism — composes Input/Button atoms, handles client-side
 * validation, calls the login RTK Query mutation, and redirects to the
 * dashboard on success. Inline errors are shown for empty fields, bad
 * credentials, and network failures.
 */
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@quiz.com' },
  { label: 'Teacher', email: 'teacher@quiz.com' },
  { label: 'Candidate', email: 'candidate@quiz.com' },
] as const;
const DEMO_PASSWORD = 'Password123!';

export function LoginForm(): JSX.Element {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [form, setForm] = useState<LoginFormData>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginFormData>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<K extends keyof LoginFormData>(key: K, value: string): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field-level error as the user edits.
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    if (submitError) setSubmitError(null);
  }

  function validate(): boolean {
    const errors: FieldErrors<LoginFormData> = {};
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(form.email)) {
      errors.email = 'Enter a valid email address';
    }
    if (!form.password) {
      errors.password = 'Password is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    try {
      await login(form).unwrap();
      // authSyncMiddleware mirrors the user into the slice on success.
      navigate('/dashboard');
    } catch (err) {
      const message = extractErrorMessage(err);
      setSubmitError(message);
      dispatch(setAuthError(message));
    }
  }

  function fillDemo(email: string): void {
    setForm({ email, password: DEMO_PASSWORD });
    setFieldErrors({});
    setSubmitError(null);
  }

  return (
    <form className="qa-login-form" onSubmit={handleSubmit} noValidate>
      <div className="qa-login-form__brand">
        <span className="qa-login-form__brand-mark">Q</span>
        <span className="qa-login-form__brand-name">QuizArena</span>
      </div>
      <h2 className="qa-login-form__title">Welcome back</h2>
      <p className="qa-login-form__subtitle">Sign in to your QuizArena account</p>

      {submitError ? (
        <div className="qa-login-form__alert" role="alert">
          {submitError}
        </div>
      ) : null}

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
        autoComplete="current-password"
        value={form.password}
        error={fieldErrors.password ?? undefined}
        onChange={(e) => updateField('password', e.target.value)}
      />

      <Button type="submit" fullWidth isLoading={isLoading}>
        Sign in
      </Button>

      <div className="qa-login-form__demo">
        <span className="qa-login-form__demo-title">Try a demo account</span>
        <div className="qa-login-form__demo-chips">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className="qa-login-form__demo-chip"
              onClick={() => fillDemo(acc.email)}
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>

      <p className="qa-login-form__footer">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          className="qa-login-form__link"
          onClick={() => navigate('/signup')}
        >
          Sign up
        </button>
      </p>
    </form>
  );
}
