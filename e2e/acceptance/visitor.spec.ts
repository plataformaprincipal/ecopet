/**
 * Aceitação VISITOR — área pública e bloqueio de privados.
 */
import { test, expect } from "@playwright/test";

test.describe("Acceptance VISITOR", () => {
  test("home pública carrega", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok() || res?.status() === 304).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("link", { name: /criar conta|create account|crear cuenta/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("landing hero e módulos públicos", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#conheca, [id='conheca']")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).toContainText(/ecopet|marketplace|social|explorar|ia/i);
  });

  test("marketplace público", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.locator("body")).toContainText(/produto|marketplace|nenhum|pet|serviço|servico/i);
  });

  test("explorar / feed público", async ({ page }) => {
    await page.goto("/explorar");
    await expect(page.locator("body")).toBeVisible();
  });

  test("social público abre", async ({ page }) => {
    await page.goto("/social");
    await expect(page.locator("body")).toBeVisible();
  });

  test("EcoPet IA pública abre shell", async ({ page }) => {
    await page.goto("/eccopet");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).toContainText(/ecopet|ia|assistente|chat|conversa/i);
  });

  test("login e cadastro abrem", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await page.goto("/cadastro");
    await expect(page.locator("body")).toBeVisible();
  });

  test("viewport mobile 375 sem overflow horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 2;
    });
    expect(overflow).toBeFalsy();
  });

  test("recuperação de senha abre", async ({ page }) => {
    await page.goto("/recuperar-senha");
    await expect(page.locator("body")).toBeVisible();
  });

  test("rota admin exige auth", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/login|unauthorized|admin/i, { timeout: 15_000 });
    const url = page.url();
    expect(url).toMatch(/login|unauthorized|admin/i);
    if (/\/admin/.test(url) && !/login/.test(url)) {
      // se chegou em admin sem login, deve mostrar bloqueio
      await expect(page.locator("body")).toContainText(/entrar|login|acesso|não autoriz|unauthorized/i);
    }
  });

  test("API privada sem cookie → 401", async ({ request }) => {
    const me = await request.get("/api/auth/me");
    expect(me.status()).toBe(401);
    const pets = await request.get("/api/client/pets");
    expect([401, 403]).toContain(pets.status());
    const admin = await request.get("/api/admin/gestor/overview");
    expect([401, 403]).toContain(admin.status());
  });

  test("health público", async ({ request }) => {
    const live = await request.get("/api/health/live");
    expect(live.ok()).toBeTruthy();
  });

  test("security headers em página pública", async ({ request }) => {
    const res = await request.get("/login");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  });
});
