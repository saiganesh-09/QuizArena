import { z } from 'zod';

/**
 * Zod validation schema for the instructor quiz results query.
 * Supports pagination + text search by candidate name.
 */
export const instructorResultsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().default(''),
  sortBy: z.enum(['score', 'timeTakenSeconds', 'submittedAt', 'candidateName']).default('score'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type InstructorResultsQuery = z.infer<typeof instructorResultsQuerySchema>;

/**
 * Zod validation schema for the admin analytics query.
 * Supports optional date range and instructor filters.
 */
export const adminAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  instructorId: z.string().min(1).optional(),
});

export type AdminAnalyticsQuery = z.infer<typeof adminAnalyticsQuerySchema>;
