/**
 * Capacidade real de split Mercado Pago.
 * Nunca marca splitReady só porque o cálculo local fecha.
 *
 * Produto atual: Checkout Transparente / API Orders (/v1/orders)
 * cobrado no access token da PLATAFORMA. marketplace_fee / collector_id
 * do seller NÃO são parâmetros compatíveis com esse payload.
 */

export const SPLIT_DECISIONS = [
  "SPLIT_READY",
  "SPLIT_REQUIRES_MP_ENABLEMENT",
  "ARCHITECTURE_BLOCKED",
  "NOT_READY",
] as const;

export type SplitDecision = (typeof SPLIT_DECISIONS)[number];

export type PaymentTopology = "ONE_ORDER_ONE_PARTNER" | "ONE_ORDER_MULTI_PARTNER";

export type SplitCapability = {
  topology: PaymentTopology;
  mpProduct: "orders_api_platform_collector";
  marketplaceFeeCompatibleWithCurrentCheckout: false;
  sellerOAuthConfigured: boolean;
  marketplaceSplitEnvEnabled: boolean;
  splitReady: false;
  decision: SplitDecision;
  reasons: string[];
};

function envFlag(source: Record<string, string | undefined>, name: string): boolean {
  const v = source[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function evaluateSplitCapability(
  source: Record<string, string | undefined> = process.env
): SplitCapability {
  const sellerOAuthConfigured = Boolean(
    source.MERCADO_PAGO_CLIENT_ID?.trim() && source.MERCADO_PAGO_CLIENT_SECRET?.trim()
  );
  const marketplaceSplitEnvEnabled = envFlag(source, "MP_MARKETPLACE_SPLIT_ENABLED");
  const reasons = [
    "Checkout atual é API Orders (/v1/orders) no token da plataforma (1 collector).",
    "Carrinho/checkout são 1 pedido : 1 parceiro (MULTI_PARTNER_CART bloqueado).",
    "marketplace_fee/application_fee não são enviados — parâmetros incompatíveis com o produto Orders atual.",
    "Repasse automático Mercado Pago exige conta marketplace + OAuth do seller + collector do parceiro.",
  ];
  if (!sellerOAuthConfigured) {
    reasons.push("MERCADO_PAGO_CLIENT_ID/SECRET ausentes — OAuth do vendedor não configurado.");
  }
  if (!marketplaceSplitEnvEnabled) {
    reasons.push("MP_MARKETPLACE_SPLIT_ENABLED não está ativo (default fail-closed).");
  }

  return {
    topology: "ONE_ORDER_ONE_PARTNER",
    mpProduct: "orders_api_platform_collector",
    marketplaceFeeCompatibleWithCurrentCheckout: false,
    sellerOAuthConfigured,
    marketplaceSplitEnvEnabled,
    splitReady: false,
    decision: "SPLIT_REQUIRES_MP_ENABLEMENT",
    reasons,
  };
}

/** Adapter: o que pode ir no payload /v1/orders. Nunca injeta marketplace_fee. */
export function marketplaceParamsForOrdersApi(_capability: SplitCapability): Record<string, never> {
  return {};
}
