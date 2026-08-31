import type { Request, Response, NextFunction } from 'express';
import {
  listInstructorQuizzes,
  getInstructorQuiz,
  editInstructorQuiz,
  cancelInstructorQuiz,
  deleteInstructorQuiz,
  publishInstructorQuiz,
} from '../services/instructorQuiz.service';
import {
  addQuestion,
  editQuestion,
  deleteQuestion,
  listQuestions,
  bulkUploadQuestions,
} from '../services/question.service';
import {
  addParticipant,
  removeParticipant,
  listParticipants,
  bulkUploadParticipants,
} from '../services/participant.service';
import { AppError } from '../utils/AppError';
import type { ApiSuccessBody } from '../types/auth';
import type {
  InstructorQuiz,
  InstructorQuizListPayload,
  Question,
  Participant,
  BulkUploadResult,
} from '../types/quiz';
import type {
  CreateQuestionInput,
  EditQuestionInput,
  AddParticipantInput,
  InstructorQuizListQuery,
} from '../schemas/instructor.schema';
import type { EditQuizInput } from '../schemas/quiz.schema';

/**
 * Instructor controllers. All handlers assume:
 * - req.user is populated by requireAuth + requireRole('instructor')
 * - req.loadedQuiz is populated by requireQuizOwnership for :id routes
 */

// ---- Quiz list / detail / edit / cancel / delete / publish ----

/** GET /instructor/quizzes */
export function listMyQuizzes(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.user?.sub) throw AppError.unauthorized('Authentication required');
      const query = req.query as unknown as InstructorQuizListQuery;
      const payload = await listInstructorQuizzes(req.user.sub, query);
      const body: ApiSuccessBody<InstructorQuizListPayload> = { success: true, data: payload };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** GET /instructor/quizzes/:id */
export function getMyQuiz(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      const quiz = await getInstructorQuiz(req.loadedQuiz);
      const body: ApiSuccessBody<InstructorQuiz> = { success: true, data: quiz };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** PATCH /instructor/quizzes/:id */
export function editMyQuiz(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      const input = req.body as EditQuizInput;
      const quiz = await editInstructorQuiz(req.loadedQuiz, input);
      const body: ApiSuccessBody<InstructorQuiz> = { success: true, data: quiz };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** POST /instructor/quizzes/:id/cancel */
export function cancelMyQuiz(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      const quiz = await cancelInstructorQuiz(req.loadedQuiz);
      const body: ApiSuccessBody<InstructorQuiz> = { success: true, data: quiz };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** DELETE /instructor/quizzes/:id */
export function deleteMyQuiz(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      await deleteInstructorQuiz(req.loadedQuiz);
      const body: ApiSuccessBody<null> = { success: true, data: null };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** POST /instructor/quizzes/:id/publish */
export function publishMyQuiz(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      const quiz = await publishInstructorQuiz(req.loadedQuiz);
      const body: ApiSuccessBody<InstructorQuiz> = { success: true, data: quiz };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

// ---- Questions ----

/** GET /instructor/quizzes/:id/questions */
export function listMyQuestions(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      const questions = await listQuestions(req.loadedQuiz);
      const body: ApiSuccessBody<Question[]> = { success: true, data: questions };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** POST /instructor/quizzes/:id/questions */
export function addMyQuestion(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      const input = req.body as CreateQuestionInput;
      const question = await addQuestion(req.loadedQuiz, input);
      const body: ApiSuccessBody<Question> = { success: true, data: question };
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** PATCH /instructor/quizzes/:id/questions/:questionId */
export function editMyQuestion(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      const input = req.body as EditQuestionInput;
      const question = await editQuestion(req.loadedQuiz, req.params.questionId, input);
      const body: ApiSuccessBody<Question> = { success: true, data: question };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** DELETE /instructor/quizzes/:id/questions/:questionId */
export function deleteMyQuestion(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      await deleteQuestion(req.loadedQuiz, req.params.questionId);
      const body: ApiSuccessBody<null> = { success: true, data: null };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** POST /instructor/quizzes/:id/questions/bulk-csv */
export function bulkUploadQuestionsHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file || !file.buffer) {
        throw AppError.badRequest('No CSV file uploaded (field name must be "file")');
      }
      const result = await bulkUploadQuestions(req.loadedQuiz, file.buffer);
      const status = result.errors.length > 0 ? 422 : 201;
      const body: ApiSuccessBody<BulkUploadResult<Question>> = { success: true, data: result };
      res.status(status).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

// ---- Participants ----

/** GET /instructor/quizzes/:id/participants */
export function listMyParticipants(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      const participants = await listParticipants(req.loadedQuiz);
      const body: ApiSuccessBody<Participant[]> = { success: true, data: participants };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** POST /instructor/quizzes/:id/participants */
export function addMyParticipant(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      const input = req.body as AddParticipantInput;
      const { participant, alreadyAssigned } = await addParticipant(req.loadedQuiz, input);
      const body: ApiSuccessBody<{ participant: Participant | null; alreadyAssigned: boolean }> = {
        success: true,
        data: { participant, alreadyAssigned },
      };
      res.status(alreadyAssigned ? 200 : 201).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** DELETE /instructor/quizzes/:id/participants/:participantId */
export function removeMyParticipant(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      await removeParticipant(req.loadedQuiz, req.params.participantId);
      const body: ApiSuccessBody<null> = { success: true, data: null };
      res.status(200).json(body);
    } catch (err) {
      next(err);
    }
  })();
}

/** POST /instructor/quizzes/:id/participants/bulk-csv */
export function bulkUploadParticipantsHandler(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    try {
      if (!req.loadedQuiz) throw AppError.internal('Quiz not loaded');
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file || !file.buffer) {
        throw AppError.badRequest('No CSV file uploaded (field name must be "file")');
      }
      const result = await bulkUploadParticipants(req.loadedQuiz, file.buffer);
      const status = result.errors.length > 0 ? 422 : 201;
      const body: ApiSuccessBody<BulkUploadResult<Participant>> = { success: true, data: result };
      res.status(status).json(body);
    } catch (err) {
      next(err);
    }
  })();
}
