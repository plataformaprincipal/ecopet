/**
 * E2E interno Google Auth — não clica no Google real.
 * REAL_GOOGLE_SMOKE_NOT_RUN até o redirect URI existir no Google Cloud.
 */
import { test, expect } from "@playwright/test";

test.describe("Google Auth internal", () => {
  test("login shows Google and no Facebook/Apple auth", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /facebook/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /apple/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /em breve|coming soon|próximamente/i })).toHaveCount(0);
  });

  test("cadastro shows Google without Facebook/Apple", async ({ page }) => {
    await page.goto("/cadastro");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /facebook/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /apple/i })).toHaveCount(0);
  });

  test("callback without code lands on login with invalid_state", async ({ page }) => {
    await page.goto("/api/auth/google/callback");
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/google=invalid_state/i);
  });

  test("callback access_denied maps to cancelled", async ({ page }) => {
    await page.goto("/api/auth/google/callback?error=access_denied");
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/google=(cancelled|access_denied)/i);
  });

  test("start with unsafe returnTo never leaves the origin", async ({ page }) => {
    await page.goto("/api/auth/google?returnTo=https://evil.example");
    expect(page.url()).toMatch(/^http:\/\/(localhost|127\.0\.0\.1)/);
    expect(page.url()).not.toContain("evil.example");
  });

  test("mobile 390 login Google tap target", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    const btn = page.getByRole("button", { name: /google/i });
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
