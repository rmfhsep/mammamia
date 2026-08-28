import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Prisma를 직접 다루는 유일한 지점입니다. service/route에서 prisma.cafe.*를 직접 호출하지 마세요. */
export function findCafesInBoundingBox(bounds: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}) {
  return prisma.cafe.findMany({
    where: {
      lat: { gte: bounds.minLat, lte: bounds.maxLat },
      lng: { gte: bounds.minLng, lte: bounds.maxLng },
    },
  });
}

export function findCafeByKakaoPlaceId(kakaoPlaceId: string) {
  return prisma.cafe.findUnique({ where: { kakaoPlaceId } });
}

export function createCafe(data: Prisma.CafeCreateInput) {
  return prisma.cafe.create({ data });
}
