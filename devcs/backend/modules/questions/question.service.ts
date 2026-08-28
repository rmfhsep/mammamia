import * as questionRepository from "./question.repository";
import type { ListQuestionsQuery } from "./question.schema";

// 정답(answerIndex)과 해설(explanation)은 여기서 제외합니다 — 풀기 전에 노출되면 안 되므로
// /api/solves로 제출해야만 결과와 함께 확인할 수 있습니다.
export async function listQuestions(query: ListQuestionsQuery) {
  const questions = await questionRepository.findQuestions(query.category);
  return questions.map((q) => ({
    id: q.id,
    category: q.category,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
  }));
}
