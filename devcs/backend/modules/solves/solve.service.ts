import * as questionRepository from "../questions/question.repository";
import * as solveRepository from "./solve.repository";
import type { SubmitSolveInput } from "./solve.schema";

export class QuestionNotFoundError extends Error {}

export async function submitSolve(input: SubmitSolveInput) {
  const question = await questionRepository.findQuestionById(input.questionId);
  if (!question) {
    throw new QuestionNotFoundError(input.questionId);
  }

  const isCorrect = input.selectedIndex === question.answerIndex;
  await solveRepository.upsertSolve({
    deviceId: input.deviceId,
    questionId: input.questionId,
    selectedIndex: input.selectedIndex,
    isCorrect,
  });

  return {
    isCorrect,
    answerIndex: question.answerIndex,
    explanation: question.explanation,
  };
}

export async function listSolves(deviceId: string) {
  const solves = await solveRepository.findSolvesByDevice(deviceId);
  return solves.map((solve) => ({
    questionId: solve.questionId,
    selectedIndex: solve.selectedIndex,
    isCorrect: solve.isCorrect,
    answerIndex: solve.question.answerIndex,
    explanation: solve.question.explanation,
    solvedAt: solve.solvedAt,
  }));
}
