import type { Request, Response, NextFunction } from 'express';
import { QuizModel } from '../models/Quiz';
import { AppError } from '../utils/AppError';

/**
 * requireQuizOwnership — centralized ownership guard.
 *
 * Loads the quiz by :id from the route params, verifies that the
 * authenticated instructor is assigned to it, and attaches the loaded
 * quiz document to req.loadedQuiz for downstream handlers.
 *
 * Returns 403 Forbidden (NOT 404) if the quiz exists but is not assigned
 * to the calling instructor, to block cross-tenant leakage. Returns 404
 * only if the quiz genuinely does not exist.
 *
 * Must be used AFTER requireAuth + requireRole('instructor').
 *
 * The `req.loadedQuiz` field is declared in `src/types/express.d.ts`.
 */

export async function requireQuizOwnership(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const quizId = req.params.id;
    if (!quizId) {
      return next(AppError.badRequest('Quiz id is required'));
    }

    const quiz = await QuizModel.findById(quizId).exec();
    if (!quiz) {
      return next(AppError.notFound('Quiz not found'));
    }

    // req.user is guaranteed by requireAuth; guard for type safety.
    if (!req.user?.sub) {
      return next(AppError.unauthorized('Authentication required'));
    }

    // Ownership check: the instructor must be in the quiz's instructors list.
    if (!quiz.isOwnedBy(req.user.sub)) {
      // 403 (not 404) to block cross-tenant leakage — the quiz exists
      // but belongs to another instructor.
      return next(AppError.forbidden('You do not have access to this quiz'));
    }

    req.loadedQuiz = quiz;
    next();
  } catch (err) {
    next(err as Error);
  }
}
