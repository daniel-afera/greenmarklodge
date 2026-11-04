import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a production build (`npm run build` first).
 *   npm run test:e2e
 * Needs Supabase env (.env); global setup creates a temporary staff account
 * and teardown deletes it.
 */
const PORT = Number(process.env.E2E_PORT ?? 3300);

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1, // tests share content rows in the real database
  reporter: [["list"]],
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    // More libuv threads: image resizing (sharp) shares Node's pool with the DNS
    // lookups for Supabase calls; with the default 4, saves stall behind thumbnails.
    env: { UV_THREADPOOL_SIZE: "16" },
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
