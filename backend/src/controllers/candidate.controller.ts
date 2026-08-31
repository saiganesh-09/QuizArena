import type { Request, Response, NextFunction } from 'express';
import {
  listCandidateQuizzes,
  getCandidateQuizDetail,
} from '../services/candidateQuiz.service';
import { AppError } from '../utils/AppError';
import type { ApiSuccessBody } from '../types/auth';
import type {
  CandidateQuizMeta,
  CandidateQuizListPayload,
} from '../types/quiz';
import type { CandidateQuizListQuery } from '../schemas/candidate.schema';

/**
 * Candidate controllers. All handlers assume:
 * - req.user is populated by requireAuth + requireRole('candidate')
 */

/** GET /candidate/quizzes */
export function listCandidateQuizzesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void (async () => {
    try {
      if (!req.user?.sub) throw AppError.unauthorized('Authentication required');
      const query = req.query as unknown as CandidateQuizListQuery;
      const payload = await listCandidateQuizzes(req.user.sub, query);
      const body: ApiSuccessBody<CandidateQuizListPayload> = { success: true, data: payload };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** GET /candidate/quizzes/:id */
export function getCandidateQuizDetailHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void (async () => {
    try {
      if (!req.user?.sub) throw AppError.unauthorized('Authentication required');
      const quiz = await getCandidateQuizDetail(req.user.sub, req.params.id);
      const body: ApiSuccessBody<CandidateQuizMeta> = { success: true, data: quiz };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}
