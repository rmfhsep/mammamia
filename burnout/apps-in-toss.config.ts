import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'burnout',
  brand: {
    primaryColor: '#FF5722', // 화면에 노출될 앱의 기본 색상 — 불꽃 테마 오렌지
  },
  permissions: [],
  webBundleDir: 'dist',
});
