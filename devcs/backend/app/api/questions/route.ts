import { NextResponse, type NextRequest } from "next/server";
import { listQuestionsQuerySchema } from "@/modules/questions/question.schema";
import * as questionService from "@/modules/questions/question.service";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = listQuestionsQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const questions = await questionService.listQuestions(parsed.data);
  return NextResponse.json({ questions });
}
