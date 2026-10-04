import type { CandidateQuizFilter } from '@/types/quiz';

/**
 * UI-facing interfaces for the candidate feature.
 */

/** Query parameters for the candidate quiz list endpoint. */
export interface CandidateQuizListQuery {
  page?: number;
  limit?: number;
  filter?: CandidateQuizFilter;
  /** 'homework' lists only homework assignments. */
  kind?: 'quiz' | 'homework';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
