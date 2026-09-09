export const queryKeys = {
  articles: (category?: string) => ['articles', category ?? 'all'] as const,
  bannerAd: ['bannerAd'] as const,
};
