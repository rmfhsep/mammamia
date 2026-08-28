import { NextResponse, type NextRequest } from "next/server";
import { createReportSchema } from "@/modules/reports/report.schema";
import * as reportService from "@/modules/reports/report.service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const report = await reportService.submitReport(parsed.data);
  return NextResponse.json({ report }, { status: 201 });
}
