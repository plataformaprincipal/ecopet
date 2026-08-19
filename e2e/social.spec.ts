import { test, expect } from "@playwright/test";

const THEMES = ["light", "dark", "black"] as const;

async function setTheme(page: import("@playwright/test").Page, theme: (typeof THEMES)[number]) {
  await page.addInitScript((value) => {
    localStorage.setItem("ecopet-theme", value);
  }, theme);
}

test.describe("Fase 5 — Social", () => {
  test("feed desktop carrega hub", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/social");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: /entre para publicar|entrar para publicar|sign in to post|inicia sesión para publicar/i,
      })
    ).toBeVisible({
      timeout: 20_000,
    });
  });

  test("feed 390px usa navegação compacta", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/social");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("button", { name: /feed/i }).first()).toBeVisible({ timeout: 20_000 });
  });

  test("tendências reais na rail ou página dedicada", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/social/tendencias");
    await expect(page.getByRole("heading", { name: /tendências para você|trends for you|tendencias para ti/i })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("mensagens não inventam presença", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard/messages");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/online agora|digitando|visto agora/i)).toHaveCount(0);
  });

  for (const theme of THEMES) {
    test(`tema ${theme} no feed não deixa body branco em dark/black`, async ({ page }) => {
      await setTheme(page, theme);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/social");
      await expect(page.locator("body")).toBeVisible({ timeout: 20_000 });
      if (theme === "black" || theme === "dark") {
        const bg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(bg).not.toBe("rgb(255, 255, 255)");
      }
    });
  }
});
