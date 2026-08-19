import { test, expect } from "@playwright/test";

const THEMES = ["light", "dark", "black"] as const;

async function setTheme(page: import("@playwright/test").Page, theme: (typeof THEMES)[number]) {
  await page.addInitScript((value) => {
    localStorage.setItem("ecopet-theme", value);
  }, theme);
}

test.describe("EccoPet AI workspace", () => {
  test("guest hero and capability cards at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/eccopet");
    await expect(
      page.getByRole("heading", { name: /o que você quer resolver hoje|what do you want to solve today/i })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /eccopet concierge/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /lost pet agent/i })).toBeVisible();
    await expect(page.locator("textarea#ai-prompt-input")).toBeVisible();
  });

  test("Lost Pet workspace at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/eccopet?capability=lost_pet");
    await expect(page.getByRole("heading", { name: /plano de busca|search plan/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator("textarea#ai-prompt-input")).toBeVisible();
  });

  test("deep link opens travel workspace", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/eccopet?capability=travel_agent");
    await expect(
      page.getByRole("heading", { name: /planejamento de viagem|trip planning/i })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/checklist/i).first()).toBeVisible();
  });

  test("deep link opens content studio", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/eccopet?capability=content-studio");
    await expect(page.getByRole("heading", { name: /estúdio de conteúdo|content studio/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: /gerar|generate/i })).toBeVisible();
  });

  for (const theme of THEMES) {
    test(`theme ${theme} has no large white surface on /eccopet`, async ({ page }) => {
      await setTheme(page, theme);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/eccopet");
      await expect(
        page.getByRole("heading", { name: /o que você quer resolver hoje|what do you want to solve today/i })
      ).toBeVisible({ timeout: 20_000 });
      if (theme === "black" || theme === "dark") {
        const bg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(bg).not.toBe("rgb(255, 255, 255)");
      }
    });
  }
});
