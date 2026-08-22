import { test, expect } from "@playwright/test";

const THEMES = ["light", "dark"] as const;

async function isolateBrowser(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    try {
      localStorage.setItem("ecopet.analytics.consent.choice.v1", "1");
      localStorage.setItem(
        "ecopet.analytics.consent.v1",
        JSON.stringify({
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        })
      );
      localStorage.setItem("ecopet-locale-detected", "1");
      localStorage.setItem(
        "ecopet-a11y-v2",
        JSON.stringify({ state: { locale: "pt-BR" }, version: 0 })
      );
    } catch {
      /* ignore */
    }
  });
}

async function setTheme(page: import("@playwright/test").Page, theme: (typeof THEMES)[number]) {
  await page.addInitScript((value) => {
    localStorage.setItem("ecopet-theme", value);
  }, theme);
}

async function openCatalog(page: import("@playwright/test").Page, path = "/marketplace") {
  await page.goto(path);
  await expect(page.getByTestId("marketplace-search")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("tablist")).toBeVisible();
  await expect(page.getByText(/\d+\s+result/i).first()).toBeVisible({ timeout: 20_000 });
}

test.describe("Fase 6 — Marketplace", () => {
  test.use({
    storageState: { cookies: [], origins: [] },
    permissions: [],
  });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await isolateBrowser(page);
  });

  test("guest carrega o marketplace", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openCatalog(page);
    await expect(page.locator("body")).toBeVisible();
  });

  test("busca textual atualiza a URL", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openCatalog(page);
    const input = page.getByTestId("marketplace-search");
    await input.click();
    await input.fill("");
    await input.pressSequentially("racao", { delay: 30 });
    await input.press("Enter");
    await expect(page).toHaveURL(/[?&]q=/, { timeout: 8_000 });
  });

  test("filtro de produto altera a query", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openCatalog(page);
    await page.getByRole("tab", { name: /produtos|products/i }).click();
    await expect(page).toHaveURL(/type=product/, { timeout: 8_000 });
  });

  test("verifiedOnly chega na URL", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openCatalog(page, "/marketplace?type=product");
    const checkbox = page.locator("aside").getByTestId("marketplace-filter-verified");
    await expect(checkbox).toBeVisible({ timeout: 20_000 });
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await page.locator("aside").getByTestId("marketplace-apply-filters").click();
    await expect(page).toHaveURL(/verifiedOnly=true/, { timeout: 8_000 });
  });

  test("faixa de preço na URL", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openCatalog(page, "/marketplace?type=product&minPrice=10&maxPrice=100");
    await expect(page).toHaveURL(/minPrice=10/);
    await expect(page).toHaveURL(/maxPrice=100/);
    await expect(page.getByText(/até r\$ 100|up to 100|hasta 100/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("sort de relevância visível e near me pede localização", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openCatalog(page);
    await expect(page.locator("#mp-sort")).toHaveValue("relevance");
    await page.getByTestId("marketplace-near-me").click();
    const dialog = page.getByTestId("marketplace-location-dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByRole("heading", { name: /opções perto|options near you|opciones cerca/i })).toBeVisible();
    await dialog.getByRole("button", { name: /agora não|not now|ahora no/i }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("localização negada oferece fallback manual", async ({ page, context }) => {
    await context.clearPermissions();
    await page.setViewportSize({ width: 1280, height: 800 });
    await openCatalog(page);
    await expect(page.locator("#mp-sort")).toBeVisible();
    await page.getByTestId("marketplace-near-me").click();
    const prompt = page.getByTestId("marketplace-location-dialog");
    await expect(prompt).toBeVisible({ timeout: 10_000 });
    await prompt.getByTestId("marketplace-enter-manually").click({ force: true });
    const manual = page.getByTestId("marketplace-manual-location");
    await expect(manual).toBeVisible({ timeout: 10_000 });
    await expect(manual.locator("#mp-cep")).toBeVisible();
    await expect(manual.locator("#mp-city")).toBeVisible();
  });

  test("mobile 390px abre bottom sheet de filtros", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openCatalog(page);
    await expect(page.getByTestId("marketplace-open-filters")).toBeVisible();
    await page.getByTestId("marketplace-open-filters").click();
    const sheet = page.getByTestId("marketplace-filters-sheet");
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    await expect(sheet.getByRole("heading", { name: /filters|filtros/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  });

  test("320 e 430 não quebram o catálogo", async ({ page }) => {
    for (const width of [320, 430]) {
      await page.setViewportSize({ width, height: 720 });
      await openCatalog(page);
    }
  });

  for (const theme of THEMES) {
    test(`tema ${theme} no marketplace`, async ({ page }) => {
      await setTheme(page, theme);
      await page.setViewportSize({ width: 1280, height: 800 });
      await openCatalog(page);
      await expect(page.locator("body")).toBeVisible({ timeout: 20_000 });
      if (theme === "dark") {
        const bg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(bg).not.toBe("rgb(255, 255, 255)");
      }
    });
  }

  test("API verifiedOnly=true não devolve seller não verificado", async ({ request }) => {
    const res = await request.get("/api/marketplace/products?verifiedOnly=true&pageSize=20");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const products = json.data?.products ?? [];
    for (const p of products) {
      expect(p.isVerified).toBe(true);
    }
  });

  test("guest abre detalhe sem login", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openCatalog(page, "/marketplace?type=product");
    const card = page.getByTestId("marketplace-product-detail").first();
    await expect(card).toBeVisible({ timeout: 20_000 });
    const href = await card.getAttribute("href");
    expect(href).toMatch(/\/marketplace\/produto\/.+/);
    await page.goto(href!);
    await expect(page).toHaveURL(/\/marketplace\/produto\//);
    await expect(page.locator("body")).toBeVisible();
  });
});
