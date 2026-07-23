// T13 Playwright config: drives tests/island.spec.ts against a manually
// started `astro preview` server (see tests/run-t13.sh). No webServer block —
// the script owns the server lifecycle so it can install fixtures and build
// first. Separate config so the T9 facade suite keeps its own testMatch.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'island.spec.ts',
  timeout: 30_000,
  use: {
    baseURL: process.env.T13_BASE_URL ?? 'http://localhost:44322',
  },
});
