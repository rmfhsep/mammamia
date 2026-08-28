import { NextResponse, type NextRequest } from "next/server";
import { listArticlesQuerySchema } from "@/modules/articles/article.schema";
import * as articleService from "@/modules/articles/article.service";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = listArticlesQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const articles = await articleService.listArticles(parsed.data);
  return NextResponse.json({ articles });
}
