import * as articleRepository from "./article.repository";
import type { ListArticlesQuery } from "./article.schema";

export async function listArticles(query: ListArticlesQuery) {
  const articles = await articleRepository.findArticles(query.category);
  return articles.map((a) => ({
    id: a.id,
    sourceName: a.sourceName,
    sourceType: a.sourceType,
    category: a.category,
    title: a.title,
    summary: a.summary,
    originalUrl: a.originalUrl,
    publishedAt: a.publishedAt,
  }));
}
