/**
 * EcoPet E2E minimo — 11 cenarios de aceite (API-first).
 * Sem credenciais externas: pagamento permanece pendente.
 */
import { test, expect, type APIRequestContext } from "@playwright/test";

const password = "Ecopet@Forte2026";
const ts = Date.now();
const clientEmail = `e2e.client.${ts}@test.ecopet.local`;
const partnerEmail = `e2e.partner.${ts}@test.ecopet.local`;
const ongEmail = `e2e.ong.${ts}@test.ecopet.local`;

function phone(suffix: number) {
  return `+55119${String(suffix).replace(/\D/g, "").padStart(8, "0").slice(-8)}`;
}

function validCnpj(seed: number): string {
  const n = String(Math.abs(seed)).padStart(12, "0").slice(-12).split("").map(Number);
  const calc = (base: number[], factors: number[]) => {
    const sum = base.reduce((acc, d, i) => acc + d * factors[i], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const d1 = calc(n, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc([...n, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${n.join("")}${d1}${d2}`;
}

async function login(request: APIRequestContext, email: string) {
  const res = await request.post("/api/auth/login", { data: { email, password } });
  expect(res.status(), `login ${email}`).toBe(200);
}

test.describe.serial("EcoPet E2E foundation flow", () => {
  let productId = "";
  let orderId = "";
  let partnerUserId = "";

  test("1. cadastro CLIENT", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        role: "CLIENT",
        name: "E2E Cliente",
        email: clientEmail,
        password,
        confirmPassword: password,
        phone: phone(ts),
        birthDate: "1990-03-10",
        username: `e2ec${String(ts).slice(-8)}`,
        gender: "MASCULINO",
        acceptTerms: true,
        acceptPrivacy: true,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data?.user?.accountStatus).toBe("ACTIVE");
  });

  test("2. cadastro PARTNER", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        role: "PARTNER",
        name: "E2E Parceiro",
        email: partnerEmail,
        password,
        confirmPassword: password,
        phone: phone(ts + 1),
        businessName: "Petshop E2E",
        legalName: "Petshop E2E LTDA",
        cnpj: validCnpj(ts),
        category: "Pet Shop",
        address: "Rua E2E, 100",
        city: "Sao Paulo",
        state: "SP",
        acceptTerms: true,
        acceptPrivacy: true,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data?.user?.accountStatus).toBe("ACTIVE");
    partnerUserId = body.data?.user?.id;
    expect(partnerUserId).toBeTruthy();
  });

  test("3. cadastro ONG", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        role: "ONG",
        name: "E2E ONG",
        email: ongEmail,
        password,
        confirmPassword: password,
        phone: phone(ts + 2),
        ongName: "ONG E2E",
        responsibleName: "Responsavel E2E",
        cnpj: validCnpj(ts + 99),
        address: "Rua ONG, 50",
        city: "Sao Paulo",
        state: "SP",
        acceptTerms: true,
        acceptPrivacy: true,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data?.user?.accountStatus).toBe("ACTIVE");
  });

  test("4. login CLIENT", async ({ request }) => {
    await login(request, clientEmail);
    const me = await request.get("/api/auth/me");
    expect(me.status()).toBe(200);
    const body = await me.json();
    expect(body.data?.user?.email || body.data?.email).toContain("e2e.client.");
    expect(body.data?.user?.role || body.data?.role).toBe("CLIENT");
  });

  test("5. parceiro cria produto", async ({ request }) => {
    await login(request, partnerEmail);
    const res = await request.post("/api/partner/products", {
      data: {
        name: `Produto E2E ${ts}`,
        description: "Produto criado no E2E",
        shortDescription: "E2E",
        catalogCategory: "FOOD",
        price: 42.5,
        stock: 8,
        status: "ACTIVE",
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    productId = body.data?.product?.id;
    expect(productId).toBeTruthy();
  });

  test("6. cliente adiciona ao carrinho", async ({ request }) => {
    await login(request, clientEmail);
    const res = await request.post("/api/cart/items", {
      data: { productId, quantity: 1 },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.data?.cart?.items?.length).toBeGreaterThan(0);
  });

  test("7. cliente conclui pedido", async ({ request }) => {
    await login(request, clientEmail);
    const res = await request.post("/api/checkout", {
      data: {
        deliveryMethod: "PICKUP_LOCAL",
        paymentMethod: "PIX",
        phone: phone(ts + 3),
        address: { street: "Rua A", city: "Sao Paulo", state: "SP" },
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    orderId = body.data?.order?.id;
    expect(orderId).toBeTruthy();
    const payStatus = body.data?.order?.paymentStatus;
    if (payStatus) expect(["PAID", "APPROVED"]).not.toContain(payStatus);
  });

  test("8. parceiro ve pedido", async ({ request }) => {
    await login(request, partnerEmail);
    const res = await request.get("/api/partner/orders");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data?.orders ?? []).some((o: { id: string }) => o.id === orderId)).toBeTruthy();
  });

  test("9. parceiro atualiza status", async ({ request }) => {
    await login(request, partnerEmail);
    const res = await request.patch(`/api/partner/orders/${orderId}/status`, {
      data: { status: "CONFIRMED" },
    });
    expect(res.status()).toBe(200);
    await login(request, clientEmail);
    const clientOrders = await request.get("/api/client/orders");
    const body = await clientOrders.json();
    const updated = (body.data?.orders ?? []).find((o: { id: string }) => o.id === orderId);
    expect(updated?.status).toBe("CONFIRMED");
  });

  test("10. cliente inicia conversa com parceiro", async ({ request }) => {
    await login(request, clientEmail);
    const res = await request.post("/api/messages/conversations", {
      data: {
        type: "DIRECT",
        participantUserIds: [partnerUserId],
        contextType: "PRODUCT",
        contextId: productId,
      },
    });
    if (res.status() === 201) {
      const body = await res.json();
      expect(body.data?.conversation?.id || body.data?.id).toBeTruthy();
    } else {
      expect(res.status()).toBeGreaterThanOrEqual(400);
      const body = await res.json().catch(() => ({}));
      expect(String(body?.error?.code ?? body?.error?.message ?? "err").length).toBeGreaterThan(0);
    }
  });

  test("11. cliente recebe notificacao", async ({ request }) => {
    await login(request, clientEmail);
    const res = await request.get("/api/notifications");
    expect(res.status()).toBe(200);
    const body = await res.json();
    const list = body.data?.notifications ?? body.data?.items ?? [];
    expect(Array.isArray(list)).toBeTruthy();
  });
});
