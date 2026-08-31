import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/requireAuth';
import { validateBody, validateQuery } from '../middlewares/validate';
import {
  listUsersHandler,
  listQuizzesHandler,
  getQuizHandler,
  createQuizHandler,
  editQuizHandler,
  deleteQuizHandler,
  cancelQuizHandler,
  assignInstructorHandler,
} from '../controllers/admin.controller';
import {
  createQuizSchema,
  editQuizSchema,
  assignInstructorSchema,
} from '../schemas/quiz.schema';
import {
  listUsersQuerySchema,
  listQuizzesQuerySchema,
} from '../schemas/admin.schema';
import { adminAnalyticsQuerySchema } from '../schemas/result.schema';
import { getAdminAnalyticsHandler } from '../controllers/result.controller';

/**
 * Admin routes — every route is locked behind:
 *   1. requireAuth (verifies JWT cookie, attaches req.user)
 *   2. requireRole('admin') (returns 403 for authenticated non-admins)
 *
 * The role is read strictly from the verified JWT payload — never from
 * client-supplied headers or body fields.
 */
const router = Router();

// Every /admin/* route requires authentication + admin role.
router.use(requireAuth, requireRole('admin'));

// User management
router.get('/users', validateQuery(listUsersQuerySchema), listUsersHandler);

// Quiz management
router.get('/quizzes', validateQuery(listQuizzesQuerySchema), listQuizzesHandler);
router.get('/quizzes/:id', getQuizHandler);
router.post('/quizzes', validateBody(createQuizSchema), createQuizHandler);
router.patch('/quizzes/:id', validateBody(editQuizSchema), editQuizHandler);
router.delete('/quizzes/:id', deleteQuizHandler);
router.post('/quizzes/:id/cancel', cancelQuizHandler);
router.post(
  '/quizzes/:id/assign-instructor',
  validateBody(assignInstructorSchema),
  assignInstructorHandler,
);

// ---- Analytics (platform-wide summary) ----
router.get('/analytics', validateQuery(adminAnalyticsQuerySchema), getAdminAnalyticsHandler);

export default router;
