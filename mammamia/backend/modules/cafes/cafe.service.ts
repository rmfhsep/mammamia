import { boundingBoxForRadius, haversineDistanceKm } from "@/lib/geo";
import * as cafeRepository from "./cafe.repository";
import type { CreateCafeInput, NearbyCafesQuery } from "./cafe.schema";

export async function getNearbyCafes(query: NearbyCafesQuery) {
  const bounds = boundingBoxForRadius(query.lat, query.lng, query.radiusKm);
  const candidates = await cafeRepository.findCafesInBoundingBox(bounds);

  return candidates
    .map((cafe) => ({
      ...cafe,
      distanceKm: haversineDistanceKm(query.lat, query.lng, cafe.lat, cafe.lng),
    }))
    .filter((cafe) => cafe.distanceKm <= query.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function registerCafe(input: CreateCafeInput) {
  if (input.kakaoPlaceId) {
    const existing = await cafeRepository.findCafeByKakaoPlaceId(input.kakaoPlaceId);
    if (existing) return existing;
  }
  return cafeRepository.createCafe(input);
}
