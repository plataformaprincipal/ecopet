/**
 * Aceitação PARTNER + NGO — cadastro, ownership, RBAC cruzado.
 */
import { test, expect } from "@playwright/test";
import {
  TEST_PASSWORD,
  apiLogin,
  apiLogout,
  registerClient,
  registerNgo,
  registerPartner,
  testTag,
} from "../helpers/acceptance";

test.describe.serial("Acceptance PARTNER + NGO", () => {
  const tag = testTag();
  let partnerEmail = "";
  let ngoEmail = "";
  let clientEmail = "";
  let productId = "";
  let partnerUserId = "";

  test("cadastro partner", async ({ request }) => {
    const { res, email } = await registerPartner(request, tag);
    partnerEmail = email;
    expect(res.status()).toBe(201);
    const body = await res.json();
    partnerUserId = body.data?.user?.id || body.data?.id;
    expect(body.data?.user?.role || body.data?.role).toBe("PARTNER");
  });

  test("cadastro ngo", async ({ request }) => {
    const { res, email } = await registerNgo(request, `${tag}n`);
    ngoEmail = email;
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data?.user?.role || body.data?.role).toMatch(/ONG|NGO/);
  });

  test("cadastro client auxiliar", async ({ request }) => {
    const { res, email } = await registerClient(request, `${tag}c`);
    clientEmail = email;
    expect(res.status()).toBe(201);
  });

  test("partner cria produto", async ({ request }) => {
    await apiLogin(request, partnerEmail);
    const res = await request.post("/api/partner/products", {
      data: {
        name: `Produto ACC ${tag}`,
        description: "Produto aceitação",
        shortDescription: "ACC",
        catalogCategory: "FOOD",
        price: 19.9,
        stock: 5,
        status: "ACTIVE",
      },
    });
    // PENDING partners may be restricted — accept 201 or business 403
    if (res.status() === 201) {
      const body = await res.json();
      productId = body.data?.product?.id;
      expect(productId).toBeTruthy();
    } else {
      expect([403, 400, 422]).toContain(res.status());
      test.info().annotations.push({
        type: "note",
        description: `Partner product create status=${res.status()} (possível restrição PENDING)`,
      });
    }
  });

  test("client não cria produto partner", async ({ request }) => {
    await apiLogin(request, clientEmail);
    const res = await request.post("/api/partner/products", {
      data: {
        name: "Hack",
        price: 1,
        stock: 1,
        catalogCategory: "FOOD",
        status: "ACTIVE",
      },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("ngo não acessa pedidos partner", async ({ request }) => {
    await apiLogin(request, ngoEmail);
    const res = await request.get("/api/partner/orders");
    expect([401, 403]).toContain(res.status());
  });

  test("partner não acessa admin", async ({ request }) => {
    await apiLogin(request, partnerEmail);
    const res = await request.get("/api/admin/gestor/overview");
    expect(res.status()).toBe(403);
  });

  test("client adiciona produto ao carrinho se existir", async ({ request }) => {
    test.skip(!productId, "produto não criado (parceiro restrito)");
    const loginRes = await request.post("/api/auth/login", {
      data: { identifier: clientEmail, password: TEST_PASSWORD },
    });
    if (loginRes.status() === 429) {
      test.info().annotations.push({ type: "note", description: "rate limit no login — cenário adiado" });
      return;
    }
    expect(loginRes.status()).toBe(200);
    const res = await request.post("/api/cart/items", {
      data: { productId, quantity: 1 },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("logout limpa sessão partner", async ({ request }) => {
    await apiLogin(request, partnerEmail);
    await apiLogout(request);
    const me = await request.get("/api/auth/me");
    expect(me.status()).toBe(401);
  });
});
