import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { queryKeys } from './keys';

export type QuestionCategory =
  | 'DATA_STRUCTURE'
  | 'ALGORITHM'
  | 'NETWORK'
  | 'OPERATING_SYSTEM'
  | 'DATABASE'
  | 'WEB'
  | 'ETC';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type Question = {
  id: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  question: string;
  options: string[];
};

export function useQuestions(category?: QuestionCategory) {
  return useQuery({
    queryKey: queryKeys.questions(category),
    queryFn: () =>
      apiFetch<{ questions: Question[] }>(
        `/api/questions${category ? `?category=${category}` : ''}`,
      ).then((res) => res.questions),
  });
}
