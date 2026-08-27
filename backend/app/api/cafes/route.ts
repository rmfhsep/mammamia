import { NextResponse, type NextRequest } from "next/server";
import { createCafeSchema, nearbyCafesQuerySchema } from "@/modules/cafes/cafe.schema";
import * as cafeService from "@/modules/cafes/cafe.service";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = nearbyCafesQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cafes = await cafeService.getNearbyCafes(parsed.data);
  return NextResponse.json({ cafes });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createCafeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cafe = await cafeService.registerCafe(parsed.data);
  return NextResponse.json({ cafe }, { status: 201 });
}
