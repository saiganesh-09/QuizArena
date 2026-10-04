import type { Request, Response, NextFunction } from 'express';
import { getCandidateResult } from '../services/candidateResult.service';
import {
  getInstructorQuizResults,
  getInstructorAttemptDetail,
} from '../services/instructorResult.service';
import { getAdminAnalytics } from '../services/adminAnalytics.service';
import { AppError } from '../utils/AppError';
import type { ApiSuccessBody } from '../types/auth';
import type {
  CandidateResult,
  InstructorQuizResults,
  InstructorAttemptDetail,
  AdminAnalytics,
} from '../types/quiz';
import type { InstructorResultsQuery, AdminAnalyticsQuery } from '../schemas/result.schema';

/**
 * Result controllers for Milestone 6.
 *
 * All handlers assume req.user is populated by requireAuth + requireRole.
 */

/** GET /candidate/quizzes/:id/result — candidate's own result with correct answers. */
export function getCandidateResultHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.user?.sub) throw AppError.unauthorized('Authentication required');
      const result = await getCandidateResult(req.user.sub, req.params.id);
      const body: ApiSuccessBody<CandidateResult> = { success: true, data: result };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** GET /instructor/quizzes/:id/results — aggregated results for an instructor's quiz. */
export function getInstructorResultsHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.user?.sub) throw AppError.unauthorized('Authentication required');
      const query = req.query as unknown as InstructorResultsQuery;
      const result = await getInstructorQuizResults(req.user.sub, req.params.id, query);
      const body: ApiSuccessBody<InstructorQuizResults> = { success: true, data: result };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** GET /instructor/quizzes/:id/results/:attemptId — per-candidate attempt detail. */
export function getInstructorAttemptDetailHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.user?.sub) throw AppError.unauthorized('Authentication required');
      const result = await getInstructorAttemptDetail(req.user.sub, req.params.id, req.params.attemptId);
      const body: ApiSuccessBody<InstructorAttemptDetail> = { success: true, data: result };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** GET /admin/analytics — platform-wide analytics summary. */
export function getAdminAnalyticsHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.user?.sub) throw AppError.unauthorized('Authentication required');
      const query = req.query as unknown as AdminAnalyticsQuery;
      const result = await getAdminAnalytics(query);
      const body: ApiSuccessBody<AdminAnalytics> = { success: true, data: result };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}
