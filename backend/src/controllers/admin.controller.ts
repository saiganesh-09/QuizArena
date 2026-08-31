import type { Request, Response, NextFunction } from 'express';
import { listUsers } from '../services/adminUser.service';
import {
  createQuiz,
  editQuiz,
  deleteQuiz,
  cancelQuiz,
  assignInstructor,
  listQuizzes,
  getQuiz,
} from '../services/quiz.service';
import { AppError } from '../utils/AppError';
import type { ApiSuccessBody } from '../types/auth';
import type {
  AdminUserListPayload,
  Quiz,
  QuizListPayload,
} from '../types/quiz';
import type { CreateQuizInput, EditQuizInput, AssignInstructorInput } from '../schemas/quiz.schema';
import type { ListUsersQuery, ListQuizzesQuery } from '../schemas/admin.schema';

/**
 * Admin controllers. All handlers assume req.user is populated by
 * requireAuth + requireRole('admin') middleware.
 */

/** GET /admin/users — list/filter/sort/search users with stats. */
export function listUsersHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      const query = req.query as unknown as ListUsersQuery;
      const payload = await listUsers(query);
      const body: ApiSuccessBody<AdminUserListPayload> = { success: true, data: payload };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** GET /admin/quizzes — list/filter/sort/search quizzes with stats. */
export function listQuizzesHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      const query = req.query as unknown as ListQuizzesQuery;
      const payload = await listQuizzes(query);
      const body: ApiSuccessBody<QuizListPayload> = { success: true, data: payload };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** GET /admin/quizzes/:id — fetch a single quiz. */
export function getQuizHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      const quiz = await getQuiz(req.params.id);
      const body: ApiSuccessBody<Quiz> = { success: true, data: quiz };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** POST /admin/quizzes — create a quiz in Draft status. */
export function createQuizHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.user?.sub) throw AppError.unauthorized('Authentication required');
      const input = req.body as CreateQuizInput;
      const quiz = await createQuiz(input, req.user.sub);
      const body: ApiSuccessBody<Quiz> = { success: true, data: quiz };
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** PATCH /admin/quizzes/:id — edit a quiz (Draft/Scheduled only). */
export function editQuizHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      const input = req.body as EditQuizInput;
      const quiz = await editQuiz(req.params.id, input);
      const body: ApiSuccessBody<Quiz> = { success: true, data: quiz };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** DELETE /admin/quizzes/:id — delete a quiz (Draft only). */
export function deleteQuizHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      await deleteQuiz(req.params.id);
      const body: ApiSuccessBody<null> = { success: true, data: null };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** POST /admin/quizzes/:id/cancel — cancel a quiz. */
export function cancelQuizHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      const quiz = await cancelQuiz(req.params.id);
      const body: ApiSuccessBody<Quiz> = { success: true, data: quiz };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** POST /admin/quizzes/:id/assign-instructor — assign an instructor by email. */
export function assignInstructorHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      const input = req.body as AssignInstructorInput;
      const quiz = await assignInstructor(req.params.id, input);
      const body: ApiSuccessBody<Quiz> = { success: true, data: quiz };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}
