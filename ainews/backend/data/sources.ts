export type SourceKind = "DOMESTIC" | "FOREIGN";
export type ArticleCategory = "AI" | "DEV" | "DATA";

export type SourceConfig = {
  id: string;
  name: string;
  rssUrl: string;
  kind: SourceKind;
  category: ArticleCategory;
};

/**
 * RSS 피드 목록. 여기 없는 매체를 추가하고 싶으면 이 배열에 추가하면 된다
 * (개별 매체 크롤러를 새로 짤 필요 없음 — 전부 공식 RSS/Atom 피드 기반).
 */
export const SOURCES: SourceConfig[] = [
  { id: "yozm-it", name: "요즘IT", rssUrl: "https://yozm.wishket.com/magazine/feed/", kind: "DOMESTIC", category: "DEV" },
  { id: "geeknews", name: "GeekNews", rssUrl: "https://feeds.feedburner.com/geeknews-feed", kind: "DOMESTIC", category: "DEV" },
  { id: "toss-tech", name: "토스 기술 블로그", rssUrl: "https://toss.tech/rss.xml", kind: "DOMESTIC", category: "DEV" },
  { id: "kakao-tech", name: "카카오 기술 블로그", rssUrl: "https://tech.kakao.com/feed/", kind: "DOMESTIC", category: "DEV" },
  { id: "naver-d2", name: "네이버 D2", rssUrl: "https://d2.naver.com/d2.atom", kind: "DOMESTIC", category: "DEV" },
  { id: "openai-news", name: "OpenAI", rssUrl: "https://openai.com/news/rss.xml", kind: "FOREIGN", category: "AI" },
  { id: "huggingface-blog", name: "Hugging Face", rssUrl: "https://huggingface.co/blog/feed.xml", kind: "FOREIGN", category: "AI" },
  { id: "deepmind-blog", name: "Google DeepMind", rssUrl: "https://deepmind.google/blog/rss.xml", kind: "FOREIGN", category: "AI" },
  { id: "towards-data-science", name: "Towards Data Science", rssUrl: "https://towardsdatascience.com/feed", kind: "FOREIGN", category: "DATA" },
];
