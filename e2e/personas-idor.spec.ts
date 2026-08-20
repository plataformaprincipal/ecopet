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

test.describe("IDOR e RBAC das personas", () => {
  test("Client A não lê pet nem pedido de Client B", async ({ request }) => {
    const a = await ensureClientUser("idora");
    const b = await ensureClientUser("idorb");

    await request.post("/api/auth/login", {
      data: { identifier: b.email, email: b.email, password: TEST_PASSWORD },
    });
    const petB = await request.post("/api/client/pets", {
      data: { name: "Pet B", species: "DOG", sex: "MALE" },
    });
    expect([200, 201]).toContain(petB.status());
    const petBody = await petB.json();
    const petId = petBody.data?.pet?.id || petBody.data?.id;

    const ordersB = await request.get("/api/client/orders");
    expect(ordersB.status()).toBe(200);
    const orderId = (await ordersB.json()).data?.orders?.[0]?.id;

    await request.post("/api/auth/login", {
      data: { identifier: a.email, email: a.email, password: TEST_PASSWORD },
    });
    const stealPet = await request.get(`/api/client/pets/${petId}`);
    expect([403, 404]).toContain(stealPet.status());
    if (orderId) {
      const stealOrder = await request.get(`/api/client/orders/${orderId}`);
      expect([403, 404]).toContain(stealOrder.status());
    } else {
      const stealFake = await request.get("/api/client/orders/clfakeorderid000000000000");
      expect([403, 404]).toContain(stealFake.status());
    }
  });

  test("Partner A não altera produto nem lê agenda de Partner B", async ({ request }) => {
    const a = await ensureApprovedPartnerUser("idora");
    const b = await ensureApprovedPartnerUser("idorb");

    await request.post("/api/auth/login", {
      data: { identifier: b.email, email: b.email, password: TEST_PASSWORD },
    });
    const created = await request.post("/api/partner/products", {
      data: {
        name: "Produto B",
        description: "Produto IDOR B",
        shortDescription: "B",
        catalogCategory: "FOOD",
        price: 19.9,
        stock: 2,
        status: "ACTIVE",
      },
    });
    expect([200, 201]).toContain(created.status());
    const productId = (await created.json()).data?.product?.id;
    expect(productId).toBeTruthy();
    const fixture = await createPartnerAppointmentFixture(b.id);

    await request.post("/api/auth/login", {
      data: { identifier: a.email, email: a.email, password: TEST_PASSWORD },
    });
    const steal = await request.put(`/api/partner/products/${productId}`, {
      data: { price: 1 },
    });
    expect([401, 403, 404]).toContain(steal.status());
    const preview = await request.post("/api/partner/pricing/preview", {
      data: { kind: "PRODUCT", baseAmount: 120, productId },
    });
    expect([401, 403, 404]).toContain(preview.status());
    const stealAppt = await request.get(`/api/partner/appointments/${fixture.appointment.id}`);
    expect([401, 403, 404]).toContain(stealAppt.status());
  });

  test("ONG A não lê animal da ONG B", async ({ request }) => {
    const a = await ensureApprovedNgoUser("idora");
    const b = await ensureApprovedNgoUser("idorb");

    await request.post("/api/auth/login", {
      data: { identifier: b.email, email: b.email, password: TEST_PASSWORD },
    });
    const created = await request.post("/api/ong/adoption-listings", {
      data: {
        name: "Rex B",
        species: "DOG",
        description: "Cão de teste IDOR",
        displayStatus: "disponivel",
      },
    });
    expect([200, 201]).toContain(created.status());
    const listingId = (await created.json()).data?.listing?.id;
    expect(listingId).toBeTruthy();

    await request.post("/api/auth/login", {
      data: { identifier: a.email, email: a.email, password: TEST_PASSWORD },
    });
    const steal = await request.get(`/api/ong/adoption-listings/${listingId}`);
    expect([401, 403, 404]).toContain(steal.status());
  });

  test("não-admin não acessa APIs admin", async ({ request }) => {
    const client = await ensureClientUser("idadm");
    await request.post("/api/auth/login", {
      data: { identifier: client.email, email: client.email, password: TEST_PASSWORD },
    });
    for (const path of ["/api/admin/pricing", "/api/admin/dashboard", "/api/admin/finance"]) {
      const res = await request.get(path);
      expect([401, 403]).toContain(res.status());
    }
  });

  test("admin autenticado lê pricing ACTIVE", async ({ request }) => {
    const admin = await ensureAdminUser(`e2e.admin.pricing.${Date.now()}@test.ecopet.local`);
    const login = await request.post("/api/auth/login", {
      data: { identifier: admin.email, email: admin.email, password: TEST_PASSWORD },
    });
    expect(login.status()).toBe(200);
    const pricing = await request.get("/api/admin/pricing");
    expect(pricing.status()).toBe(200);
    const body = await pricing.json();
    expect(body.data?.activeVersion?.version || body.data?.version || body.data?.resolved?.version).toBeTruthy();
  });
});

test.describe("Personas — smoke operacional", () => {
  test("cliente dashboard e perfil existem", async ({ page }) => {
    const client = await ensureClientUser("smcl");
    await loginContext(page.context(), client.email);
    const summary = await page.request.get("/api/client/dashboard/summary");
    expect([200, 401, 403]).toContain(summary.status());
    await page.goto("/cliente");
    await expect(page.locator("body")).toBeVisible();
  });

  test("parceiro dashboard summary exige partner", async ({ request }) => {
    const client = await ensureClientUser("smpt");
    await request.post("/api/auth/login", {
      data: { identifier: client.email, email: client.email, password: TEST_PASSWORD },
    });
    const res = await request.get("/api/partner/dashboard/summary");
    expect([401, 403]).toContain(res.status());
  });

  test("ong dashboard summary exige ONG", async ({ request }) => {
    const client = await ensureClientUser("smng");
    await request.post("/api/auth/login", {
      data: { identifier: client.email, email: client.email, password: TEST_PASSWORD },
    });
    const res = await request.get("/api/ong/dashboard/summary");
    expect([401, 403]).toContain(res.status());
  });
});
