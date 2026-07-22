// T9 Playwright config: drives tests/facade.spec.ts against a manually
// started `astro preview` server (see tests/run-t9.sh). No webServer block —
// the script owns the server lifecycle so it can install fixtures and build
// first.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'facade.spec.ts',
  timeout: 30_000,
  use: {
    baseURL: process.env.T9_BASE_URL ?? 'http://localhost:44321',
  },
});
