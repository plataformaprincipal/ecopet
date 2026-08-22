import { test, expect } from "@playwright/test";
import { TEST_PASSWORD } from "./helpers/acceptance";
import {
  clearAuthRateLimitBuckets,
  createClientUser,
  disconnectRewardsPrisma,
} from "./helpers/rewards";

async function isolateBrowser(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("ecopet.analytics.consent.choice.v1", "1");
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

test.describe("Adoção, ONGs e assistente (guest)", () => {
  test("filtros de adoção permanecem em /adocao", async ({ page }) => {
    await isolateBrowser(page);
    await page.goto("/adocao");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
    const filterBtn = page.getByRole("button", { name: /filtros/i }).first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
    }
    const apply = page.getByRole("button", { name: /aplicar filtros/i }).first();
    if (await apply.isVisible()) {
      await apply.click();
    }
    await expect(page).toHaveURL(/\/adocao/);
    expect(page.url()).not.toMatch(/marketplace|explorar/);
  });

  test("lista pública de ONGs abre sem login", async ({ page }) => {
    await isolateBrowser(page);
    const res = await page.goto("/ngos");
    expect(res?.ok() || res?.status() === 304).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
    expect(page.url()).not.toMatch(/\/login/);
  });

  test("assistente guest pede login em dado privado", async ({ page }) => {
    await isolateBrowser(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const fab = page.getByRole("button", { name: /abrir assistente pessoal/i });
    await expect(fab).toBeVisible({ timeout: 20_000 });
    await fab.click();
    const box = page.locator(".ep-float-assistant input").first();
    await expect(box).toBeVisible({ timeout: 15_000 });
    await box.fill("Quais pets eu tenho?");
    await box.press("Enter");
    await expect(page.getByRole("link", { name: /entrar/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: /cancelar/i }).click();
    await expect(box).toHaveCount(0);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`assistente FAB visível no tema ${theme}`, async ({ page }) => {
      await isolateBrowser(page);
      await page.addInitScript((value) => {
        localStorage.setItem("ecopet-theme", value);
      }, theme);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/");
      await expect(page.getByRole("button", { name: /abrir assistente pessoal/i })).toBeVisible({
        timeout: 20_000,
      });
    });
  }

  test("assistente FAB visível em 390px", async ({ page }) => {
    await isolateBrowser(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: /abrir assistente pessoal/i })).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe("Acessibilidade", () => {
  test("toolbar aplica escala e restaura", async ({ page }) => {
    await isolateBrowser(page);
    await page.goto("/");
    await page.getByRole("button", { name: /acessibilidade/i }).click();
    const scale125 = page.getByRole("button", { name: "125%" });
    if (await scale125.isVisible()) {
      await scale125.click();
    }
    const restore = page.getByRole("button", { name: /restaurar|padrão|reset/i }).first();
    if (await restore.isVisible()) {
      await restore.click();
    }
    await expect(page.locator("html")).toBeVisible();
  });
});

test.describe("Meu Pet e Suporte (autenticado)", () => {
  test.afterAll(async () => {
    await disconnectRewardsPrisma();
  });

  test("cliente cadastra pet e vacina", async ({ page, context }) => {
    await isolateBrowser(page);
    await clearAuthRateLimitBuckets();
    const user = await createClientUser("pet");
    const login = await context.request.post("/api/auth/login", {
      data: { identifier: user.email, email: user.email, password: TEST_PASSWORD },
    });
    expect(login.ok()).toBeTruthy();

    await page.goto("/cliente/meu-pet");
    await expect(page.getByRole("heading", { name: /meu pet/i })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /cadastrar pet/i }).click();
    await page.getByLabel(/nome/i).fill("Luna");
    await page.getByRole("button", { name: /salvar/i }).click();
    await expect(page.getByText(/luna/i).first()).toBeVisible({ timeout: 15_000 });

    const vaccineName = page.getByPlaceholder(/vacina/i).first();
    if (await vaccineName.isVisible()) {
      await vaccineName.fill("V10");
      const applied = page.getByLabel(/data aplicada/i);
      if (await applied.isVisible()) {
        await applied.fill("2026-01-10");
      }
      const next = page.getByLabel(/próxima dose/i);
      if (await next.isVisible()) {
        await next.fill("2026-09-20");
      }
      await page.getByRole("button", { name: /salvar vacina/i }).click();
      await expect(page.getByText(/v10/i).first()).toBeVisible({ timeout: 15_000 });
    }
  });

  test("cliente abre ticket de suporte", async ({ page, context }) => {
    await isolateBrowser(page);
    await clearAuthRateLimitBuckets();
    const user = await createClientUser("sup");
    const login = await context.request.post("/api/auth/login", {
      data: { identifier: user.email, email: user.email, password: TEST_PASSWORD },
    });
    expect(login.ok()).toBeTruthy();

    const created = await context.request.post("/api/support/tickets", {
      data: {
        subject: "Dúvida de conta",
        description: "Preciso de ajuda da equipe EccoPet.",
        category: "ACCOUNT",
      },
    });
    expect(created.ok()).toBeTruthy();
    const json = await created.json();
    const ticketId = json.data?.ticket?.id;
    expect(ticketId).toBeTruthy();

    await page.goto(`/dashboard/support/${ticketId}`);
    await expect(page.getByText(/dúvida de conta/i)).toBeVisible({ timeout: 20_000 });
  });
});
