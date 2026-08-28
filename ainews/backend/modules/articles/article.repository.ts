import { prisma } from "@/lib/db";
import type { ArticleCategory, Prisma } from "@prisma/client";

/** Prisma를 직접 다루는 유일한 지점입니다. service/route에서 prisma.article.*를 직접 호출하지 마세요. */
export function findArticles(category?: ArticleCategory) {
  return prisma.article.findMany({
    where: category ? { category } : undefined,
    orderBy: { publishedAt: "desc" },
    take: 100,
  });
}

export function findArticleByUrl(originalUrl: string) {
  return prisma.article.findUnique({ where: { originalUrl } });
}

export function createArticle(data: Prisma.ArticleCreateInput) {
  return prisma.article.create({ data });
}
