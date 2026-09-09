import { setBannerAdGroupId } from "../modules/config/config.service";

const adGroupId = process.argv[2];
if (!adGroupId) {
  console.error("사용법: npm run set-banner-ad -- <adGroupId>");
  process.exit(1);
}

setBannerAdGroupId(adGroupId)
  .then((config) => {
    console.log("배너 광고 그룹 ID 저장 완료:", config.bannerAdGroupId);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
