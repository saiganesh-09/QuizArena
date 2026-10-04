import { LoginForm } from '@/components/organisms/LoginForm';
import { ThemeToggle } from '@/components/atoms/ThemeToggle';
import './LoginPage.scss';

/** Login page — centers the LoginForm on a branded backdrop. */
export function LoginPage(): JSX.Element {
  return (
    <main className="qa-login-page">
      <div className="qa-login-page__theme">
        <ThemeToggle />
      </div>
      <div className="qa-login-page__card">
        <LoginForm />
        <div className="qa-login-page__demo">
          <span className="qa-login-page__demo-title">Demo accounts</span>
          <span className="qa-login-page__demo-line">
            <strong>Teacher</strong> — teacher@quiz.com / Password123!
          </span>
          <span className="qa-login-page__demo-line">
            <strong>Candidate</strong> — candidate@quiz.com / Password123!
          </span>
        </div>
      </div>
    </main>
  );
}
