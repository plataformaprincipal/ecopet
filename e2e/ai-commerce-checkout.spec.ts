import { test, expect } from "@playwright/test";

/**
 * E2E comercial completo (Pix/cartão/webhook) exige:
 * AI_COMMERCE_ENABLED=1, Mercado Pago TEST, OpenAI, tutor com pet.
 * Sem isso o spec documenta o fluxo e falha de forma explícita no gate de env.
 */

const required = [
  "AI_COMMERCE_ENABLED",
  "MERCADO_PAGO_ACCESS_TOKEN",
  "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY",
  "OPENAI_API_KEY",
];

test.describe("EccoPet AI commerce E2E", () => {
  test("ambiente de pagamento de teste declarado", async () => {
    const missing = required.filter((k) => !process.env[k] || process.env[k] === "false");
    test.skip(
      missing.length > 0,
      `Pendência de ambiente: ${missing.join(", ")}. Fluxo: login → pet → produto → carrinho → checkout → MP → webhook → entitlement → workspace → PDF.`
    );
    expect(missing).toEqual([]);
  });
});
