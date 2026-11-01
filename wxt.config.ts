import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Simple New Tab',
    description: 'A simple new tab page for Chromium.',
    minimum_chrome_version: '104',
  },
});
