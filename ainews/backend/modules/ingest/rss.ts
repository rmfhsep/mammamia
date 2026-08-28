import Parser from "rss-parser";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; ainews-bot/1.0)",
    // rss-parser의 기본 Accept는 application/rss+xml뿐이라, atom만 서빙하며 Accept 협상을
    // 엄격히 하는 서버(naver-d2 등)가 406을 준다 — 더 관대한 Accept로 덮어써야 한다.
    Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5",
  },
});

export type FeedItem = {
  title: string;
  link: string;
  publishedAt: Date;
  /** RSS의 요약/본문 필드. 국내 소스는 이 값을 그대로 쓰고, 해외 소스는 이 값을 Claude 요약의 재료로만 쓴다. */
  rawContent: string;
};

/** 스크래핑이 아니라 매체가 공식으로 제공하는 RSS/Atom 피드를 읽는다. */
export async function fetchFeed(rssUrl: string): Promise<FeedItem[]> {
  const feed = await parser.parseURL(rssUrl);

  return (feed.items ?? [])
    .filter((item) => item.link && item.title)
    .map((item) => ({
      title: item.title!.trim(),
      link: item.link!.trim(),
      publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      rawContent: stripHtml(item.contentSnippet ?? item.content ?? item.summary ?? ""),
    }));
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
