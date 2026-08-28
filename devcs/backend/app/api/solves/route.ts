import { NextResponse, type NextRequest } from "next/server";
import { listSolvesQuerySchema, submitSolveSchema } from "@/modules/solves/solve.schema";
import * as solveService from "@/modules/solves/solve.service";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = listSolvesQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const solves = await solveService.listSolves(parsed.data.deviceId);
  return NextResponse.json({ solves });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = submitSolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await solveService.submitSolve(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof solveService.QuestionNotFoundError) {
      return NextResponse.json({ error: "QUESTION_NOT_FOUND" }, { status: 404 });
    }
    throw err;
  }
}
