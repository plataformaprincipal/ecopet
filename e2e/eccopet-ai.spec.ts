import { test, expect } from "@playwright/test";

const THEMES = ["light", "dark", "black"] as const;

async function setTheme(page: import("@playwright/test").Page, theme: (typeof THEMES)[number]) {
  await page.addInitScript((value) => {
    localStorage.setItem("ecopet-theme", value);
  }, theme);
}

test.describe("EccoPet AI marketplace", () => {
  test("guest landing at 390px shows health ecosystem", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/eccopet");
    await expect(
      page.getByRole("heading", { name: /inteligência especializada para cuidar de quem faz parte da família/i })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: /explorar soluções/i })).toBeVisible();
    await expect(page.getByText(/eccovet ai/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/eccovet vision/i).first()).toBeVisible();
    await expect(page.getByText(/eccovet exames/i).first()).toBeVisible();
    await expect(page.getByText(/eccocheckup ai/i).first()).toBeVisible();
  });

  test("product page EccoVet is public", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/eccopet/vet");
    await expect(page.getByRole("heading", { name: /eccovet ai/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /adicionar ao carrinho/i })).toBeVisible();
  });

  test("triagem landing is public", async ({ page }) => {
    await page.goto("/eccopet/triagem");
    await expect(page.getByRole("heading", { name: /eccovet triagem/i })).toBeVisible({ timeout: 20_000 });
  });

  for (const theme of THEMES) {
    test(`theme ${theme} landing renders`, async ({ page }) => {
      await setTheme(page, theme);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/eccopet");
      await expect(
        page.getByRole("heading", { name: /inteligência especializada para cuidar de quem faz parte da família/i })
      ).toBeVisible({ timeout: 20_000 });
      if (theme === "black" || theme === "dark") {
        const bg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(bg).not.toBe("rgb(255, 255, 255)");
      }
    });
  }
});

test.describe("legacy assistant shell (internal)", () => {
  test("assistente interno ainda abre", async ({ page }) => {
    await page.goto("/eccopet/assistente");
    await expect(page.locator("body")).toBeVisible();
  });
});
