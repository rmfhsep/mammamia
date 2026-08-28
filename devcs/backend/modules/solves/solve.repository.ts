import { prisma } from "@/lib/db";

/** Prisma를 직접 다루는 유일한 지점입니다. service/route에서 prisma.solve.*를 직접 호출하지 마세요. */
export function upsertSolve(data: {
  deviceId: string;
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
}) {
  return prisma.solve.upsert({
    where: { deviceId_questionId: { deviceId: data.deviceId, questionId: data.questionId } },
    create: data,
    update: { selectedIndex: data.selectedIndex, isCorrect: data.isCorrect },
  });
}

export function findSolvesByDevice(deviceId: string) {
  return prisma.solve.findMany({
    where: { deviceId },
    include: { question: true },
    orderBy: { solvedAt: "desc" },
  });
}
