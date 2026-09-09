import { prisma } from "@/lib/db";

const SINGLETON_ID = "banner";

/** Prisma를 직접 다루는 유일한 지점입니다. service/route에서 prisma.adConfig.*를 직접 호출하지 마세요. */
export function getAdConfig() {
  return prisma.adConfig.findUnique({ where: { id: SINGLETON_ID } });
}

export function setBannerAdGroupId(bannerAdGroupId: string) {
  return prisma.adConfig.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, bannerAdGroupId },
    update: { bannerAdGroupId },
  });
}
