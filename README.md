# QuizArena

**Live:** https://quizarena-hazel.vercel.app — backend API: https://quizarena-api-olive.vercel.app (docs at `/api-docs`, health at `/health/health`)

Demo accounts (password `Password123!`): `admin@quiz.com` · `teacher@quiz.com` (instructor) · `candidate@quiz.com`

Multi-role quiz platform with three personas: **Admin**, **Instructor**, and **Participant/Candidate**.

Built across 7 milestones covering authentication, admin/instructor/candidate flows, a secure examination engine, results & analytics, dark mode, comprehensive testing, and full API documentation.

## Project layout

```
QuizArena/
├── backend/    # Node.js 18 + Express + TypeScript + MongoDB (Mongoose)
│   ├── src/
│   │   ├── config/       # Database, env, multer config
│   │   ├── controllers/  # Route handlers (thin — delegate to services)
│   │   ├── docs/         # OpenAPI/Swagger spec
│   │   ├── middlewares/  # requireAuth, requireRole, requireQuizOwnership, validate, error
│   │   ├── models/       # Mongoose models (User, Quiz, Attempt)
│   │   ├── routes/       # Express routers (auth, admin, instructor, candidate, docs, health)
│   │   ├── services/     # Business logic (auth, quiz, attempt, results, analytics)
│   │   ├── types/        # Shared TypeScript types
│   │   └── utils/        # JWT, AppError, response wrappers
│   ├── tests/            # Jest + Supertest + mongodb-memory-server
│   └── jest.config.ts
├── frontend/   # React 18 + TypeScript + Vite + Redux Toolkit (RTK Query)
│   ├── src/
│   │   ├── atoms/        # Buttons, badges, stat cards, charts, theme toggle
│   │   ├── molecules/    # Search bars, modals, form fields
│   │   ├── organisms/    # Layouts, sidebars, tables, dashboards, forms
│   │   ├── pages/        # Route-level page components
│   │   ├── store/        # Redux store + RTK Query API slices
│   │   ├── hooks/        # useTheme, useMobileSidebar, useAuthBoot, redux hooks
│   │   ├── utils/        # Validation, date formatting, error extraction
│   │   ├── interfaces/   # UI-facing TypeScript interfaces
│   │   └── types/        # Domain types
│   └── jest.config.ts
└── README.md
```

## Tech stack

### Backend
- Node.js 18+, Express, TypeScript (strict, no `any`)
- MongoDB with Mongoose
- JWT stored **only** in an HTTP-only, Secure, SameSite cookie (via `cookie-parser`)
- Zod for input validation
- bcrypt (cost factor 12) for password hashing
- Centralized error-handling middleware
- Swagger UI Express for interactive API docs at `/api-docs`
- Jest + Supertest + mongodb-memory-server for hermetic testing

### Frontend
- React 18 + TypeScript (strict, no `any`)
- Redux Toolkit + RTK Query for all API integration
- SCSS only (no Tailwind/Bootstrap/external CSS frameworks)
- Atomic Design folder structure (`atoms` / `molecules` / `organisms`)
- React Router v6 with protected routes
- Dark/light theme via CSS custom properties + localStorage persistence
- Jest + React Testing Library for unit/component testing

## Architecture

### Request flow
```
Client (browser)
  │  HTTP-only cookie (qa_token)
  ▼
Express app (helmet → cors → json → cookieParser → rateLimit on /auth)
  │
  ├── /auth/*        → requireAuth → authController
  ├── /admin/*       → requireAuth → requireRole('admin') → adminController
  ├── /instructor/*  → requireAuth → requireRole('instructor') → requireQuizOwnership → instructorController
  ├── /candidate/*   → requireAuth → requireRole('candidate') → candidateController
  ├── /api-docs      → Swagger UI
  └── /health        → health check
  │
  ▼
Controller (thin — validates input, calls service, shapes response)
  │
  ▼
Service (business logic — scoring, state machines, aggregation)
  │
  ▼
Mongoose Model (User, Quiz, Attempt) → MongoDB
  │
  ▼
Response: { success: true, data: {...} } or { success: false, error: { code, message } }
```

### Module boundaries
- **Controllers** are thin: they parse the request, call a service, and shape the response. No business logic.
- **Services** contain all business logic: scoring, state transitions, aggregation, authorization checks.
- **Models** define the Mongoose schema and document-level methods (e.g., `isOwnedBy`, `computeReadiness`, `comparePassword`).
- **Middlewares** handle cross-cutting concerns: auth, role guards, ownership, validation, error handling.
- **Routes** wire controllers to URL patterns with the appropriate middleware chain.

### Database models
- **User**: `{ name, email, password (hashed), role, status, createdAt }`. Unique index on `email`. Password is stripped via `toJSON` transform.
- **Quiz**: `{ title, description, status, startTime, endTime, durationMinutes, createdBy, instructors[], questions[], participants[], cancelledAt }`. Status state machine: `draft → scheduled → live → completed` (or `cancelled`).
- **Attempt**: `{ quizId, candidateId, status, startedAt, submittedAt, deadlineAt, answers[], score, maxScore, autoSubmitted }`. Unique index on `{ candidateId, quizId }` enforces one attempt per candidate.

## Design choices

### Why HTTP-only cookies for JWT?
The JWT is stored exclusively in an HTTP-only, Secure, SameSite cookie — never in `localStorage` or returned in a response body. This prevents XSS attacks from stealing the token (JavaScript cannot read an HTTP-only cookie). The `SameSite` attribute provides CSRF protection, and `Secure` ensures the cookie is only sent over HTTPS in production.

### Why score-on-submission?
The score is calculated **once** at submission time and persisted on the attempt document. All subsequent reads (results, analytics, dashboards) use the stored value. This ensures:
- **Determinism**: aggregated analytics never re-grade or produce different numbers.
- **Performance**: no re-computation on every results page load.
- **Auditability**: the score is frozen at the moment of submission.

### Why soft-delete (cancel) instead of hard-delete?
Quizzes can be hard-deleted only in `draft` status. Once published, a quiz is "cancelled" (soft-delete) — the status changes to `cancelled` and the document is preserved. This maintains referential integrity with attempt records and provides an audit trail.

### Why one attempt per candidate?
A unique index on `{ candidateId, quizId }` in the Attempt model enforces this at the database level. This prevents cheating (multiple attempts to game the score) and ensures fair, deterministic results.

### Why CSS custom properties for theming?
Dark mode is implemented via CSS custom properties (variables) on the `:root` and `[data-theme="dark"]` selectors. Switching themes is a single attribute change on `<html>` — no re-render, no flash, no JavaScript layout computation. The choice persists to `localStorage` and falls back to the OS preference on first visit.

## Getting started

### Prerequisites
- **Node.js** >= 18
- **MongoDB** >= 6.0 (local instance or MongoDB Atlas URI)
- **npm** >= 9

### 1. Backend
```bash
cd backend
cp .env.example .env      # then edit values (JWT_SECRET, MONGO_URI, etc.)
npm install
npm run dev               # ts-node-dev, hot reload on http://localhost:5000
```

Scripts:
| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload (port 5000) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled `dist/server.js` |
| `npm run typecheck` | Type-only check (no emit) |
| `npm test` | Run Jest test suite (hermetic, mongodb-memory-server) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode |

### 2. Frontend
```bash
cd frontend
cp .env.example .env      # VITE_API_BASE_URL defaults to /api (proxied in dev)
npm install
npm run dev               # Vite dev server on http://localhost:5173
```

Scripts:
| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (proxies `/api` → `http://localhost:5000`) |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Type-only check |
| `npm test` | Run Jest test suite |
| `npm run test:coverage` | Run tests with coverage report |

### 3. API Documentation
Once the backend is running, visit:
```
http://localhost:5000/api-docs
```
The interactive Swagger UI documents every endpoint with request bodies, success schemas, and error responses (400, 401, 403, 404, 409).

### Environment variables
See `backend/.env.example` for all configuration options:
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/quizarena` |
| `JWT_SECRET` | JWT signing secret (use `openssl rand -base64 64`) | — |
| `JWT_EXPIRES_IN` | Token expiration | `1d` |
| `JWT_COOKIE_NAME` | Cookie name for the JWT | `qa_token` |
| `COOKIE_SECURE` | Set to `true` in production (requires HTTPS) | `false` |
| `COOKIE_SAMESITE` | SameSite attribute | `lax` |
| `COOKIE_DOMAIN` | Optional domain restriction | — |
| `CLIENT_ORIGIN` | Frontend origin for CORS | `http://localhost:5173` |

## Testing

### Backend tests
The backend test suite uses **Jest + Supertest + mongodb-memory-server** for fully hermetic, offline testing:
- An in-memory MongoDB instance is spun up for each test run — no dependency on a live database.
- Each test clears the database between tests for isolation.
- The scoring engine, attempt lifecycle, auth middleware, role guards, and model validation are all covered.
- Time-dependent logic (auto-submission past deadline) is tested by manipulating the attempt's `deadlineAt` field directly.

```bash
cd backend
npm test                  # run all tests
npm run test:coverage     # run with coverage report
```

### Frontend tests
The frontend test suite uses **Jest + React Testing Library**:
- Pure utility functions (validation, date formatting, error extraction, duration formatting).
- Redux reducer state transitions (authSlice).
- Component tests (ThemeToggle toggle behavior + localStorage persistence).

```bash
cd frontend
npm test                  # run all tests
npm run test:coverage     # run with coverage report
```

## Getting started

### Prerequisites
- Node.js >= 18
- A running MongoDB instance (local or Atlas)

### 1. Backend
```bash
cd backend
cp .env.example .env      # then edit values (JWT_SECRET, MONGO_URI, etc.)
npm install
npm run dev               # ts-node-dev, hot reload on http://localhost:5000
```
Scripts:
- `npm run dev` — dev server with reload
- `npm run build` — compile to `dist/`
- `npm start` — run compiled `dist/server.js`
- `npm run typecheck` — type-only check

### 2. Frontend
```bash
cd frontend
cp .env.example .env      # VITE_API_BASE_URL defaults to /api (proxied in dev)
npm install
npm run dev               # Vite dev server on http://localhost:5173
```
Scripts:
- `npm run dev` — Vite dev server (proxies `/api` -> `http://localhost:5000`)
- `npm run build` — type-check + production build to `dist/`
- `npm run preview` — preview the production build
- `npm run typecheck` — type-only check

## Milestone 1 deliverables

### Backend
| Method | Route          | Description |
|--------|----------------|-------------|
| POST   | `/auth/signup` | Register a candidate (role defaults to `candidate`); 409 on duplicate email, 400 on bad input |
| POST   | `/auth/login`  | Validate credentials, issue JWT in HTTP-only cookie; 401 on bad creds (no email leak) |
| POST   | `/auth/logout` | Idempotent cookie clear |
| GET    | `/auth/me`     | Return current user profile from JWT; 401 if missing/invalid |
| GET    | `/health`      | Uptime + Mongo status |

- `requireAuth` middleware parses the cookie, verifies the JWT, and attaches `req.user`.
- `requireRole(...roles)` guard for role-protected routes (returns **403 Forbidden** for authenticated non-admins).
- Password hash is stripped at the Mongoose serialization layer (`toJSON` transform + `toProfile()`).

### Frontend
- **Login screen**: responsive form, inline errors for wrong creds / empty fields / network failures, RTK Query integration.
- **Sign up screen**: validation (required, valid email, strong password, confirm match), duplicate-email + validation handling, success toast "Signup successful", redirect to login.
- **Post-login flow**: redirect to `/dashboard`, Navbar with live clock (seconds accuracy), logout clears Redux state + calls backend logout.

## Milestone 2 deliverables — Admin Flow

### Backend
| Method | Route                                  | Description |
|--------|----------------------------------------|-------------|
| GET    | `/admin/users`                         | List/filter/sort/search users with pagination + user-count stats (no password hashes) |
| GET    | `/admin/quizzes`                       | List/filter/sort/search quizzes with pagination + status stats |
| GET    | `/admin/quizzes/:id`                   | Fetch a single quiz |
| POST   | `/admin/quizzes`                       | Create a quiz (initial status `Draft`); 400 with field-level errors on bad input |
| PATCH  | `/admin/quizzes/:id`                   | Edit a quiz (Draft/Scheduled only); 409 on Live/Completed/Cancelled |
| DELETE | `/admin/quizzes/:id`                   | Delete a quiz (Draft only); 409 otherwise |
| POST   | `/admin/quizzes/:id/cancel`            | Cancel a quiz (reachable from Draft/Scheduled/Live; not Completed); 409 on Completed |
| POST   | `/admin/quizzes/:id/assign-instructor` | Assign an instructor by email; 4xx if not found or not an instructor |

- Every `/admin/*` route is locked behind `requireAuth` **then** `requireRole('admin')` (403 for authenticated non-admins).
- Quiz lifecycle state machine: `Draft → Scheduled → Live → Completed`; `Cancelled` is terminal/read-only.
- All datetimes are ISO-8601 strings, stored in UTC.
- `endTime` must be strictly after `startTime` (enforced at model + Zod layer).

### Frontend
- **Admin Dashboard** (`/admin/dashboard`): sidebar, header, stat cards, donut chart of quiz statuses with legend, quizzes table with search/pagination/status color-coding/row actions.
- **Quizzes List** (`/admin/quizzes`): full management table with search, pagination, Edit/Cancel/Assign-Instructor actions, and empty states for "no quizzes" and "no search results".
- **Create Quiz** (`/admin/quizzes/new`): form with datetime pickers and validation (title, start/end, duration).
- **Edit Quiz** (`/admin/quizzes/:id/edit`): pre-populated form; read-only notice for non-editable statuses.
- **Users List** (`/admin/users`): searchable user table with role/status badges and user-count stats.
- **Assign Instructor modal**: email validation + backend error surfacing (not found, not instructor, already assigned).
- **Cancel confirmation dialog**: pop-up before flipping a quiz to Cancelled.
- Admin routes guarded by `ProtectedRoute allowedRoles={['admin']}`.

## Milestone 3 deliverables — Instructor Flow

### Backend
| Method | Route                                          | Description |
|--------|------------------------------------------------|-------------|
| GET    | `/instructor/quizzes`                          | List quizzes assigned to the calling instructor (filter/sort/search/pagination + readiness signals + stats) |
| GET    | `/instructor/quizzes/:id`                      | Fetch a single owned quiz (403 if not assigned) |
| PATCH  | `/instructor/quizzes/:id`                      | Edit a quiz (Draft/Scheduled only); 409 otherwise |
| DELETE | `/instructor/quizzes/:id`                      | Delete a quiz (Draft only); 409 otherwise |
| POST   | `/instructor/quizzes/:id/cancel`               | Cancel a quiz (not Completed); 409 on Completed |
| POST   | `/instructor/quizzes/:id/publish`              | Publish: Draft → Scheduled (409 with missing-readiness list if not ready) |
| GET    | `/instructor/quizzes/:id/questions`            | List questions |
| POST   | `/instructor/quizzes/:id/questions`            | Add a question manually (single-choice / multi-select / true-false) |
| PATCH  | `/instructor/quizzes/:id/questions/:questionId`| Edit a question (Draft only); 409 otherwise |
| DELETE | `/instructor/quizzes/:id/questions/:questionId`| Delete a question |
| POST   | `/instructor/quizzes/:id/questions/bulk-csv`   | Atomic CSV bulk upload of questions (all-or-nothing; 422 with row-level errors on failure) |
| GET    | `/instructor/quizzes/:id/participants`         | List participants |
| POST   | `/instructor/quizzes/:id/participants`         | Add a participant by email (must be a registered candidate; idempotent for duplicates) |
| DELETE | `/instructor/quizzes/:id/participants/:participantId` | Remove a participant (before Live only); 409 on Live/Completed |
| POST   | `/instructor/quizzes/:id/participants/bulk-csv`| Atomic CSV bulk upload of participants (all-or-nothing; 422 with row-level errors) |

- Every `/instructor/*` route is locked behind `requireAuth` **then** `requireRole('instructor')`.
- **Ownership guard**: `requireQuizOwnership` middleware loads the quiz by `:id`, verifies the calling instructor is in `instructors[]`, and returns **403 Forbidden** (not 404) on cross-tenant access to block leakage. The loaded quiz is attached to `req.loadedQuiz` for downstream handlers.
- **Publish readiness**: a quiz can transition Draft → Scheduled only if it has ≥ 1 question, ≥ 1 participant, and a valid upcoming schedule window (startTime in the future, endTime after startTime). Otherwise 409 with a detailed `missing[]` list.
- **CSV uploads are atomic** (Multer + csv-parser): every row is validated before any insertion. If any row fails, the entire upload is rejected with row-level error messages and nothing is persisted.
- **Participant validation**: emails must belong to registered users with the `candidate` role; `addedAt` is recorded; duplicate emails are skipped idempotently.
- Question edit is allowed only in Draft; question delete in Draft/Scheduled; participant removal only before Live.

### Frontend
- **Instructor Dashboard** (`/instructor/dashboard`): stat cards, donut chart of quiz statuses, "My Quizzes" table with search/pagination/status color-coding/actions.
- **My Quizzes** (`/instructor/quizzes`): full-page table with debounced search, pagination, and row actions (Edit for Draft/Scheduled, View Result for Completed, `—` for Cancelled).
- **Update Quiz** (`/instructor/quizzes/:id`): tabbed workspace with:
  - Breadcrumbs + "Back to Quiz List".
  - Schedule banner (color-coded by status, dynamic notes).
  - Draft Readiness indicators (missing requirements listed).
  - Questions Tab: manual add modal (single-choice/multi-select/true-false with correct-option marking), CSV import modal with pre-import validation and row-level error display, question list with Edit/Delete.
  - Participants Tab: manual email add, CSV import, participant list with confirmation-backed Remove.
  - Cancel Quiz + Publish buttons (Publish disabled until ready).
- **Empty states** for: no quizzes, no search results, no questions, no participants.
- Instructor routes guarded by `ProtectedRoute allowedRoles={['instructor']}`.

## Milestone 4 deliverables — Candidate Dashboard & Upcoming Quiz Flow

### Backend
| Method | Route                       | Description |
|--------|-----------------------------|-------------|
| GET    | `/candidate/quizzes`        | List quizzes assigned to the calling candidate (filter/sort/search/pagination + per-status counts). Assignment filter applied BEFORE pagination/counts. |
| GET    | `/candidate/quizzes/:id`    | Metadata-only quiz details (no questions/options/answer keys). Enforces assignment (403 on direct-URL probing). Live-window guard blocks access outside the scheduled window. |

- Every `/candidate/*` route is locked behind `requireAuth` **then** `requireRole('candidate')`.
- **Assigned-only visibility**: the `participants.userId` filter is applied first in every query, so pagination, filtering, and total counts never leak unassigned quizzes.
- **Direct-URL probing protection**: `GET /candidate/quizzes/:id` returns **403 Forbidden** if the candidate is not assigned (not 404), blocking cross-tenant leakage. 404 is returned only for genuinely non-existent quizzes.
- **Metadata-only responses**: the `CandidateQuizMeta` type intentionally omits `questions`, `options`, `correctOptionIds`, and `participants`. Only title, description, status, timing, duration, and question count are exposed.
- **Live-window guard**: for non-completed/non-cancelled quizzes, detail access is blocked before the scheduled start time (403) and after the window closes (403). Draft quizzes are never visible to candidates (403).

### Frontend
- **Candidate Dashboard** (`/candidate/dashboard`): summary stat cards (total, upcoming, live, completed), upcoming quiz cards with real-time countdown timers, and an assigned-quizzes table with debounced search, pagination, and status color-coding.
- **Upcoming Quiz Cards**: display key metadata with correct color coding, a real-time countdown timer to the scheduled start time, and a "Start Test" button that stays disabled until the live window opens (the countdown's `onZero` callback flips the button to enabled).
- **Assigned Quizzes Table**: action column shows "Start Test" for Live quizzes, "View Result" for Completed, date/time for Upcoming (Scheduled), and `—` for Cancelled.
- **Empty states** for: no assigned quizzes, no search results, no upcoming quizzes.
- Candidate routes guarded by `ProtectedRoute allowedRoles={['candidate']}`.
- Post-login redirect: the generic `/dashboard` route now redirects users to their role-specific dashboard (`/admin/dashboard`, `/instructor/dashboard`, or `/candidate/dashboard`).

## Milestone 5 deliverables — Quiz Attempt Flow / Examination Engine

### Backend
| Method | Route                                  | Description |
|--------|----------------------------------------|-------------|
| POST   | `/candidate/quizzes/:id/start`         | Start (or resume) an attempt. Verifies: quiz is Live, candidate is assigned, no existing submitted attempt. Returns questions + options with correctOptionIds STRIPPED. 409 if already submitted. |
| POST   | `/candidate/quizzes/:id/submit`        | Submit the attempt. Scores once at submission time, persists score. Time guard: auto-submits if past deadline. Idempotent: re-submit returns existing scored attempt. |
| GET    | `/candidate/quizzes/:id/attempt`       | Get the current attempt state (in-progress with questions, or submitted with scored answers). |

- **One attempt per candidate**: unique index on `{ candidateId, quizId }` in the Attempt model enforces this at the database level. Concurrent "start" calls use `findOneAndUpdate` with `upsert` + the unique index as a safety net.
- **Correct answers never leak**: the `AttemptQuestion` type has no `correctOptionIds` or `isCorrect` field. The `toAttemptQuestionForPayload` function is the ONLY place questions are serialized for the candidate, and it deliberately omits correct answer data.
- **Score calculated once at submission**: `score` and `maxScore` are persisted on the attempt document. All future reads use these stored values — never re-derived.
- **Scoring logic**: single-choice/true-false → full marks if the single selected option matches; multi-select → full marks ONLY on exact set match (no partial); unanswered → zero.
- **Time guard**: if submitted after `startedAt + durationMinutes`, the submission is capped at the deadline, marked as `auto-submitted`, and scored with the answers received.
- **Concurrent submit safety**: `findOneAndUpdate` with a `status: 'in-progress'` guard ensures only the first submit scores; subsequent calls return the already-scored attempt.
- **Idempotent submit**: re-calling submit on an already-submitted quiz returns the existing attempt payload without double-scoring.

### Frontend
- **Quiz Attempt Page** (`/candidate/quizzes/:id/start`): the full test-taking experience.
  - **Pre-test instruction modal**: shows quiz metadata, rules, and a "Start Test" button.
  - **Main test screen**: split view with question panel (left) and navigator sidebar (right).
  - **Question panel**: displays current question text, option selectors (radio for single-choice/true-false, checkbox for multi-select), and Previous/Next navigation.
  - **Question navigator**: sidebar with color-coded status dots (gray=Not Visited, blue=Visited, green=Answered), legend, and submit button.
  - **Free navigation**: answers persist when traversing back and forth between questions.
- **Timer component**: starts ticking from the attempt deadline (`startedAt + duration`), not the scheduled start time. Turns red when < 5 minutes remain. Triggers auto-submission at zero.
- **Submission security**:
  - Manual submit button opens a confirmation modal summarizing answered/unanswered counts.
  - Auto-submit when timer reaches zero (with toast notification).
  - **Session lock**: after submission, transitions to a PostSubmitScreen showing the final score, correct/incorrect breakdown, and a "Back to Dashboard" button. Re-entry to the test screen is blocked.
- **Network drop resilience**: the page checks for an existing attempt on mount (via `GET /candidate/quizzes/:id/attempt`), so a page refresh mid-test resumes the in-progress attempt, and a refresh post-submit shows the scored result.

## Milestone 6 deliverables — Results and Analytics Flow

### Backend
| Method | Route                              | Description |
|--------|------------------------------------|-------------|
| GET    | `/candidate/quizzes/:id/result`    | Candidate's own result: total score, per-question breakdown with selected vs correct answers, time taken. Returns 404 if no attempt, 409 if not yet submitted. Correct answers revealed ONLY after submission. |
| GET    | `/instructor/quizzes/:id/results`  | Aggregated results for an instructor's quiz: total assigned, completed submissions, average/highest/lowest scores, score distribution, paginated candidate list with search. Enforces quiz ownership (403 on cross-tenant). |
| GET    | `/admin/analytics`                 | Platform-wide summary: quizzes grouped by status, total candidates/instructors, attempt completion rate, average score. Optional date range and instructor filters. Admin guard enforced. |

- **Candidate privacy**: candidate result endpoints leak nothing about other candidates' attempts, answers, or scores. Only the calling candidate's own data is returned.
- **Correct answers after submission only**: `getCandidateResult` returns 409 if the attempt is still in-progress. Correct answers are read from the quiz only after confirming the attempt status is `submitted` or `auto-submitted`.
- **Instructor ownership scoping**: `getInstructorQuizResults` calls `quiz.isOwnedBy(instructorId)` and returns 403 if the instructor doesn't own the quiz. Cross-tenant probing is blocked.
- **Determinism guarantee**: all aggregated data is derived from the stored `score` and `maxScore` fields on the attempt documents — never re-graded on read. Sort orders use `candidateId` as a stable tiebreaker.
- **Score distribution**: 5 buckets (0-20%, 21-40%, 41-60%, 61-80%, 81-100%) computed from stored percentage values.

### Frontend
- **Candidate Result Page** (`/candidate/quizzes/:id/result`): visual score summary with ScoreRing (circular progress), stat cards (total score, correct count, time taken), and a scrolling question-by-question review showing selected vs correct answers with color-coded options (green=correct, red=wrong, blue=your answer).
- **Instructor Results Dashboard** (`/instructor/quizzes/:id/results`): stat cards (assigned, completed, completion rate, average, top, lowest score), score distribution bar chart, and a paginated candidate results table with search by name/email and "View Details" action.
- **Instructor Analytics Page** (`/instructor/analytics`): list of all the instructor's quizzes with debounced search, backend pagination, and "View Results" buttons for live/completed quizzes.
- **Admin Analytics Page** (`/admin/analytics`): platform-wide dashboard with stat cards (total quizzes, candidates, instructors, attempts, avg score), attempt completion rate progress bar, and quizzes-by-status breakdown with a bar chart and table.
- **ScoreRing atom**: SVG-based circular progress indicator with color tiers (green ≥80%, amber ≥50%, red <50%).
- **DistributionChart atom**: CSS-based bar chart with animated heights and color-coded buckets — no external chart library.
- **Empty states**: proper fallback screens for no submissions, no search results, and no quizzes.
- **PostSubmitScreen** now includes a "View Results" button linking to the candidate result page.

## Security notes
- The JWT is **never** returned in a response body and **never** stored in `localStorage`.
- Cookies are `httpOnly`, `secure` (in production), and `sameSite`-restricted.
- Login returns the same 401 message whether the email is unknown or the password is wrong.
- Rate limiting is applied to `/auth` routes.

## Milestone 7 deliverables — Brownie Points, Testing & Documentation

### 1. Styling & Theme Polish

#### Dark mode
- Full application-wide dark mode implemented via **CSS custom properties** (design tokens) on `:root` and `[data-theme="dark"]`.
- All color tokens (`--qa-color-text`, `--qa-color-surface`, `--qa-color-bg`, `--qa-color-border`, etc.) are overridden in dark mode.
- **ThemeToggle atom**: a switch in the Navbar (and on the login page) that toggles between light and dark.
- **Persistence**: the choice is saved to `localStorage` (`quizarena-theme` key) and restored on page load.
- **OS preference**: on first visit (no stored preference), the theme falls back to `prefers-color-scheme: dark`.
- **No flash**: the theme is applied by setting `data-theme` on `<html>` — no re-render needed.

#### Mobile responsiveness
- **Sidebar layouts** (Admin, Instructor, Candidate): on mobile (≤768px), the sidebar collapses into a slide-in drawer with a hamburger toggle button and a backdrop overlay. Auto-closes on resize to desktop.
- **Tables**: all tables have `overflow-x: auto` wrappers with `min-width` to enable horizontal scrolling on small screens.
- **Stat cards and grids**: use `grid-template-columns: repeat(auto-fit, minmax(...))` for fluid, responsive layouts.
- **Navbar**: collapses user info on mobile, wraps the right section.
- **Touch-friendly**: buttons and interactive elements have adequate tap target sizes (≥2.5rem).

### 2. Comprehensive Test Suite

#### Backend (Jest + Supertest + mongodb-memory-server)
| Test file | Coverage |
|-----------|----------|
| `tests/middleware/auth.test.ts` | requireAuth (401 on missing/invalid cookie), requireRole (403 on wrong role), valid token passes |
| `tests/services/attempt.test.ts` | Start guards (404, 403, resume), scoring (single-choice, multi-select exact match, unanswered=0), idempotent submit, auto-submission past deadline, correct answers never leak |
| `tests/models/models.test.ts` | User (hashing, comparePassword, duplicate email), Quiz (default status, readiness, ownership), Attempt (unique index enforcement) |

- **Hermetic**: `mongodb-memory-server` spins up an in-memory MongoDB — no live DB, no network, no external clocks.
- **Test isolation**: `clearDatabase()` helper runs in `beforeEach` to wipe all collections.
- **Time guard testing**: the auto-submission test manipulates the attempt's `deadlineAt` field directly (instead of `jest.useFakeTimers()`) to avoid conflicts with mongodb-memory-server's internal timers.
- **Scripts**: `npm test`, `npm run test:coverage`, `npm run test:watch`.

#### Frontend (Jest + React Testing Library)
| Test file | Coverage |
|-----------|----------|
| `src/utils/validation.test.ts` | `isValidEmail` (valid/invalid formats, trimming), `isStrongPassword` (length, upper, lower, number, special, max length) |
| `src/utils/date.test.ts` | `formatDate`, `formatTime`, `formatDateTime`, `toDateTimeLocalValue`, `fromDateTimeLocalValue`, `statusLabel` |
| `src/utils/errors.test.ts` | `extractErrorMessage` (server error body, FETCH_ERROR, TIMEOUT_ERROR, PARSING_ERROR, plain Error, fallbacks) |
| `src/utils/randomId.test.ts` | `randomId` (prefix format, uniqueness across 100 calls) |
| `src/store/slices/authSlice.test.ts` | Reducer: `setUser`, `clearUser`, `setAuthError`, `setAuthLoading`, initial state |
| `src/interfaces/results.test.ts` | `formatDuration` (seconds, minutes, hours, composite) |
| `src/components/atoms/ThemeToggle.test.tsx` | Renders switch, toggles to dark, toggles back to light, persists to localStorage |

- **Scripts**: `npm test`, `npm run test:coverage`, `npm run test:watch`.
- **jsdom environment**: full DOM simulation for component tests.
- **CSS module mocking**: `identity-obj-proxy` stubs SCSS imports.

### 3. API Documentation (Swagger/OpenAPI)

- **Served at**: `GET /api-docs` (Swagger UI Express).
- **Spec file**: `backend/src/docs/swagger.ts` — a comprehensive OpenAPI 3.0.3 document.
- **Documented endpoints**: all 30+ routes across auth, admin, instructor, candidate, and health.
- **Schemas**: `UserProfile`, `Quiz`, `Question`, `Participant`, `AttemptStart`, `AttemptResult`, `InstructorResults`, `AdminAnalytics`, `ApiError`, and all request body schemas.
- **Error responses**: every endpoint documents its 400/401/403/404/409 responses.
- **Security scheme**: `cookieAuth` (apiKey in cookie `qa_token`).
- **Tags**: Auth, Admin, Instructor, Candidate, Health — for organized browsing in the UI.
