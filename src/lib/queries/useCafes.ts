import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { queryKeys } from './keys';

export type Cafe = {
  id: string;
  name: string;
  address: string;
  roadAddress?: string | null;
  lat: number;
  lng: number;
  hasNursingRoom: boolean;
  hasDiaperTable: boolean;
  facilityNote?: string | null;
  distanceKm: number;
};

type NearbyCafesParams = { lat: number; lng: number; radiusKm?: number };

export function useNearbyCafes(params: NearbyCafesParams | null) {
  return useQuery({
    queryKey: params
      ? queryKeys.nearbyCafes(params.lat, params.lng, params.radiusKm ?? 2)
      : (['cafes', 'nearby', 'disabled'] as const),
    queryFn: () =>
      apiFetch<{ cafes: Cafe[] }>(
        `/api/cafes?lat=${params!.lat}&lng=${params!.lng}&radiusKm=${params!.radiusKm ?? 2}`,
      ).then((res) => res.cafes),
    enabled: params !== null,
  });
}
