import { z } from 'zod';

/**
 * Zod validation schemas for the candidate feature.
 */

/** Candidate-facing status filter for the quiz list. */
export const candidateQuizListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  /** Filter by candidate-facing category. */
  filter: z.enum(['upcoming', 'live', 'completed', 'all']).default('all'),
  /** Filter by quiz kind — 'homework' for the Homework section. */
  kind: z.enum(['quiz', 'homework']).optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['title', 'status', 'startTime', 'endTime', 'createdAt']).default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CandidateQuizListQuery = z.infer<typeof candidateQuizListQuerySchema>;
