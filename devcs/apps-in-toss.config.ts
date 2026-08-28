import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 앱인토스 콘솔에 실제로 등록한 앱 slug와 반드시 일치해야 합니다.
  // "토스개발자가되"라는 이름은 상표권 검토가 끝나기 전까지 채널톡 확답을 받고 확정하세요 (devcs/CLAUDE.md 참고).
  appName: 'devcs',
  brand: {
    primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
  },
  permissions: [],
  webBundleDir: 'dist',
});
