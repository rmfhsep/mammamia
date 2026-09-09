import { useState } from "react";
import { openURL } from "@apps-in-toss/web-framework";
import { BannerAd } from "../components/BannerAd";
import {
  useArticles,
  type Article,
  type ArticleCategory,
} from "../lib/queries/useArticles";
import { useBannerAdGroupId } from "../lib/queries/useBannerAd";
import "./ArticleListScreen.css";

const CATEGORY_LABEL: Record<ArticleCategory, string> = {
  AI: "AI",
  DEV: "개발",
  DATA: "데이터",
  DESIGN: "디자인",
  MARKETING: "마케팅",
};

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ArticleCategory[];

export function ArticleListScreen() {
  const [category, setCategory] = useState<ArticleCategory | null>(null);
  const articlesQuery = useArticles(category ?? undefined);
  const loading = !articlesQuery.data;
  // 광고 그룹 ID는 프론트에 안 박아두고 백엔드(DB)에서 가져온다 — 나중에 실제 ID로 바뀌어도
  // 프론트 재배포 없이 DB 값만 바꾸면 바로 반영된다 (backend/scripts/set-banner-ad.ts 참고).
  const bannerAdGroupId = useBannerAdGroupId().data;

  function handleOpen(article: Article) {
    openURL(article.originalUrl);
  }

  return (
    <div className="article-list-screen">
      <header className="article-list-header">
        <p className="article-list-greeting">오늘의 IT/AI 한입 👋</p>
        {bannerAdGroupId && (
          <div className="article-list-banner">
            <BannerAd adGroupId={bannerAdGroupId} />
          </div>
        )}

        <div className="article-list-filters">
          <button
            type="button"
            className={category === null ? "active" : ""}
            onClick={() => setCategory(null)}
          >
            전체
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={category === c ? "active" : ""}
              onClick={() => setCategory((prev) => (prev === c ? null : c))}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </header>

      {loading && (
        <p className="article-list-loading">아티클을 불러오는 중...</p>
      )}

      {!loading && articlesQuery.data?.length === 0 && (
        <p className="article-list-empty">아직 등록된 아티클이 없어요.</p>
      )}

      <div className="article-cards">
        {articlesQuery.data?.map((article) => (
          <div key={article.id}>
            <button
              type="button"
              className="article-card"
              onClick={() => handleOpen(article)}
            >
              <div className="article-card-badges">
                <span
                  className={`article-card-source ${
                    article.sourceType === "DOMESTIC" ? "domestic" : "foreign"
                  }`}
                >
                  {article.sourceName}
                </span>
                <span className="article-card-date">
                  {formatDate(article.publishedAt)}
                </span>
              </div>
              <p className="article-card-title">{article.title}</p>
              <p className="article-card-summary">{article.summary}</p>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}
