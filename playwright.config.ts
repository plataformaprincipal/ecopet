import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.WEB_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer:
    process.env.CI || process.env.WEB_URL
      ? undefined
      : {
          command: "npm run dev -w @ecopet/web",
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
});
