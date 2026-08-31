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
      </div>
    </main>
  );
}
