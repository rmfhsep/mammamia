import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Prisma를 직접 다루는 유일한 지점입니다. service/route에서 prisma.report.*를 직접 호출하지 마세요. */
export function createReport(data: Prisma.ReportCreateInput) {
  return prisma.report.create({ data });
}
