import { SOURCES } from "../../data/sources";
import * as articleRepository from "../articles/article.repository";
import { fetchFeed } from "./rss";
import { summarizeInKorean } from "./summarize";

export type IngestResult = {
  sourceId: string;
  fetched: number;
  created: number;
  errors: string[];
};

export async function ingestAllSources(): Promise<IngestResult[]> {
  const results: IngestResult[] = [];
  for (const source of SOURCES) {
    results.push(await ingestSource(source));
  }
  return results;
}

async function ingestSource(source: (typeof SOURCES)[number]): Promise<IngestResult> {
  const result: IngestResult = { sourceId: source.id, fetched: 0, created: 0, errors: [] };

  let items;
  try {
    items = await fetchFeed(source.rssUrl);
  } catch (err) {
    result.errors.push(`feed fetch failed: ${(err as Error).message}`);
    return result;
  }
  result.fetched = items.length;

  // 최신 글 위주로 처리 부담을 제한한다 (해외 소스는 건당 Claude 호출이 들어가서 특히).
  const recentItems = items.slice(0, 10);

  for (const item of recentItems) {
    const existing = await articleRepository.findArticleByUrl(item.link);
    if (existing) continue;

    try {
      const { title, summary } =
        source.kind === "FOREIGN"
          ? await summarizeInKorean({
              sourceName: source.name,
              originalTitle: item.title,
              rawContent: item.rawContent,
            })
          : { title: item.title, summary: item.rawContent.slice(0, 300) };

      await articleRepository.createArticle({
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.kind,
        category: source.category,
        title,
        summary,
        originalUrl: item.link,
        publishedAt: item.publishedAt,
      });
      result.created += 1;
    } catch (err) {
      result.errors.push(`${item.link}: ${(err as Error).message}`);
    }
  }

  return result;
}
