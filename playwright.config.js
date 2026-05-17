import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    storageState: './tests/auth-state.json',
    screenshot: 'off',
    trace: 'on-first-retry',
  },
  globalSetup: './tests/global-setup.js',
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npx next start --port 3000',
    url: 'http://localhost:3000/login',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
