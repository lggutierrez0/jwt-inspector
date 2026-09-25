import { defineConfig } from '@playwright/test';

// E2E runs against the production build in .output/chrome-mv3 (`pnpm test:e2e` builds first).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] === undefined ? 0 : 2,
  reporter: process.env['CI'] === undefined ? 'list' : [['github'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
  },
});
