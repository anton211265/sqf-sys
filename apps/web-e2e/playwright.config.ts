import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load test credentials and config from apps/web-e2e/.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Prerequisites before running:
 *   docker compose up          (nginx + all 5 backend services + postgres + kafka)
 *   npx nx serve web           (Vite dev server on localhost:3001)
 */
export default defineConfig({
  testDir: './src',
  fullyParallel: false, // run sequentially — tests share real DB state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: '../../dist/playwright/web-e2e', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Real API calls need more time than mocked ones
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
