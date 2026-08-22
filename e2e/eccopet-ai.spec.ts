import { test, expect } from "@playwright/test";

const THEMES = ["light", "dark"] as const;

async function setTheme(page: import("@playwright/test").Page, theme: (typeof THEMES)[number]) {
  await page.addInitScript((value) => {
    localStorage.setItem("ecopet-theme", value);
  }, theme);
}

test.describe("EccoPet AI hub", () => {
  test("guest landing at 390px shows health ecosystem", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/eccopet");
    await expect(
      page.getByRole("heading", { name: /inteligência para cuidar melhor do seu pet/i })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("EccoPet AI").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /explorar ferramentas/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /usar agora/i }).first()).toBeVisible();
    await expect(page.getByText(/^grátis$/i).first()).toBeVisible();
    await expect(page.getByText(/eccovet ai/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/eccovet vision/i).first()).toBeVisible();
    await expect(page.getByText(/eccovet exames/i).first()).toBeVisible();
    await expect(page.getByText(/eccocheckup ai/i).first()).toBeVisible();
  });

  test("product page EccoVet is public", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/eccopet/vet");
    await expect(page.getByRole("heading", { name: /eccovet ai/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /usar agora/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /adicionar ao carrinho/i })).toHaveCount(0);
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
        page.getByRole("heading", { name: /inteligência para cuidar melhor do seu pet/i })
      ).toBeVisible({ timeout: 20_000 });
      if (theme === "dark") {
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

  test("/eccopet/checkout redireciona no FREE_BETA", async ({ page }) => {
    await page.goto("/eccopet/checkout");
    await expect(page).toHaveURL(/\/eccopet$/);
  });

  test("/ia redireciona para EccoPet AI", async ({ page }) => {
    await page.goto("/ia");
    await expect(page).toHaveURL(/\/eccopet/);
    await expect(page.getByText("EccoPet AI").first()).toBeVisible({ timeout: 20_000 });
  });

  test("preferência black antiga não quebra o dark", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("ecopet-theme", "black"));
    await page.goto("/eccopet");
    await expect(
      page.getByRole("heading", { name: /inteligência para cuidar melhor do seu pet/i })
    ).toBeVisible({ timeout: 20_000 });
    const bg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe("rgb(255, 255, 255)");
  });
});
