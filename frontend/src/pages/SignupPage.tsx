import { SignupForm } from '@/components/organisms/SignupForm';
import './SignupPage.scss';

/** Signup page — centers the SignupForm on a branded backdrop. */
export function SignupPage(): JSX.Element {
  return (
    <main className="qa-signup-page">
      <div className="qa-signup-page__card">
        <SignupForm />
      </div>
    </main>
  );
}
