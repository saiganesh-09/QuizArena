import { z } from 'zod';

/**
 * Zod validation schemas for the admin quiz feature.
 * Datetimes are validated as ISO-8601 strings; endTime must be strictly
 * after startTime. Field-level errors are surfaced via .flatten().
 */

/** ISO-8601 datetime string (basic shape check; Date parsing adds rigor). */
const isoDateTime = z
  .string()
  .min(1, 'A date and time is required')
  .refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Must be a valid ISO-8601 date-time',
  });

export const createQuizSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
    description: z.string().trim().max(2000, 'Description is too long').optional().default(''),
    startTime: isoDateTime,
    endTime: isoDateTime,
    durationMinutes: z
      .number({ invalid_type_error: 'Duration must be a number' })
      .int('Duration must be a whole number')
      .min(1, 'Duration must be at least 1 minute')
      .max(10080, 'Duration must be at most 7 days'),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().default('Beginner'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional().default('Easy'),
    passingPoints: z.number().int().min(0, 'Passing points cannot be negative').optional().default(0),
  })
  .refine((data) => new Date(data.endTime).getTime() > new Date(data.startTime).getTime(), {
    message: 'End time must be strictly after start time',
    path: ['endTime'],
  });

/** Edit schema: all fields optional, but if both dates present, enforce order. */
export const editQuizSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long').optional(),
    description: z.string().trim().max(2000, 'Description is too long').optional(),
    startTime: isoDateTime.optional(),
    endTime: isoDateTime.optional(),
    durationMinutes: z
      .number({ invalid_type_error: 'Duration must be a number' })
      .int('Duration must be a whole number')
      .min(1, 'Duration must be at least 1 minute')
      .max(10080, 'Duration must be at most 7 days')
      .optional(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
    passingPoints: z.number().int().min(0, 'Passing points cannot be negative').optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime).getTime() > new Date(data.startTime).getTime();
      }
      return true;
    },
    { message: 'End time must be strictly after start time', path: ['endTime'] },
  );

export const assignInstructorSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid instructor email is required'),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type EditQuizInput = z.infer<typeof editQuizSchema>;
export type AssignInstructorInput = z.infer<typeof assignInstructorSchema>;
