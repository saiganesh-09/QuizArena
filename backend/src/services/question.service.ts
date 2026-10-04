import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { IQuizDocument, IQuestionDoc } from '../models/Quiz';
import { AppError } from '../utils/AppError';
import { parseCsvBuffer } from '../utils/csv';
import { csvQuestionRowSchema } from '../schemas/instructor.schema';
import type {
  Question,
  BulkUploadResult,
  CsvRowError,
  QuestionType,
} from '../types/quiz';
import type { CreateQuestionInput, EditQuestionInput, CsvQuestionRow } from '../schemas/instructor.schema';

/**
 * Question service for instructors.
 *
 * - Manual add: validate and push a single question.
 * - Edit: allowed only while quiz is in Draft state.
 * - Delete: allowed (with client-side confirmation).
 * - CSV bulk upload: atomic — all rows validated before any insertion.
 */

/** Find a question subdoc by id within a quiz, or throw 404. */
function findQuestionOrThrow(quiz: IQuizDocument, questionId: string): IQuestionDoc {
  const question = (quiz.questions ?? []).find(
    (q) => q._id.toString() === questionId,
  );
  if (!question) {
    throw AppError.notFound('Question not found');
  }
  return question;
}

/** Convert a question subdoc to a public Question object. */
function toQuestion(q: IQuestionDoc): Question {
  return {
    id: q._id.toString(),
    type: q.type,
    text: q.text,
    options: (q.options ?? []).map((o) => ({ id: o.id, text: o.text })),
    correctOptionIds: q.correctOptionIds ?? [],
    points: q.points,
    createdAt: (q as unknown as { createdAt?: Date }).createdAt instanceof Date
      ? (q as unknown as { createdAt: Date }).createdAt.toISOString()
      : new Date().toISOString(),
    updatedAt: (q as unknown as { updatedAt?: Date }).updatedAt instanceof Date
      ? (q as unknown as { updatedAt: Date }).updatedAt.toISOString()
      : new Date().toISOString(),
  };
}

/** Add a single question manually. */
export async function addQuestion(
  quiz: IQuizDocument,
  input: CreateQuestionInput,
): Promise<Question> {
  if (!quiz.isEditable()) {
    throw AppError.conflict(
      `Questions can only be added to Draft or Scheduled quizzes. Current status: '${quiz.status}'.`,
    );
  }

  const newQuestion: IQuestionDoc = {
    _id: new mongoose.Types.ObjectId(),
    type: input.type,
    text: input.text,
    options: input.options.map((o) => ({ id: o.id, text: o.text })),
    correctOptionIds: input.correctOptionIds,
    points: input.points,
  };

  quiz.questions.push(newQuestion);
  await quiz.save();
  return toQuestion(newQuestion);
}

/** Edit a question. Allowed only while the quiz is in Draft state. */
export async function editQuestion(
  quiz: IQuizDocument,
  questionId: string,
  input: EditQuestionInput,
): Promise<Question> {
  // Edits to questions are allowed only while the quiz is in Draft.
  if (quiz.status !== 'draft') {
    throw AppError.conflict(
      `Questions can only be edited while the quiz is in Draft. Current status: '${quiz.status}'.`,
    );
  }

  const question = findQuestionOrThrow(quiz, questionId);

  if (input.type !== undefined) question.type = input.type;
  if (input.text !== undefined) question.text = input.text;
  if (input.options !== undefined) {
    question.options = input.options.map((o) => ({ id: o.id, text: o.text }));
  }
  if (input.correctOptionIds !== undefined) question.correctOptionIds = input.correctOptionIds;
  if (input.points !== undefined) question.points = input.points;

  await quiz.save();
  return toQuestion(question);
}

/** Delete a question. */
export async function deleteQuestion(
  quiz: IQuizDocument,
  questionId: string,
): Promise<void> {
  if (!quiz.isEditable()) {
    throw AppError.conflict(
      `Questions can only be deleted from Draft or Scheduled quizzes. Current status: '${quiz.status}'.`,
    );
  }

  const index = (quiz.questions ?? []).findIndex(
    (q) => q._id.toString() === questionId,
  );
  if (index === -1) {
    throw AppError.notFound('Question not found');
  }

  quiz.questions.splice(index, 1);
  await quiz.save();
}

/** List all questions in a quiz. */
export async function listQuestions(quiz: IQuizDocument): Promise<Question[]> {
  return (quiz.questions ?? []).map(toQuestion);
}

/**
 * Atomic CSV bulk upload of questions.
 *
 * Parses and validates EVERY row before inserting any. If any row fails
 * validation, the entire upload is rejected with detailed row-level errors.
 * Only if all rows pass are they appended to the quiz in a single save.
 */
export async function bulkUploadQuestions(
  quiz: IQuizDocument,
  csvBuffer: Buffer,
): Promise<BulkUploadResult<Question>> {
  if (!quiz.isEditable()) {
    throw AppError.conflict(
      `Questions can only be bulk-uploaded to Draft or Scheduled quizzes. Current status: '${quiz.status}'.`,
    );
  }

  // Parse the CSV buffer into row objects.
  let rawRows: Record<string, string>[];
  try {
    rawRows = await parseCsvBuffer(csvBuffer);
  } catch (err) {
    throw AppError.badRequest('Failed to parse CSV file', (err as Error).message);
  }

  if (rawRows.length === 0) {
    throw AppError.badRequest('CSV file is empty or has no data rows');
  }

  // Validate every row. Collect errors with row numbers (1-based, header = row 1).
  const errors: CsvRowError[] = [];
  const validRows: CsvQuestionRow[] = [];

  rawRows.forEach((raw, idx) => {
    const rowNumber = idx + 2; // +2 because row 1 is the header
    const result = csvQuestionRowSchema.safeParse(raw);
    if (result.success) {
      validRows.push(result.data);
    } else {
      const messages = result.error.issues.map((i) => i.message).join('; ');
      errors.push({ row: rowNumber, message: messages });
    }
  });

  // Atomic: if any row failed, reject the entire upload.
  if (errors.length > 0) {
    return {
      inserted: 0,
      skipped: rawRows.length,
      errors,
      items: [],
    };
  }

  // Transform validated rows into question subdocuments.
  const newQuestions: IQuestionDoc[] = validRows.map((row) => {
    // Build options from non-empty option columns.
    const optionTexts = [row.option1, row.option2, row.option3, row.option4, row.option5].filter(
      (t): t is string => typeof t === 'string' && t.length > 0,
    );
    const options = optionTexts.map((text) => ({ id: randomUUID(), text }));
    // Parse correctOptions (pipe-separated option numbers, 1-based).
    const correctNumbers = row.correctOptions
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => parseInt(s, 10))
      .filter((n) => !Number.isNaN(n) && n >= 1 && n <= options.length);
    const correctOptionIds = correctNumbers.map((n) => options[n - 1].id);

    return {
      _id: new mongoose.Types.ObjectId(),
      type: row.type as QuestionType,
      text: row.text,
      options,
      correctOptionIds,
      points: row.points,
    };
  });

  // Append all in a single save (atomic at the document level).
  quiz.questions.push(...newQuestions);
  await quiz.save();

  return {
    inserted: newQuestions.length,
    skipped: 0,
    errors: [],
    items: newQuestions.map(toQuestion),
  };
}
