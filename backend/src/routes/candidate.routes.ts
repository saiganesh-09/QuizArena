import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/requireAuth';
import { validateQuery, validateBody } from '../middlewares/validate';
import {
  listCandidateQuizzesHandler,
  getCandidateQuizDetailHandler,
} from '../controllers/candidate.controller';
import {
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttempt,
} from '../controllers/attempt.controller';
import { getCandidateResultHandler } from '../controllers/result.controller';
import { candidateQuizListQuerySchema } from '../schemas/candidate.schema';
import { submitAnswersSchema } from '../schemas/attempt.schema';

/**
 * Candidate routes — every route is locked behind:
 *   1. requireAuth (verifies JWT cookie, attaches req.user)
 *   2. requireRole('candidate') (returns 403 for non-candidates)
 *
 * The assignment filter is applied in the service layer, not here, so
 * that pagination/counts always happen after the security boundary.
 *
 * Attempt routes (start/submit) enforce assignment + live-window + one-
 * attempt-per-candidate in the service layer.
 */
const router = Router();

router.use(requireAuth, requireRole('candidate'));

// ---- Quiz list (assignment-filtered) ----
router.get('/quizzes', validateQuery(candidateQuizListQuerySchema), listCandidateQuizzesHandler);

// ---- Quiz detail (metadata-only, live-window guarded) ----
router.get('/quizzes/:id', getCandidateQuizDetailHandler);

// ---- Attempt engine (start / submit / get) ----
router.post('/quizzes/:id/start', startQuizAttempt);
router.post('/quizzes/:id/submit', validateBody(submitAnswersSchema), submitQuizAttempt);
router.get('/quizzes/:id/attempt', getQuizAttempt);

// ---- Result (own attempt with correct answers, post-submission only) ----
router.get('/quizzes/:id/result', getCandidateResultHandler);

export default router;
