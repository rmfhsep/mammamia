import { NextResponse, type NextRequest } from "next/server";
import { ingestAllSources } from "@/modules/ingest/ingest.service";

/**
 * Vercel Cron이 주기적으로 호출하는 엔드포인트 (vercel.json의 crons 설정 참고).
 * Vercel Cron 요청에는 CRON_SECRET이 자동으로 Authorization 헤더에 실려온다.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const results = await ingestAllSources();
  return NextResponse.json({ results });
}

export const maxDuration = 60;
