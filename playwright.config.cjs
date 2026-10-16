const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser', workers: 1, timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:5173', channel: process.platform === 'win32' ? 'msedge' : undefined, headless: true },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: 'https://cineview-test.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_publishable_test_only' }
  }
});
