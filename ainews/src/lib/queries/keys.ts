export const queryKeys = {
  articles: (category?: string) => ['articles', category ?? 'all'] as const,
};
