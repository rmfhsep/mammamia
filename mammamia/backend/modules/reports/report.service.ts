import * as reportRepository from "./report.repository";
import type { CreateReportInput } from "./report.schema";

export async function submitReport(input: CreateReportInput) {
  return reportRepository.createReport({
    cafe: { connect: { id: input.cafeId } },
    hasNursingRoom: input.hasNursingRoom,
    hasDiaperTable: input.hasDiaperTable,
    note: input.note,
  });
}
