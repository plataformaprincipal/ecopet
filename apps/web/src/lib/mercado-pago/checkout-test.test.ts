import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import path from "node:path";
import { canAccessRoute, isAdminOnlyPath } from "@/lib/edge/permissions";
import { requiresAuth } from "@/lib/edge/routes";
import {
  getMercadoPagoTestPublicConfig,
  isMercadoPagoTestCheckoutConfigured,
} from "@/lib/mercado-pago/test-credentials";

function readSrc(rel: string) {
  return readFileSync(path.resolve(process.cwd(), rel), "utf8");
}

describe("checkout-test access", () => {
  it("A/B) qualquer role autenticado acessa /checkout-test", () => {
    assert.equal(isAdminOnlyPath("/checkout-test"), false);
    assert.equal(isAdminOnlyPath("/checkout-test/sucesso/abc"), false);
    assert.equal(canAccessRoute("CLIENT", "/checkout-test"), true);
    assert.equal(canAccessRoute("CLIENT", "/checkout-test/sucesso/abc"), true);
    assert.equal(canAccessRoute("ADMIN", "/checkout-test"), true);
    assert.equal(canAccessRoute("PARTNER", "/checkout-test"), true);
    assert.equal(canAccessRoute("ONG", "/checkout-test"), true);
  });

  it("C) anônimo continua exigindo login", () => {
    assert.equal(requiresAuth("/checkout-test"), true);
    assert.equal(requiresAuth("/checkout-test/sucesso/x"), true);
  });

  it("checkout LIVE permanece CLIENT-only e sem prefixo admin", () => {
    assert.equal(isAdminOnlyPath("/checkout"), false);
    assert.equal(canAccessRoute("CLIENT", "/checkout"), true);
  });
});

describe("checkout-test source contracts", () => {
  it("páginas e APIs não exigem ADMIN", () => {
    const files = [
      "src/app/(app)/checkout-test/page.tsx",
      "src/app/(app)/checkout-test/sucesso/[orderId]/page.tsx",
      "src/app/api/checkout-test/route.ts",
      "src/app/api/checkout-test/mercado-pago/config/route.ts",
      "src/app/api/checkout-test/mercado-pago/payment-methods/route.ts",
      "src/app/api/checkout-test/mercado-pago/installments/route.ts",
      "src/app/api/checkout-test/mercado-pago/order/route.ts",
      "src/app/api/checkout-test/mercado-pago/order/[id]/route.ts",
    ];
    for (const file of files) {
      const src = readSrc(file);
      assert.equal(src.includes("requireAdmin"), false, file);
      assert.equal(src.includes("UserRole.ADMIN"), false, file);
    }
    const page = readSrc("src/app/(app)/checkout-test/page.tsx");
    assert.ok(page.includes('redirect("/login?callbackUrl=/checkout-test")'));
    assert.ok(page.includes("CheckoutTestPanel"));
    assert.equal(page.includes("CheckoutPanel"), false);
  });

  it("D) APIs usam requireAuth", () => {
    const files = [
      "src/app/api/checkout-test/route.ts",
      "src/app/api/checkout-test/mercado-pago/config/route.ts",
      "src/app/api/checkout-test/mercado-pago/order/route.ts",
      "src/app/api/checkout-test/mercado-pago/order/[id]/route.ts",
    ];
    for (const file of files) {
      assert.ok(readSrc(file).includes("requireAuth"), file);
    }
  });

  it("E) consulta de Order TEST exige dono", () => {
    const get = readSrc("src/app/api/checkout-test/mercado-pago/order/[id]/route.ts");
    assert.ok(get.includes("userId: user!.id"));
    const helper = readSrc("src/lib/mercado-pago/create-checkout-test-order.ts");
    assert.ok(helper.includes("ORDER_FORBIDDEN"));
    assert.ok(helper.includes("payment.order.userId !== params.userId"));
    const installments = readSrc("src/app/api/checkout-test/mercado-pago/installments/route.ts");
    assert.ok(installments.includes("order.userId !== user!.id"));
  });

  it("UI não oferece pagamento na entrega", () => {
    const panel = readSrc("src/components/features/marketplace/checkout-test-panel.tsx");
    assert.ok(panel.includes("Pagar com Mercado Pago TEST"));
    assert.equal(panel.includes("PIX na entrega"), false);
    assert.equal(panel.includes("Dinheiro"), false);
    assert.equal(panel.includes("no momento da entrega"), false);
    assert.equal(panel.includes("paymentMethod"), false);
  });

  it("credenciais TEST sem fallback LIVE", () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-live-secret-token-value";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = "APP_USR-live-public-key-value";
    delete process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN;
    delete process.env.NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY;
    assert.equal(isMercadoPagoTestCheckoutConfigured(), false);
    assert.equal(getMercadoPagoTestPublicConfig().publicKey, "");
    const client = readSrc("src/lib/mercado-pago/test-client.ts");
    assert.equal(client.includes("MERCADO_PAGO_ACCESS_TOKEN"), false);
    assert.ok(client.includes("getMercadoPagoTestServerConfig"));
  });

  it("não baixa estoque nem posta ledger LIVE", () => {
    const fromCart = readSrc("src/lib/mercado-pago/checkout-test-from-cart.ts");
    assert.equal(fromCart.includes("stock: { decrement"), false);
    assert.equal(fromCart.includes("inventoryLog"), false);
    assert.equal(fromCart.includes("emailOrderEvent"), false);
    assert.equal(fromCart.includes("postLedger"), false);
    const create = readSrc("src/lib/mercado-pago/create-checkout-test-order.ts");
    assert.equal(create.includes("applyInternalPaymentStatus"), false);
    assert.ok(create.includes("persistTestPaymentLocally"));
  });
});
