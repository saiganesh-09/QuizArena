import { z } from 'zod';

/**
 * Zod validation schemas for the instructor feature.
 * Covers questions, participants, CSV row shapes, and list queries.
 */

// ---- Questions ----

export const questionTypeSchema = z.enum(['single-choice', 'multi-select', 'true-false']);

/** A single option in a question. */
const optionSchema = z.object({
  id: z.string().min(1, 'Option id is required'),
  text: z.string().trim().min(1, 'Option text is required').max(300, 'Option text is too long'),
});

export const createQuestionSchema = z
  .object({
    type: questionTypeSchema,
    text: z.string().trim().min(3, 'Question text must be at least 3 characters').max(1000, 'Question text is too long'),
    options: z.array(optionSchema).min(2, 'At least 2 options are required').max(10, 'At most 10 options are allowed'),
    correctOptionIds: z.array(z.string().min(1)).min(1, 'At least one correct option is required'),
    points: z.number().int('Points must be a whole number').min(1, 'Points must be at least 1').max(100, 'Points must be at most 100').default(1),
  })
  .refine(
    (data) => data.correctOptionIds.every((id) => data.options.some((o) => o.id === id)),
    { message: 'correctOptionIds must reference existing option ids', path: ['correctOptionIds'] },
  )
  .refine(
    (data) => data.type !== 'single-choice' && data.type !== 'true-false' || data.correctOptionIds.length === 1,
    { message: 'single-choice and true-false questions must have exactly one correct option', path: ['correctOptionIds'] },
  )
  .refine(
    (data) => data.type !== 'true-false' || data.options.length === 2,
    { message: 'true-false questions must have exactly 2 options', path: ['options'] },
  );

export const editQuestionSchema = z
  .object({
    type: questionTypeSchema.optional(),
    text: z.string().trim().min(3, 'Question text must be at least 3 characters').max(1000, 'Question text is too long').optional(),
    options: z.array(optionSchema).min(2, 'At least 2 options are required').max(10, 'At most 10 options are allowed').optional(),
    correctOptionIds: z.array(z.string().min(1)).min(1, 'At least one correct option is required').optional(),
    points: z.number().int('Points must be a whole number').min(1, 'Points must be at least 1').max(100, 'Points must be at most 100').optional(),
  })
  .refine(
    (data) => {
      if (data.correctOptionIds && data.options) {
        return data.correctOptionIds.every((id) => data.options!.some((o) => o.id === id));
      }
      return true;
    },
    { message: 'correctOptionIds must reference existing option ids', path: ['correctOptionIds'] },
  )
  .refine(
    (data) => {
      if (data.type && (data.type === 'single-choice' || data.type === 'true-false') && data.correctOptionIds) {
        return data.correctOptionIds.length === 1;
      }
      return true;
    },
    { message: 'single-choice and true-false questions must have exactly one correct option', path: ['correctOptionIds'] },
  );

// ---- Participants ----

export const addParticipantSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid candidate email is required'),
});

// ---- CSV row schemas (for bulk upload validation) ----

/**
 * CSV row for a question. Expected columns:
 * type, text, option1, option2, option3, option4, option5, correctOptions, points
 * correctOptions is a pipe-separated list of option numbers (e.g. "1" or "1|3").
 */
export const csvQuestionRowSchema = z.object({
  type: questionTypeSchema,
  text: z.string().trim().min(3, 'Question text must be at least 3 characters'),
  option1: z.string().trim().min(1, 'Option 1 is required'),
  option2: z.string().trim().min(1, 'Option 2 is required'),
  option3: z.string().trim().optional(),
  option4: z.string().trim().optional(),
  option5: z.string().trim().optional(),
  correctOptions: z.string().min(1, 'At least one correct option is required'),
  points: z.coerce.number().int().min(1).max(100).default(1),
});

/** CSV row for a participant. Expected column: email */
export const csvParticipantRowSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
});

// ---- List query ----

export const instructorQuizListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['draft', 'scheduled', 'live', 'completed', 'cancelled']).optional(),
  kind: z.enum(['quiz', 'homework']).optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['title', 'status', 'startTime', 'endTime', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type EditQuestionInput = z.infer<typeof editQuestionSchema>;
export type AddParticipantInput = z.infer<typeof addParticipantSchema>;
export type CsvQuestionRow = z.infer<typeof csvQuestionRowSchema>;
export type CsvParticipantRow = z.infer<typeof csvParticipantRowSchema>;
export type InstructorQuizListQuery = z.infer<typeof instructorQuizListQuerySchema>;
