import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import path from "node:path";
import { checkoutSchema } from "@/schemas/product";
import { evaluateMarketplaceSplit } from "@/lib/finance/split-capability";
import { getMercadoPagoPublicConfig, isMercadoPagoConfigured } from "@/lib/mercado-pago/config";

function readSrc(rel: string) {
  return readFileSync(path.resolve(process.cwd(), rel), "utf8");
}

const validAddress = {
  street: "Rua das Flores",
  number: "10",
  city: "João Pessoa",
  state: "PB",
  zipCode: "58000000",
};

describe("checkout LIVE schema — online only", () => {
  it("aceita cartão, Pix e boleto", () => {
    for (const paymentMethod of ["CARD", "PIX", "BOLETO"] as const) {
      const parsed = checkoutSchema.safeParse({
        deliveryMethod: "PICKUP_LOCAL",
        paymentMethod,
        phone: "83988123456",
        address: validAddress,
      });
      assert.equal(parsed.success, true, paymentMethod);
    }
  });

  it("rejeita dinheiro / pagamento na entrega", () => {
    const parsed = checkoutSchema.safeParse({
      deliveryMethod: "PICKUP_LOCAL",
      paymentMethod: "CASH",
      phone: "83988123456",
      address: validAddress,
    });
    assert.equal(parsed.success, false);
  });
});

describe("checkout LIVE UI — sem pagamento na entrega", () => {
  it("painel oferece somente cartão, Pix e boleto online", () => {
    const panel = readSrc("src/components/features/marketplace/checkout-panel.tsx");
    assert.equal(panel.includes("Dinheiro"), false);
    assert.equal(panel.includes("Na entrega ou retirada"), false);
    assert.equal(panel.includes("momento da entrega"), false);
    assert.ok(panel.includes("Cartão"));
    assert.ok(panel.includes("Pix"));
    assert.ok(panel.includes("Boleto"));
    assert.ok(panel.includes("Pagar com Mercado Pago"));
  });

  it("Brick/SDK LIVE não volta para pagamento na entrega", () => {
    const mp = readSrc("src/components/features/marketplace/mercado-pago-checkout.tsx");
    assert.equal(mp.includes("Usar pagamento na entrega"), false);
    assert.ok(mp.includes("createCardToken"));
    assert.ok(mp.includes("Gerar PIX"));
    assert.ok(mp.includes("Gerar boleto"));
  });
});

describe("checkout LIVE Mercado Pago — TEST nunca entra", () => {
  it("create-checkout-order LIVE usa Orders API e bloqueia split indisponível", () => {
    const src = readSrc("src/lib/mercado-pago/create-checkout-order.ts");
    assert.ok(src.includes("createMercadoPagoOrder"));
    assert.ok(src.includes("SELLER_SPLIT_UNAVAILABLE"));
    assert.equal(src.includes("MERCADO_PAGO_TEST_ACCESS_TOKEN"), false);
    assert.equal(src.includes("test-credentials"), false);
    assert.equal(src.includes("test-client"), false);
  });

  it("checkoutFromCart rejeita COD e exige split do parceiro", () => {
    const src = readSrc("src/lib/orders/checkout-service.ts");
    assert.ok(src.includes("COD_NOT_ALLOWED"));
    assert.ok(src.includes("SELLER_SPLIT_UNAVAILABLE"));
    assert.ok(src.includes("isMercadoPagoCheckoutAvailable"));
    assert.equal(src.includes("PIX na entrega"), false);
  });

  it("config LIVE não lê variáveis TEST", () => {
    const src = readSrc("src/lib/mercado-pago/config.ts");
    assert.ok(src.includes("MERCADO_PAGO_ACCESS_TOKEN"));
    assert.ok(src.includes("NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY"));
    assert.equal(src.includes("MERCADO_PAGO_TEST_ACCESS_TOKEN"), false);
    assert.equal(src.includes("NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY"), false);
  });

  it("mock: credenciais LIVE configuradas sem chamar a API de cobrança", () => {
    const prev = { ...process.env };
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-mock-live-token-value-xxxx";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = "APP_USR-mock-live-public-key";
    process.env.MERCADO_PAGO_ENVIRONMENT = "production";
    process.env.PAYMENT_PROVIDER = "mercado_pago";
    delete process.env.VERCEL_ENV;
    try {
      assert.equal(isMercadoPagoConfigured(), true);
      const pub = getMercadoPagoPublicConfig();
      assert.equal(pub.configured, true);
      assert.equal(pub.apiOrders, true);
      assert.equal(pub.environment, "production");
    } finally {
      process.env = { ...prev };
    }
  });
});

describe("checkout LIVE split — sem desvio silencioso para a EccoPet", () => {
  it("parceiro sem OAuth CONNECTED não fica splitReady", () => {
    const cap = evaluateMarketplaceSplit({
      source: {
        MERCADO_PAGO_CLIENT_ID: "app",
        MERCADO_PAGO_CLIENT_SECRET: "secret",
        MP_MARKETPLACE_SPLIT_ENABLED: "1",
      },
      partnerConnection: { status: "NOT_CONNECTED", mpUserId: null },
      applicationFeeAmount: 12.5,
      transactionAmount: 100,
    });
    assert.equal(cap.splitReady, false);
  });
});

describe("checkout LIVE webhook", () => {
  it("pipeline continua validando assinatura e consultando o Mercado Pago", () => {
    const pipeline = readSrc("src/lib/mercado-pago/webhooks/pipeline.ts");
    assert.ok(pipeline.includes("verifyMercadoPagoWebhookSignature"));
    const handler = readSrc("src/lib/mercado-pago/webhooks/handlers/order.ts");
    assert.ok(handler.includes("applyInternalPaymentStatus"));
  });
});
