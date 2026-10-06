import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import path from "node:path";
import { checkoutSchema } from "@/schemas/product";
import { evaluateMarketplaceSplit } from "@/lib/finance/split-capability";
import { getMercadoPagoPublicConfig, getMercadoPagoSanitizedStatus, isMercadoPagoConfigured } from "@/lib/mercado-pago/config";
import { requiresExternalSellerGate } from "@/lib/seller/platform";

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
    assert.ok(panel.includes("Seu pedido"));
    assert.ok(panel.includes("Resumo do pedido"));
    assert.ok(panel.includes("Limpar carrinho"));
    assert.ok(panel.includes("Editar carrinho"));
    assert.ok(panel.includes("Item removido."));
    assert.ok(panel.includes("CARTÃO"));
    assert.ok(panel.includes("Cartão"));
    assert.ok(panel.includes("Pix"));
    assert.ok(panel.includes("CheckoutPolicies"));
    const policies = readSrc("src/components/features/marketplace/checkout-policies.tsx");
    assert.ok(policies.includes("Troca, reembolso e cancelamento"));
    assert.ok(panel.includes("PIX"));
    assert.ok(panel.includes("BOLETO"));
    assert.equal(panel.includes("Forma de recebimento"), false);
    assert.equal(panel.includes("Retirada"), false);
    assert.equal(panel.includes("PICKUP_LOCAL"), false);
    assert.ok(panel.includes("DELIVERY_LOCAL"));
    assert.ok(panel.includes("Dados de entrega"));
    assert.ok(panel.includes("Pagamento online"));
    assert.ok(panel.includes("Resumo financeiro"));
    assert.equal(panel.includes("Usado para combinar entrega e pagamento"), false);
    assert.equal(panel.includes("combinar a retirada"), false);
    const summaryIdx = panel.indexOf("Resumo do pedido");
    const deliveryIdx = panel.indexOf("Dados de entrega");
    const paymentIdx = panel.indexOf("Pagamento online");
    const financeIdx = panel.indexOf("Resumo financeiro");
    const payButtonIdx = panel.indexOf("<MercadoPagoCheckout");
    assert.ok(summaryIdx > -1 && deliveryIdx > summaryIdx);
    assert.ok(paymentIdx > deliveryIdx);
    assert.ok(payButtonIdx > paymentIdx && payButtonIdx < financeIdx);
  });

  it("Brick/SDK LIVE não volta para pagamento na entrega", () => {
    const mp = readSrc("src/components/features/marketplace/mercado-pago-checkout.tsx");
    assert.equal(mp.includes("Usar pagamento na entrega"), false);
    assert.ok(mp.includes("createCardToken"));
    assert.ok(mp.includes("Gerar Pix"));
    assert.ok(mp.includes("Gerar boleto"));
    assert.ok(mp.includes("Aguardando pagamento"));
    assert.ok(mp.includes("Processando pagamento..."));
    assert.ok(mp.includes("PIX_WAIT_MS"));
    assert.ok(mp.includes("BoletoDueStatus"));
    assert.ok(mp.includes("Aprovado"));
    assert.ok(mp.includes("Recusado"));
    assert.ok(mp.includes("Aguardando compensação"));
  });
});

describe("checkout UX — CTA único e políticas", () => {
  it("página de produto não duplica comprar agora e adicionar ao carrinho", () => {
    const product = readSrc("src/components/features/marketplace/product-detail-content.tsx");
    assert.ok(product.includes("Adicionar ao carrinho"));
    assert.equal(product.includes("Comprar agora"), false);
    const workspace = readSrc("src/components/features/ai-commerce/workspace.tsx");
    assert.ok(workspace.includes("Adicionar ao carrinho"));
    assert.equal(workspace.includes("Comprar agora"), false);
  });
});

describe("checkout LIVE Mercado Pago — TEST nunca entra", () => {
  it("create-checkout-order LIVE usa Orders API e bloqueia split indisponível", () => {
    const src = readSrc("src/lib/mercado-pago/create-checkout-order.ts");
    assert.ok(src.includes("createMercadoPagoOrder"));
    assert.ok(src.includes("SELLER_SPLIT_UNAVAILABLE"));
    assert.ok(src.includes("sellerRequiresMarketplaceSplit"));
    assert.ok(src.includes("splitRequired && !split.splitReady"));
    assert.equal(src.includes("MERCADO_PAGO_TEST_ACCESS_TOKEN"), false);
    assert.equal(src.includes("test-credentials"), false);
    assert.equal(src.includes("test-client"), false);
  });

  it("checkoutFromCart rejeita COD e exige split do parceiro", () => {
    const src = readSrc("src/lib/orders/checkout-service.ts");
    assert.ok(src.includes("COD_NOT_ALLOWED"));
    assert.ok(src.includes("SELLER_SPLIT_UNAVAILABLE"));
    assert.ok(src.includes("requiresExternalSellerGate"));
    assert.ok(src.includes("splitRequired && !splitEval.capability.splitReady"));
    assert.ok(src.includes("isMercadoPagoCheckoutAvailable"));
    assert.equal(src.includes("PIX na entrega"), false);
  });

  it("config LIVE não lê variáveis TEST", () => {
    const src = readSrc("src/lib/mercado-pago/config.ts");
    assert.ok(src.includes("MERCADO_PAGO_ACCESS_TOKEN"));
    assert.ok(src.includes("NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY"));
    assert.equal(src.includes("MERCADO_PAGO_TEST_ACCESS_TOKEN"), false);
    assert.equal(src.includes("NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY"), false);
    const route = readSrc("src/app/api/checkout/mercado-pago/config/route.ts");
    assert.equal(route.includes("indisponível (${status.status})"), false);
  });

  it("mock: Vercel Production considera LIVE configurado sem PAYMENT_PROVIDER", () => {
    const prev = { ...process.env };
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-mock-live-token-value-xxxx";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = "APP_USR-mock-live-public-key";
    process.env.VERCEL_ENV = "production";
    delete process.env.PAYMENT_PROVIDER;
    delete process.env.MERCADO_PAGO_ENVIRONMENT;
    try {
      assert.equal(isMercadoPagoConfigured(), true);
      const pub = getMercadoPagoPublicConfig();
      assert.equal(pub.configured, true);
      assert.equal(pub.environment, "production");
      assert.ok(pub.publicKey.length > 0);
    } finally {
      process.env = { ...prev };
    }
  });

  it("PAYMENT_PROVIDER legado não 503 o checkout LIVE quando keys e status ACTIVE", () => {
    const prev = { ...process.env };
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-mock-live-token-value-xxxx";
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY = "APP_USR-mock-live-public-key";
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = "whsec_live_mock_secret";
    process.env.VERCEL_ENV = "production";
    process.env.PAYMENT_PROVIDER = "PAGARME";
    delete process.env.MERCADO_PAGO_ENVIRONMENT;
    try {
      const pub = getMercadoPagoPublicConfig();
      assert.equal(pub.configured, true);
      assert.ok(pub.publicKey.length > 0);
      assert.equal(getMercadoPagoSanitizedStatus().status, "ACTIVE");
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

  it("seller gate não exige Connect para EccoPet/ADMIN e continua exigindo para PARTNER/ONG", () => {
    assert.equal(requiresExternalSellerGate({ sellerId: null }), false);
    assert.equal(requiresExternalSellerGate({ sellerId: "ECCOPET" }), false);
    assert.equal(requiresExternalSellerGate({ sellerId: "admin-1", role: "ADMIN" }), false);
    assert.equal(requiresExternalSellerGate({ sellerId: "partner-1", role: "PARTNER" }), true);
    assert.equal(requiresExternalSellerGate({ sellerId: "ong-1", role: "ONG" }), true);
  });

  it("AI, planos e catálogo EccoPet criam pedido sem partnerId de split", () => {
    const ai = readSrc("src/lib/ai-commerce/checkout-service.ts");
    assert.ok(ai.includes("partnerId: null"));
    assert.equal(ai.includes("SELLER_SPLIT_UNAVAILABLE"), false);
    const catalog = readSrc("src/lib/commerce-catalog/checkout.ts");
    assert.ok(catalog.includes("partnerId: null"));
    assert.equal(catalog.includes("SELLER_SPLIT_UNAVAILABLE"), false);
    const pay = readSrc("src/lib/mercado-pago/create-checkout-order.ts");
    assert.ok(pay.includes("createMercadoPagoOrder"));
    assert.ok(pay.includes("splitRequired && !split.splitReady"));
  });

  it("carrinho trata seller EccoPet/ADMIN como disponível sem MP CONNECTED", () => {
    const src = readSrc("src/lib/cart/cart-service.ts");
    assert.ok(src.includes("cartSellerIdentity"));
    assert.ok(src.includes('identity.sellerType !== "ECCOPET"'));
  });
});

describe("checkout LIVE webhook", () => {
  it("pipeline continua validando assinatura e consultando o Mercado Pago", () => {
    const pipeline = readSrc("src/lib/mercado-pago/webhooks/pipeline.ts");
    assert.ok(pipeline.includes("verifyMercadoPagoWebhookSignature"));
    const handler = readSrc("src/lib/mercado-pago/webhooks/handlers/order.ts");
    assert.ok(handler.includes("applyInternalPaymentStatus"));
    const apply = readSrc("src/lib/mercado-pago/apply-payment-status.ts");
    assert.ok(apply.includes("fulfillApprovedOrder"));
  });
});
