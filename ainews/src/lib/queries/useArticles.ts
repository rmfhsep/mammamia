import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { queryKeys } from './keys';

export type ArticleCategory = 'AI' | 'DEV' | 'DATA';
export type SourceType = 'DOMESTIC' | 'FOREIGN';

export type Article = {
  id: string;
  sourceName: string;
  sourceType: SourceType;
  category: ArticleCategory;
  title: string;
  summary: string;
  originalUrl: string;
  publishedAt: string;
};

export function useArticles(category?: ArticleCategory) {
  return useQuery({
    queryKey: queryKeys.articles(category),
    queryFn: () =>
      apiFetch<{ articles: Article[] }>(
        `/api/articles${category ? `?category=${category}` : ''}`,
      ).then((res) => res.articles),
  });
}
