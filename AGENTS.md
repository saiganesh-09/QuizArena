# QuizArena — project notes for agents

## Build / verify commands

### Backend (`/backend`)
- Install: `npm install`
- Typecheck: `npm run typecheck`
- Build: `npm run build` (outputs to `backend/dist/`)
- Dev server: `npm run dev` (ts-node-dev, port 5000)
- Start (prod): `npm start`
- Tests: `npm test` (Jest + Supertest + mongodb-memory-server, hermetic)
- Coverage: `npm run test:coverage`
- API docs: `GET /api-docs` (Swagger UI)

### Frontend (`/frontend`)
- Install: `npm install`
- Typecheck: `npm run typecheck`
- Build: `npm run build` (tsc -b && vite build, outputs to `frontend/dist/`)
- Dev server: `npm run dev` (Vite, port 5173, proxies `/api` -> `http://localhost:5000`)
- Tests: `npm test` (Jest + React Testing Library, jsdom)
- Coverage: `npm run test:coverage`

## Conventions
- Strict TypeScript everywhere; **no `any`** in either project.
- Backend: JWT lives only in an HTTP-only, Secure, SameSite cookie. Never return it in a response body.
- Backend: `requireRole(...roles)` returns **403** for authenticated non-admins (401 only when unauthenticated). Role is read from the verified JWT, never from client headers.
- Backend: quiz lifecycle state machine enforced in the Mongoose model (`transitionTo`, `isEditable`, `isCancellable`, `isDeletable`, `computeReadiness`, `isOwnedBy`). Edits only in Draft/Scheduled; deletes only in Draft; Completed cannot be cancelled.
- Backend: instructor ownership is centralized in `requireQuizOwnership` middleware — returns **403** (not 404) on cross-tenant access. Loaded quiz is attached to `req.loadedQuiz`.
- Backend: candidate assignment filter (`participants.userId`) is applied FIRST in every `/candidate/*` query, before pagination/counts — no unassigned quiz metadata ever leaks. Direct-URL probing returns 403 (not 404) for assigned-only enforcement.
- Backend: candidate endpoints return metadata only (`CandidateQuizMeta`) — never questions, options, answer keys, or participant lists. Live-window guard blocks detail access outside the scheduled window (403).
- Backend: attempt engine — one attempt per candidate enforced by unique index `{ candidateId, quizId }`. Correct answers (`correctOptionIds`) NEVER leave the server during the attempt phase (stripped in `toAttemptQuestionForPayload`). Score calculated once at submission and persisted; all reads use the stored value. Concurrent submits safe via `findOneAndUpdate` with status guard. Time guard caps late submissions at the deadline (auto-submitted). Idempotent submit returns existing scored attempt.
- Backend: results & analytics — candidate result endpoint reveals correct answers ONLY after submission (409 if in-progress). Instructor results enforce ownership (403 cross-tenant). Admin analytics is admin-guarded. All aggregated data derived from stored scores — never re-graded on read. Sort orders use `candidateId` as stable tiebreaker.
- Backend: publish readiness requires ≥ 1 question, ≥ 1 participant, and a valid upcoming schedule window; otherwise 409 with a `missing[]` list.
- Backend: CSV uploads (Multer + csv-parser) are atomic — all rows validated before any insertion; row-level errors on failure. File field name is `file`, max 2MB, `.csv` only.
- Backend: participant emails must map to registered `candidate` users; duplicates skipped idempotently; `addedAt` recorded.
- Backend: all datetimes are ISO-8601 strings, stored in UTC. `endTime` must be strictly after `startTime`.
- Frontend: all API calls go through RTK Query (`store/api/*`). No `fetch` in components. `adminApi`, `instructorApi`, `candidateApi`, `attemptApi`, and `resultsApi` inject endpoints into `authApi`.
- Frontend: admin routes are nested under `<AdminLayout />` and guarded by `<ProtectedRoute allowedRoles={['admin']} />`.
- Frontend: instructor routes are nested under `<InstructorLayout />` and guarded by `<ProtectedRoute allowedRoles={['instructor']} />`.
- Frontend: candidate routes are nested under `<CandidateLayout />` and guarded by `<ProtectedRoute allowedRoles={['candidate']} />`. Post-login `/dashboard` redirects to the role-specific dashboard.
- Styling: SCSS only. No Tailwind/Bootstrap/external CSS frameworks.
- Atomic Design: `components/atoms` -> `components/molecules` -> `components/organisms`.
- Each component has a co-located `.scss` file with a BEM-ish `qa-*` class namespace.
- Theming: CSS custom properties on `:root` (light) and `[data-theme="dark"]` (dark). ThemeToggle atom persists choice to `localStorage` (`quizarena-theme`). All color references use `var(--qa-color-*)` tokens — never hardcoded hex values.
- Mobile: sidebar layouts use `useMobileSidebar` hook for hamburger toggle + slide-in drawer on ≤768px. Tables use `overflow-x: auto` wrappers.
- Testing: backend tests use `mongodb-memory-server` (hermetic, offline). Test files in `tests/{middleware,services,models}/`. Helpers in `tests/helpers.ts` and `tests/setup.ts`. Frontend tests co-located with source (`*.test.ts`/`*.test.tsx`).
- API docs: OpenAPI 3.0.3 spec in `src/docs/swagger.ts`, served at `/api-docs` via `swagger-ui-express`. Keep in sync with route additions/changes.

## Env files (gitignored — create locally)
- `backend/.env` from `backend/.env.example` (PORT, MONGO_URI, JWT_SECRET, COOKIE_*, CLIENT_ORIGIN)
- `frontend/.env` from `frontend/.env.example` (VITE_API_BASE_URL)

## Runtime requirements
- Node.js >= 18
- MongoDB reachable at the configured `MONGO_URI`
