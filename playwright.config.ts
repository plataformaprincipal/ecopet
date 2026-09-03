import { defineConfig, devices } from "@playwright/test";
import { loadWebRuntimeEnv } from "./e2e/helpers/load-web-env";

loadWebRuntimeEnv();

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** E2E local por padrão. WEB_URL de produção no .env não deve sequestrar o gate. */
const explicit = (process.env.E2E_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "").trim();
const baseURL = isHttpUrl(explicit) ? new URL(explicit).origin : "http://localhost:3000";
const useRemoteServer = isHttpUrl(explicit);

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
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
    process.env.CI || useRemoteServer
      ? undefined
      : {
          command: "npm run dev -w @ecopet/web",
          url: baseURL,
          reuseExistingServer: true,
          timeout: 180_000,
        },
});
