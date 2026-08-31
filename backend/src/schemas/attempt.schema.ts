import { z } from 'zod';

/**
 * Zod validation schema for the quiz submit endpoint.
 *
 * Each answer selection must have a questionId and an array of
 * selectedOptionIds. Empty arrays are allowed (unanswered questions
 * score zero).
 */
export const submitAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1, 'questionId is required'),
        selectedOptionIds: z.array(z.string().min(1)).default([]),
      }),
    )
    .default([]),
});

export type SubmitAnswersInput = z.infer<typeof submitAnswersSchema>;
