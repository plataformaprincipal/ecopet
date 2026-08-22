import { test, expect } from "@playwright/test";
import { TEST_PASSWORD } from "./helpers/acceptance";
import {
  clearAuthRateLimitBuckets,
  createClientUser,
  creditEccoPontos,
  disconnectRewardsPrisma,
  upsertTestReward,
} from "./helpers/rewards";

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

async function loginClient(context: import("@playwright/test").BrowserContext, email: string) {
  await clearAuthRateLimitBuckets();
  const login = await context.request.post("/api/auth/login", {
    data: { email, password: TEST_PASSWORD, identifier: email },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
}

async function openRewards(page: import("@playwright/test").Page) {
  await page.goto("/cliente/rewards");
  await expect(page.getByTestId("rewards-workspace")).toBeVisible({ timeout: 20_000 });
}

test.describe("FASE 8 — EccoPontos", () => {
  test.use({
    storageState: { cookies: [], origins: [] },
    permissions: [],
  });

  test.afterAll(async () => {
    await disconnectRewardsPrisma();
  });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await isolateBrowser(page);
  });

  test("visitante é enviado ao login", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/cliente/rewards");
    await expect(page).toHaveURL(/login/, { timeout: 20_000 });
  });

  test("carteira vazia mostra empty state", async ({ page, context }) => {
    const user = await createClientUser("rwdempty");
    await loginClient(context, user.email);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openRewards(page);
    await expect(page.getByTestId("rewards-balance")).toHaveText(/0/);
    await expect(page.getByTestId("rewards-empty")).toContainText(/ainda não ganhou pontos/i);
    await expect(page.getByText(/indicação ainda não está disponível/i)).toBeVisible();
  });

  test("com pontos mostra saldo e histórico humano", async ({ page, context }) => {
    const user = await createClientUser("rwdhist");
    await creditEccoPontos(user.id, 80, "Compra #1001");
    await loginClient(context, user.email);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openRewards(page);
    await expect(page.getByTestId("rewards-balance")).toContainText("80");
    await expect(page.getByTestId("rewards-history")).toContainText("Compra #1001");
    await expect(page.getByTestId("rewards-history")).not.toContainText(/ORDER_COMPLETED/);
  });

  test("resgate suficiente gera cupom e debita", async ({ page, context }) => {
    const user = await createClientUser("rwdredeem");
    await creditEccoPontos(user.id, 150, "Compra #1002");
    await upsertTestReward({ code: "ECCOPONTOS10", title: "10% de desconto", pointsCost: 100 });
    await loginClient(context, user.email);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openRewards(page);
    await page.getByTestId("rewards-redeem-ECCOPONTOS10").click();
    await expect(page.getByTestId("rewards-confirm")).toBeVisible();
    await page.getByTestId("rewards-confirm-submit").click();
    await expect(page.getByTestId("rewards-message")).toContainText(/cupom:/i, { timeout: 15_000 });
    await expect(page.getByTestId("rewards-balance")).toContainText("50");
    await expect(page.getByText(/seus cupons/i)).toBeVisible();
  });

  test("saldo insuficiente desabilita o resgate", async ({ page, context }) => {
    const user = await createClientUser("rwdinsuf");
    await creditEccoPontos(user.id, 10, "Compra #1003");
    await upsertTestReward({
      code: "ECCOE2EBIG",
      title: "Recompensa alta",
      pointsCost: 10_000,
    });
    await loginClient(context, user.email);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openRewards(page);
    const btn = page.getByTestId("rewards-redeem-ECCOE2EBIG");
    await expect(btn).toBeDisabled();
    await expect(btn).toContainText(/pontos insuficientes/i);
  });

  test("mobile 390px mantém saldo e recompensas", async ({ page, context }) => {
    const user = await createClientUser("rwd390");
    await loginClient(context, user.email);
    await page.setViewportSize({ width: 390, height: 844 });
    await openRewards(page);
    await expect(page.getByTestId("rewards-balance")).toBeVisible();
    await expect(page.getByRole("heading", { name: /como ganhar/i })).toBeVisible();
  });

  test("320 e 430 não quebram rewards", async ({ page, context }) => {
    const user = await createClientUser("rwd320");
    await loginClient(context, user.email);
    for (const width of [320, 430]) {
      await page.setViewportSize({ width, height: 720 });
      await openRewards(page);
      await expect(page.getByTestId("rewards-workspace")).toBeVisible();
    }
  });

  for (const theme of THEMES) {
    test(`tema ${theme} em rewards`, async ({ page, context }) => {
      const user = await createClientUser(`rwd${theme}`);
      await setTheme(page, theme);
      await loginClient(context, user.email);
      await page.setViewportSize({ width: 1280, height: 800 });
      await openRewards(page);
      await expect(page.locator("body")).toBeVisible();
      if (theme === "dark") {
        const bg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(bg).not.toBe("rgb(255, 255, 255)");
      }
    });
  }
});
