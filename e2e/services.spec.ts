import { test, expect } from "@playwright/test";
import { registerClient, TEST_PASSWORD } from "./helpers/acceptance";

const THEMES = ["light", "dark", "black"] as const;

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

async function openServices(page: import("@playwright/test").Page, path = "/marketplace/servicos") {
  await page.goto(path);
  await expect(page.getByTestId("services-discovery")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("marketplace-search")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/\d+\s+result/i).first()).toBeVisible({ timeout: 20_000 });
}

test.describe("FASE 7 — Serviços", () => {
  test.use({
    storageState: { cookies: [], origins: [] },
    permissions: [],
  });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await isolateBrowser(page);
  });

  test("guest carrega categorias, pet e catálogo", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openServices(page);
    await expect(page.getByTestId("services-vertical-health")).toBeVisible();
    await expect(page.getByTestId("services-vertical-care")).toBeVisible();
    await expect(page.getByTestId("services-vertical-routine")).toBeVisible();
    await expect(page.getByTestId("services-vertical-mobility")).toBeVisible();
    await expect(page.getByTestId("services-pet-guest")).toBeVisible();
    await expect(page.getByTestId("services-rail-near")).toBeVisible();
  });

  test("vertical saúde altera a query do catálogo", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openServices(page);
    await page.getByTestId("services-vertical-health").click();
    await expect(page).toHaveURL(/group=health/, { timeout: 8_000 });
  });

  test("adoção aponta para fluxos reais", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openServices(page);
    const adoption = page.getByTestId("services-vertical-adoption");
    await expect(adoption.first()).toBeVisible();
    await expect(adoption.first()).toHaveAttribute("href", /\/adocao|\/ngos/);
  });

  test("memória mostra empty state honesto", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openServices(page);
    await page.getByTestId("services-vertical-memory").click();
    await expect(page).toHaveURL(/group=memory/, { timeout: 8_000 });
    await expect(page.getByTestId("services-memory-empty")).toBeVisible();
  });

  test("filtro de localização reutiliza o diálogo do Marketplace", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openServices(page);
    await page.getByTestId("services-rail-near").click();
    const dialog = page.getByTestId("marketplace-location-dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole("button", { name: /agora não|not now|ahora no/i }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("rails de parceiro, domicílio e atendimento hoje entram na URL", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openServices(page);
    await page.getByTestId("services-rail-verified").click();
    await expect(page).toHaveURL(/verifiedOnly=true/, { timeout: 8_000 });
    await page.getByTestId("services-rail-home").click();
    await expect(page).toHaveURL(/homeService=true/, { timeout: 8_000 });
    await page.getByTestId("services-rail-openToday").click();
    await expect(page).toHaveURL(/openToday=true/, { timeout: 8_000 });
  });

  test("custo-benefício e teleorientação usam o query model", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openServices(page);
    await page.getByTestId("services-rail-value").click();
    await expect(page).toHaveURL(/sort=value/, { timeout: 8_000 });
    await page.getByTestId("services-chip-telehealth").click();
    await expect(page).toHaveURL(/telehealth=true/, { timeout: 8_000 });
  });

  test("guest precisa autenticar para agendar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openServices(page);
    const schedule = page.getByTestId("marketplace-service-schedule").first();
    const empty = page.getByText(/não encontramos opções|no options|no encontramos/i);
    await expect(schedule.or(empty).first()).toBeVisible({ timeout: 20_000 });
    if (await schedule.count()) {
      await schedule.click();
      await expect(page.getByRole("dialog").getByRole("heading", { name: /entre ou crie|sign in|inicia sesión|crea tu cuenta/i })).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("guest abre detalhe de serviço sem login", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openServices(page);
    const card = page.getByTestId("marketplace-service-detail").first();
    if (!(await card.count())) {
      test.info().annotations.push({ type: "note", description: "Catálogo de serviços vazio neste ambiente." });
      return;
    }
    const href = await card.getAttribute("href");
    expect(href).toMatch(/\/marketplace\/servico\/.+/);
    await page.goto(href!);
    await expect(page).toHaveURL(/\/marketplace\/servico\//);
    await expect(page.locator("body")).toBeVisible();
  });

  test("empty state com busca sem resultado", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openServices(page, "/marketplace/servicos?q=zzzzservicoinexistente999");
    await expect(page.getByText(/não encontramos opções|no options|no encontramos/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("mobile 390px mantém descoberta e filtros", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openServices(page);
    await expect(page.getByTestId("services-discovery")).toBeVisible();
    await expect(page.getByTestId("marketplace-open-filters")).toBeVisible();
    await page.getByTestId("marketplace-open-filters").click();
    const sheet = page.getByTestId("marketplace-filters-sheet");
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    await expect(sheet.getByTestId("marketplace-filter-opentoday")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  });

  test("320 e 430 não quebram serviços", async ({ page }) => {
    for (const width of [320, 430]) {
      await page.setViewportSize({ width, height: 720 });
      await openServices(page);
    }
  });

  for (const theme of THEMES) {
    test(`tema ${theme} em serviços`, async ({ page }) => {
      await setTheme(page, theme);
      await page.setViewportSize({ width: 1280, height: 800 });
      await openServices(page);
      await expect(page.locator("body")).toBeVisible({ timeout: 20_000 });
      if (theme === "black" || theme === "dark") {
        const bg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(bg).not.toBe("rgb(255, 255, 255)");
      }
    });
  }

  test("API openToday e verifiedOnly não inventam vaga", async ({ request }) => {
    const res = await request.get("/api/marketplace/services?verifiedOnly=true&pageSize=20");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const services = json.data?.services ?? [];
    for (const s of services) {
      expect(s.isVerified).toBe(true);
    }
    const today = await request.get("/api/marketplace/services?openToday=true&pageSize=20");
    expect(today.ok()).toBeTruthy();
  });
});

test.describe("FASE 7 — Serviços autenticado", () => {
  test("tutor vê recomendação para o pet real", async ({ page, request, context }) => {
    const { res, email } = await registerClient(request);
    expect(res.ok(), await res.text()).toBeTruthy();
    await isolateBrowser(page);
    const login = await context.request.post("/api/auth/login", {
      data: { email, password: TEST_PASSWORD, identifier: email },
    });
    expect(login.ok()).toBeTruthy();
    const petRes = await context.request.post("/api/client/pets", {
      data: { name: "Luna", species: "DOG" },
    });
    expect(petRes.ok(), await petRes.text()).toBeTruthy();
    await page.goto("/marketplace/servicos");
    await expect(page.getByTestId("services-discovery")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/para luna/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("services-pet-guest")).toHaveCount(0);
  });
});
