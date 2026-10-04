import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/requireAuth';
import { requireQuizOwnership } from '../middlewares/requireQuizOwnership';
import { validateBody, validateQuery } from '../middlewares/validate';
import { csvUpload } from '../config/multer';
import {
  createMyQuiz,
  listMyQuizzes,
  getMyQuiz,
  editMyQuiz,
  cancelMyQuiz,
  deleteMyQuiz,
  publishMyQuiz,
  listMyQuestions,
  addMyQuestion,
  editMyQuestion,
  deleteMyQuestion,
  bulkUploadQuestionsHandler,
  listMyParticipants,
  addMyParticipant,
  removeMyParticipant,
  bulkUploadParticipantsHandler,
} from '../controllers/instructor.controller';
import {
  createQuestionSchema,
  editQuestionSchema,
  addParticipantSchema,
  instructorQuizListQuerySchema,
} from '../schemas/instructor.schema';
import { instructorResultsQuerySchema, gradeAttemptSchema } from '../schemas/result.schema';
import { createQuizSchema, editQuizSchema } from '../schemas/quiz.schema';
import {
  getInstructorResultsHandler,
  getInstructorAttemptDetailHandler,
  gradeAttemptHandler,
} from '../controllers/result.controller';

/**
 * Instructor routes — every route is locked behind:
 *   1. requireAuth (verifies JWT cookie, attaches req.user)
 *   2. requireRole('instructor') (returns 403 for non-instructors)
 *
 * Routes with :id additionally use requireQuizOwnership, which loads the
 * quiz, verifies the instructor owns it (403 on cross-tenant), and
 * attaches req.loadedQuiz for downstream handlers.
 */
const router = Router();

// Every /instructor/* route requires authentication + instructor role.
router.use(requireAuth, requireRole('instructor'));

// ---- Quiz list / create (no :id, no ownership guard) ----
router.get('/quizzes', validateQuery(instructorQuizListQuerySchema), listMyQuizzes);
router.post('/quizzes', validateBody(createQuizSchema), createMyQuiz);

// ---- Quiz-scoped routes (require ownership) ----
router.get('/quizzes/:id', requireQuizOwnership, getMyQuiz);
router.patch('/quizzes/:id', requireQuizOwnership, validateBody(editQuizSchema), editMyQuiz);
router.delete('/quizzes/:id', requireQuizOwnership, deleteMyQuiz);
router.post('/quizzes/:id/cancel', requireQuizOwnership, cancelMyQuiz);
router.post('/quizzes/:id/publish', requireQuizOwnership, publishMyQuiz);

// ---- Questions (require ownership) ----
router.get('/quizzes/:id/questions', requireQuizOwnership, listMyQuestions);
router.post('/quizzes/:id/questions', requireQuizOwnership, validateBody(createQuestionSchema), addMyQuestion);
router.patch('/quizzes/:id/questions/:questionId', requireQuizOwnership, validateBody(editQuestionSchema), editMyQuestion);
router.delete('/quizzes/:id/questions/:questionId', requireQuizOwnership, deleteMyQuestion);
router.post(
  '/quizzes/:id/questions/bulk-csv',
  requireQuizOwnership,
  csvUpload.single('file'),
  bulkUploadQuestionsHandler,
  // handleMulterError is attached as post-handler via error middleware pattern;
  // multer errors are thrown synchronously and caught by the centralized handler.
);

// ---- Participants (require ownership) ----
router.get('/quizzes/:id/participants', requireQuizOwnership, listMyParticipants);
router.post('/quizzes/:id/participants', requireQuizOwnership, validateBody(addParticipantSchema), addMyParticipant);
router.delete('/quizzes/:id/participants/:participantId', requireQuizOwnership, removeMyParticipant);
router.post(
  '/quizzes/:id/participants/bulk-csv',
  requireQuizOwnership,
  csvUpload.single('file'),
  bulkUploadParticipantsHandler,
);

// ---- Results (require ownership — ownership is re-verified in service) ----
router.get(
  '/quizzes/:id/results',
  requireQuizOwnership,
  validateQuery(instructorResultsQuerySchema),
  getInstructorResultsHandler,
);
router.get(
  '/quizzes/:id/results/:attemptId',
  requireQuizOwnership,
  getInstructorAttemptDetailHandler,
);
router.patch(
  '/quizzes/:id/results/:attemptId/grade',
  requireQuizOwnership,
  validateBody(gradeAttemptSchema),
  gradeAttemptHandler,
);

export default router;
