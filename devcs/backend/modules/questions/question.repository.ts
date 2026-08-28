import { prisma } from "@/lib/db";
import type { QuestionCategory } from "@prisma/client";

/** Prisma를 직접 다루는 유일한 지점입니다. service/route에서 prisma.question.*를 직접 호출하지 마세요. */
export function findQuestions(category?: QuestionCategory) {
  return prisma.question.findMany({
    where: category ? { category } : undefined,
    orderBy: { slug: "asc" },
  });
}

export function findQuestionById(id: string) {
  return prisma.question.findUnique({ where: { id } });
}
