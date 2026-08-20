import { test, expect } from "@playwright/test";
import { ensureClientUser, ensureAdminUser, loginContext, TEST_PASSWORD } from "./helpers/social";

test.describe("Pricing foundation", () => {
  test("quote API exige autenticação", async ({ request }) => {
    const res = await request.post("/api/pricing/quote", {
      data: { kind: "PRODUCT", baseAmount: 120 },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("admin pricing exige admin", async ({ request }) => {
    const client = await ensureClientUser("prcadm");
    await request.post("/api/auth/login", {
      data: { identifier: client.email, email: client.email, password: TEST_PASSWORD },
    });
    const pricing = await request.get("/api/admin/pricing");
    expect([401, 403]).toContain(pricing.status());
  });

  test("cliente autenticado recebe cotação server-side de produto", async ({ request }) => {
    const client = await ensureClientUser("prcprod");
    await request.post("/api/auth/login", {
      data: { identifier: client.email, email: client.email, password: TEST_PASSWORD },
    });
    const quote = await request.post("/api/pricing/quote", {
      data: { kind: "PRODUCT", baseAmount: 120, quantity: 1 },
    });
    expect([200, 201]).toContain(quote.status());
    const body = await quote.json();
    expect(body.success).toBeTruthy();
    expect(body.data.quote.pricingVersion).toBeTruthy();
    expect(body.data.quote.labels.payout).toBe("Estimativa");
    expect(body.data.quote.eccopetCommissionCents).toBe(1200);
    expect(body.data.quote.fixedFeeCents).toBe(149);
  });

  test("cotação de serviço inclui booking fee oficial", async ({ request }) => {
    const client = await ensureClientUser("prcsvc");
    await request.post("/api/auth/login", {
      data: { identifier: client.email, email: client.email, password: TEST_PASSWORD },
    });
    const quote = await request.post("/api/pricing/quote", {
      data: { kind: "SERVICE", baseAmount: 100, quantity: 1 },
    });
    expect([200, 201]).toContain(quote.status());
    const body = await quote.json();
    expect(body.data.quote.bookingFeeCents).toBe(490);
    expect(body.data.quote.eccopetCommissionCents).toBe(1200);
  });

  test("admin pricing UI mostra versão ACTIVE, catálogo e calculadora", async ({ page }) => {
    const admin = await ensureAdminUser(`e2e.admin.pricing.ui.${Date.now()}@test.ecopet.local`);
    await loginContext(page.context(), admin.email);
    await page.goto("/admin/pricing");
    await expect(page.getByTestId("admin-pricing-tower")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("admin-pricing-active-version")).toContainText("BR-2026.08-v1");
    await expect(page.getByTestId("admin-pricing-search")).toBeVisible();
    await expect(page.getByTestId("admin-pricing-suite-filter")).toBeVisible();
    await expect(page.getByTestId("admin-pricing-calculator")).toBeVisible();
    await expect(page.getByText(/versão ACTIVE não é editada/i).first()).toBeVisible();
    await page.getByTestId("admin-pricing-search").fill("SKU");
    await page.getByRole("button", { name: /simular|calcular/i }).first().click();
    await expect(page.getByTestId("admin-pricing-payout-estimate")).toBeVisible({ timeout: 15_000 });
  });

  test("marketplace guest continua exibindo catálogo", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.getByTestId("marketplace-search")).toBeVisible({ timeout: 20_000 });
  });

  test("serviços guest continua carregando", async ({ page }) => {
    await page.goto("/marketplace/servicos");
    await expect(page.getByTestId("services-discovery")).toBeVisible({ timeout: 20_000 });
  });
});
