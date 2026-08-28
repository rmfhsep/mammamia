import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 앱인토스 콘솔에 실제로 등록한 앱 slug와 반드시 일치해야 합니다.
  appName: 'ainews',
  brand: {
    primaryColor: '#3182F6',
  },
  permissions: [],
  webBundleDir: 'dist',
});
