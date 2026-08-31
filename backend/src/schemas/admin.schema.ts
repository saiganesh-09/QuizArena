import { z } from 'zod';

/**
 * Zod schemas for admin list query parameters.
 * These validate req.query (URL search params) for paginated/filtered lists.
 */

const roleEnum = z.enum(['admin', 'instructor', 'candidate']);
const statusEnum = z.enum(['active', 'suspended']);

/** Allowed sortable fields for the user list. */
const userSortFields = z.enum(['name', 'email', 'role', 'status', 'createdAt', 'updatedAt']);

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  role: roleEnum.optional(),
  status: statusEnum.optional(),
  search: z.string().trim().optional(),
  sortBy: userSortFields.default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/** Allowed sortable fields for the quiz list. */
const quizSortFields = z.enum(['title', 'status', 'startTime', 'endTime', 'createdAt', 'updatedAt']);

export const listQuizzesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['draft', 'scheduled', 'live', 'completed', 'cancelled']).optional(),
  search: z.string().trim().optional(),
  sortBy: quizSortFields.default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ListQuizzesQuery = z.infer<typeof listQuizzesQuerySchema>;
