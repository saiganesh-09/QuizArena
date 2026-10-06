import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/components/organisms/ToastProvider';
import { ProtectedRoute } from '@/components/organisms/ProtectedRoute';
import { AdminLayout } from '@/components/organisms/AdminLayout';
import { InstructorLayout } from '@/components/organisms/InstructorLayout';
import { CandidateLayout } from '@/components/organisms/CandidateLayout';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { QuizzesListPage } from '@/pages/QuizzesListPage';
import { CreateQuizPage } from '@/pages/CreateQuizPage';
import { EditQuizPage } from '@/pages/EditQuizPage';
import { UsersListPage } from '@/pages/UsersListPage';
import { InstructorDashboardPage } from '@/pages/InstructorDashboardPage';
import { MyQuizzesPage } from '@/pages/MyQuizzesPage';
import { UpdateQuizPage } from '@/pages/UpdateQuizPage';
import { CandidateDashboardPage } from '@/pages/CandidateDashboardPage';
import { MyCandidateQuizzesPage } from '@/pages/MyCandidateQuizzesPage';
import { QuizAttemptPage } from '@/pages/QuizAttemptPage';
import { CandidateResultPage } from '@/pages/CandidateResultPage';
import { CandidateHomeworkPage } from '@/pages/CandidateHomeworkPage';
import { CandidateResultsPage } from '@/pages/CandidateResultsPage';
import { CandidateLeaderboardPage } from '@/pages/CandidateLeaderboardPage';
import { InstructorHomeworkPage } from '@/pages/InstructorHomeworkPage';
import { InstructorResultsPage } from '@/pages/InstructorResultsPage';
import { InstructorStudentsPage } from '@/pages/InstructorStudentsPage';
import { InstructorResultsHubPage } from '@/pages/InstructorResultsHubPage';
import { InstructorAnalyticsPage } from '@/pages/InstructorAnalyticsPage';
import { AdminAnalyticsPage } from '@/pages/AdminAnalyticsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useAuthBoot } from '@/hooks/useAuthBoot';
import { useAppSelector } from '@/hooks/redux';
import './App.scss';

/**
 * App — top-level router.
 *
 * On mount, useAuthBoot triggers the getMe query to hydrate the auth
 * slice from the existing HTTP-only cookie. Public auth routes redirect
 * to /dashboard if the user is already authenticated.
 *
 * Admin routes are nested under <AdminLayout /> and guarded by
 * <ProtectedRoute allowedRoles={['admin']} />, which returns 403-style
 * behavior (redirect) for authenticated non-admins.
 */
export function App(): JSX.Element {
  const { bootstrapped } = useAuthBoot();
  const { user } = useAppSelector((state) => state.auth);

  // Avoid rendering routes until the initial auth check settles, to
  // prevent redirect flicker on hard refresh.
  useEffect(() => {
    // no-op; bootstrapped is consumed in render below.
  }, [bootstrapped]);

  if (!bootstrapped) {
    return <div className="qa-app__boot" aria-busy="true" />;
  }

  // Helper to redirect authenticated users away from auth screens.
  const authRedirect = (element: JSX.Element): JSX.Element =>
    user ? <Navigate to="/dashboard" replace /> : element;

  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={authRedirect(<LoginPage />)} />
        <Route path="/signup" element={authRedirect(<SignupPage />)} />

        {/* Participant dashboard (any authenticated user) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin section — locked behind admin role */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="quizzes" element={<QuizzesListPage />} />
          <Route path="quizzes/new" element={<CreateQuizPage />} />
          <Route path="quizzes/:id/edit" element={<EditQuizPage />} />
          <Route path="users" element={<UsersListPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>

        {/* Instructor section — locked behind instructor role */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute allowedRoles={['instructor']}>
              <InstructorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/instructor/dashboard" replace />} />
          <Route path="dashboard" element={<InstructorDashboardPage />} />
          <Route path="quizzes" element={<MyQuizzesPage />} />
          <Route path="homework" element={<InstructorHomeworkPage />} />
          <Route path="students" element={<InstructorStudentsPage />} />
          <Route path="results" element={<InstructorResultsHubPage />} />
          <Route path="quizzes/:id" element={<UpdateQuizPage />} />
          <Route path="quizzes/:id/results" element={<InstructorResultsPage />} />
          <Route path="analytics" element={<InstructorAnalyticsPage />} />
        </Route>

        {/* Candidate section — locked behind candidate role */}
        <Route
          path="/candidate"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <CandidateLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/candidate/dashboard" replace />} />
          <Route path="dashboard" element={<CandidateDashboardPage />} />
          <Route path="quizzes" element={<MyCandidateQuizzesPage />} />
          <Route path="homework" element={<CandidateHomeworkPage />} />
          <Route path="results" element={<CandidateResultsPage />} />
          <Route path="leaderboard" element={<CandidateLeaderboardPage />} />
          <Route path="quizzes/:id/start" element={<QuizAttemptPage />} />
          <Route path="quizzes/:id/result" element={<CandidateResultPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  );
}
