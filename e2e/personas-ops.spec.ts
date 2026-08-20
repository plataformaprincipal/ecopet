import { test, expect } from "@playwright/test";
import {
  ensureClientUser,
  ensureApprovedPartnerUser,
  ensureApprovedNgoUser,
  ensureAdminUser,
  loginContext,
  TEST_PASSWORD,
  createPartnerAppointmentFixture,
} from "./helpers/social";

test.describe("Personas — experiência operacional", () => {
  test("CLIENT dashboard, perfil, pet, pedidos, agenda, rewards e suporte", async ({ page }) => {
    const client = await ensureClientUser("opscl");
    await loginContext(page.context(), client.email);
    await page.goto("/cliente");
    await expect(page.getByRole("heading", { name: /olá/i }).first()).toBeVisible({ timeout: 20_000 });
    for (const path of [
      "/cliente/perfil",
      "/cliente/meu-pet",
      "/cliente/pedidos",
      "/cliente/agenda",
      "/cliente/rewards",
      "/cliente/suporte",
    ]) {
      const res = await page.goto(path);
      expect(res?.ok() || res?.status() === 304, path).toBeTruthy();
      await expect(page.locator("body")).not.toContainText("Something went wrong");
    }
  });

  test("PARTNER dashboard, perfil, catálogo, financeiro e avaliações", async ({ page }) => {
    const partner = await ensureApprovedPartnerUser("opspt");
    await loginContext(page.context(), partner.email);
    await page.goto("/parceiro");
    await expect(page.getByTestId("partner-ops-dashboard")).toBeVisible({ timeout: 20_000 });

    const created = await page.request.post("/api/partner/products", {
      data: {
        name: "Ração E2E",
        description: "Produto operacional E2E",
        shortDescription: "E2E",
        catalogCategory: "FOOD",
        price: 49.9,
        stock: 4,
        status: "ACTIVE",
      },
    });
    expect([200, 201]).toContain(created.status());
    const preview = await page.request.post("/api/partner/pricing/preview", {
      data: { kind: "PRODUCT", baseAmount: 49.9 },
    });
    expect(preview.status()).toBe(200);
    const quote = (await preview.json()).data?.quote;
    expect(quote?.labels?.payout === "Estimativa" || quote?.estimatedPayoutCents != null).toBeTruthy();

    for (const path of [
      "/partner/profile",
      "/partner/products",
      "/partner/services",
      "/partner/appointments",
      "/partner/orders",
      "/partner/customers",
      "/partner/financeiro",
      "/partner/avaliacoes",
    ]) {
      const res = await page.goto(path);
      expect(res?.ok() || res?.status() === 304, path).toBeTruthy();
    }
  });

  test("ONG dashboard, perfil, animais, adoções e interessados", async ({ page }) => {
    const ong = await ensureApprovedNgoUser("opsng");
    await loginContext(page.context(), ong.email);
    await page.goto("/ong");
    await expect(page.getByRole("heading", { name: /olá/i }).first()).toBeVisible({ timeout: 20_000 });

    const created = await page.request.post("/api/ong/adoption-listings", {
      data: {
        name: "Luna E2E",
        species: "DOG",
        description: "Animal operacional E2E",
        displayStatus: "disponivel",
      },
    });
    expect([200, 201]).toContain(created.status());

    for (const path of ["/ong/perfil-gestao", "/ngo/animais", "/ong/adocoes", "/ngo/adocoes", "/ngo/campanhas"]) {
      const res = await page.goto(path);
      expect(res?.ok() || res?.status() === 304, path).toBeTruthy();
    }
  });

  test("ADMIN ERP: dashboard, users, partners, ONG, commerce, finance, pricing, rewards, support, audit", async ({
    page,
  }) => {
    const admin = await ensureAdminUser(`e2e.admin.ops.${Date.now()}@test.ecopet.local`);
    await loginContext(page.context(), admin.email);
    for (const path of [
      "/admin",
      "/admin/users",
      "/admin/partners",
      "/admin/ngos",
      "/admin/orders",
      "/admin/appointments",
      "/admin/financeiro",
      "/admin/pricing",
      "/admin/rewards",
      "/admin/suporte",
      "/admin/auditoria",
    ]) {
      const res = await page.goto(path);
      expect([200, 304].includes(res?.status() ?? 0), path).toBeTruthy();
    }
    await page.goto("/admin/pricing");
    await expect(page.getByTestId("admin-pricing-tower")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("admin-pricing-active-version")).toContainText(/BR-2026/);
    await expect(page.getByTestId("admin-pricing-search")).toBeVisible();
    await expect(page.getByTestId("admin-pricing-calculator")).toBeVisible();
  });
});

test.describe("IDOR complementar", () => {
  test("Partner A não lê agendamento de Partner B", async ({ request }) => {
    const a = await ensureApprovedPartnerUser("idora");
    const b = await ensureApprovedPartnerUser("idorb");
    const fixture = await createPartnerAppointmentFixture(b.id);
    await request.post("/api/auth/login", {
      data: { identifier: a.email, email: a.email, password: TEST_PASSWORD },
    });
    const steal = await request.get(`/api/partner/appointments/${fixture.appointment.id}`);
    expect([401, 403, 404]).toContain(steal.status());
  });
});
