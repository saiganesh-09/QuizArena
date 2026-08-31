import type { Request, Response, NextFunction } from 'express';
import {
  startAttempt,
  submitAttempt,
  getAttempt,
} from '../services/attempt.service';
import { AppError } from '../utils/AppError';
import type { ApiSuccessBody } from '../types/auth';
import type { AttemptPayload } from '../types/quiz';
import type { SubmitAnswersInput } from '../schemas/attempt.schema';

/**
 * Candidate attempt controllers. All handlers assume:
 * - req.user is populated by requireAuth + requireRole('candidate')
 */

/** POST /candidate/quizzes/:id/start */
export function startQuizAttempt(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.user?.sub) throw AppError.unauthorized('Authentication required');
      const attempt = await startAttempt(req.user.sub, req.params.id);
      const body: ApiSuccessBody<AttemptPayload> = { success: true, data: attempt };
      res.status(200).json(body);
    } catch (err) {
      // If the error is a 409 Conflict with the existing attempt in
      // details, return it with the attempt payload so the client can
      // transition to the post-submit screen.
      if (err instanceof AppError && err.statusCode === 409 && err.details) {
        res.status(409).json({
          success: false,
          error: { code: err.code, message: err.message },
          data: err.details,
        });
        return;
      }
      next(err);
    }
  })();
}

/** POST /candidate/quizzes/:id/submit */
export function submitQuizAttempt(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.user?.sub) throw AppError.unauthorized('Authentication required');
      const input = req.body as SubmitAnswersInput;
      const attempt = await submitAttempt(req.user.sub, req.params.id, input);
      const body: ApiSuccessBody<AttemptPayload> = { success: true, data: attempt };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** GET /candidate/quizzes/:id/attempt */
export function getQuizAttempt(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.user?.sub) throw AppError.unauthorized('Authentication required');
      const attempt = await getAttempt(req.user.sub, req.params.id);
      const body: ApiSuccessBody<AttemptPayload> = { success: true, data: attempt };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}
