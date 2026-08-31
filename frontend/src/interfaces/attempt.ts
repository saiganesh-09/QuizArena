import type { AnswerSelection, AttemptQuestion } from '@/types/quiz';

/**
 * UI-facing interfaces for the quiz attempt feature.
 */

/** Visual status of a question in the navigator. */
export type QuestionNavStatus = 'not-visited' | 'visited' | 'answered';

/** Map of questionId -> selected option IDs (the candidate's answers in progress). */
export type AnswerMap = Record<string, string[]>;

/** Map of questionId -> navigator status (visited/answered). */
export type NavStatusMap = Record<string, QuestionNavStatus>;

/** Props for the quiz attempt page state. */
export interface AttemptState {
  answers: AnswerMap;
  navStatus: NavStatusMap;
  currentIndex: number;
}

/** Convert an AnswerMap to an AnswerSelection[] for the submit payload. */
export function answersToSelections(answers: AnswerMap): AnswerSelection[] {
  return Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
    questionId,
    selectedOptionIds,
  }));
}

/** Count answered questions from an AnswerMap. */
export function countAnswered(answers: AnswerMap): number {
  return Object.values(answers).filter((ids) => ids.length > 0).length;
}

/** Build the initial nav status map from the questions list. */
export function buildInitialNavStatus(questions: AttemptQuestion[]): NavStatusMap {
  const map: NavStatusMap = {};
  for (const q of questions) {
    map[q.id] = 'not-visited';
  }
  return map;
}
