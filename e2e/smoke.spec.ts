import { test, expect } from "@playwright/test";

const password = "Ecopet@Forte2026";

test.describe.serial("EcoPet E2E mínimo", () => {
  const ts = Date.now();
  const clientEmail = `e2e.client.${ts}@test.ecopet.local`;

  test("1. health e páginas legais públicas", async ({ page }) => {
    const health = await page.request.get("/api/health");
    expect(health.ok()).toBeTruthy();
    await page.goto("/legal/privacidade");
    await expect(page.getByRole("heading", { name: /privacidade/i })).toBeVisible();
    await page.goto("/legal/termos");
    await expect(page.getByRole("heading", { name: /termos/i })).toBeVisible();
  });

  test("2. cadastro CLIENT via API", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        role: "CLIENT",
        name: "E2E Client",
        email: clientEmail,
        password,
        confirmPassword: password,
        phone: `119${String(ts).slice(-8)}`,
        birthDate: "1990-03-10",
      },
    });
    expect(res.status()).toBe(201);
  });

  test("3. login e dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(clientEmail);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 30_000 });
    await expect(page).toHaveURL(/dashboard\/client/);
  });

  test("4. marketplace público lista", async ({ page }) => {
    await page.goto("/marketplace/produtos");
    await expect(page.locator("body")).toContainText(/produto|marketplace|nenhum/i);
  });

  test("5. feed social carrega", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.locator("body")).toBeVisible();
  });

  test("6. logout", async ({ page, request }) => {
    await request.post("/api/auth/logout");
    const me = await request.get("/api/auth/me");
    expect(me.status()).toBe(401);
  });

  test("7. admin bloqueado para client", async ({ request }) => {
    await request.post("/api/auth/login", { data: { email: clientEmail, password } });
    const gestor = await request.get("/api/admin/gestor/overview");
    expect(gestor.status()).toBe(403);
  });

  test("8. security headers", async ({ request }) => {
    const res = await request.get("/login");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  });
});
