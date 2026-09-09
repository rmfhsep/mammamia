import * as configRepository from "./config.repository";

// 실제 광고 그룹 ID를 발급받아 DB에 저장하기 전까지 쓰는 개발용 테스트 배너 ID.
const DEFAULT_TEST_AD_GROUP_ID = "ait-ad-test-banner-id";

export async function getBannerAdGroupId(): Promise<string> {
  const config = await configRepository.getAdConfig();
  return config?.bannerAdGroupId ?? DEFAULT_TEST_AD_GROUP_ID;
}

export function setBannerAdGroupId(bannerAdGroupId: string) {
  return configRepository.setBannerAdGroupId(bannerAdGroupId);
}
