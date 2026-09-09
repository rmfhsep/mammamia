import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { queryKeys } from './keys';

export function useBannerAdGroupId() {
  return useQuery({
    queryKey: queryKeys.bannerAd,
    queryFn: () => apiFetch<{ adGroupId: string }>('/api/config/banner-ad').then((res) => res.adGroupId),
  });
}
