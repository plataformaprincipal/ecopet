/**
 * Capacidade de split Mercado Pago.
 *
 * Nível plataforma (sem parceiro): splitReady é sempre false.
 * Nível pedido: splitReady só com parceiro CONNECTED + collector (mpUserId) + OAuth.
 * Carrinho multi-parceiro permanece bloqueado.
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
  mpProduct: "orders_api_platform_collector" | "payments_api_marketplace";
  marketplaceFeeCompatibleWithCurrentCheckout: boolean;
  sellerOAuthConfigured: boolean;
  marketplaceSplitEnvEnabled: boolean;
  partnerConnected: boolean;
  collectorId: string | null;
  splitReady: boolean;
  decision: SplitDecision;
  reasons: string[];
};

export type PartnerSplitConnectionInput = {
  status: string;
  mpUserId: string | null;
  expiresAt?: string | Date | null;
};

function envFlag(source: Record<string, string | undefined>, name: string): boolean {
  const v = source[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function envFlagOff(source: Record<string, string | undefined>, name: string): boolean {
  const v = source[name]?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "no" || v === "off";
}

function oauthConfigured(source: Record<string, string | undefined>): boolean {
  return Boolean(source.MERCADO_PAGO_CLIENT_ID?.trim() && source.MERCADO_PAGO_CLIENT_SECRET?.trim());
}

function connectionUsable(connection: PartnerSplitConnectionInput | null | undefined): {
  ok: boolean;
  collectorId: string | null;
} {
  if (!connection) return { ok: false, collectorId: null };
  const collectorId = connection.mpUserId?.trim() || null;
  if (connection.status !== "CONNECTED" || !collectorId) {
    return { ok: false, collectorId };
  }
  if (connection.expiresAt) {
    const exp = new Date(connection.expiresAt).getTime();
    if (Number.isFinite(exp) && exp < Date.now()) {
      return { ok: false, collectorId };
    }
  }
  return { ok: true, collectorId };
}

/**
 * Avaliação de plataforma. Sem contexto de parceiro — splitReady permanece false.
 * Testes e health checks de launch usam esta função.
 */
export function evaluateSplitCapability(
  source: Record<string, string | undefined> = process.env
): SplitCapability {
  const sellerOAuthConfigured = oauthConfigured(source);
  const marketplaceSplitEnvEnabled = envFlag(source, "MP_MARKETPLACE_SPLIT_ENABLED");
  const reasons = [
    "Checkout padrão é API Orders (/v1/orders) no token da plataforma (1 collector).",
    "Carrinho/checkout são 1 pedido : 1 parceiro (MULTI_PARTNER_CART bloqueado).",
    "Split real (Payments API + application_fee + collector do seller) só ativa por pedido quando o parceiro está CONNECTED.",
  ];
  if (!sellerOAuthConfigured) {
    reasons.push("MERCADO_PAGO_CLIENT_ID/SECRET ausentes — OAuth do vendedor não configurado.");
  }
  if (!marketplaceSplitEnvEnabled) {
    reasons.push("MP_MARKETPLACE_SPLIT_ENABLED não está ativo (kill-switch de plataforma).");
  }

  return {
    topology: "ONE_ORDER_ONE_PARTNER",
    mpProduct: "orders_api_platform_collector",
    marketplaceFeeCompatibleWithCurrentCheckout: false,
    sellerOAuthConfigured,
    marketplaceSplitEnvEnabled,
    partnerConnected: false,
    collectorId: null,
    splitReady: false,
    decision: "SPLIT_REQUIRES_MP_ENABLEMENT",
    reasons,
  };
}

/**
 * Avaliação por pedido/parceiro. splitReady=true somente com conta recebedora real conectada.
 */
export function evaluateMarketplaceSplit(params: {
  source?: Record<string, string | undefined>;
  partnerConnection: PartnerSplitConnectionInput | null;
  multiPartnerCart?: boolean;
  applicationFeeAmount?: number;
  transactionAmount?: number;
}): SplitCapability {
  const source = params.source ?? process.env;
  const sellerOAuthConfigured = oauthConfigured(source);
  const killSwitch = envFlagOff(source, "MP_MARKETPLACE_SPLIT_ENABLED");
  const marketplaceSplitEnvEnabled = !killSwitch;
  const usable = connectionUsable(params.partnerConnection);
  const reasons: string[] = [];

  if (params.multiPartnerCart) {
    reasons.push("Carrinho multi-parceiro bloqueado (ONE_ORDER_ONE_PARTNER).");
    return {
      topology: "ONE_ORDER_MULTI_PARTNER",
      mpProduct: "orders_api_platform_collector",
      marketplaceFeeCompatibleWithCurrentCheckout: false,
      sellerOAuthConfigured,
      marketplaceSplitEnvEnabled,
      partnerConnected: usable.ok,
      collectorId: usable.collectorId,
      splitReady: false,
      decision: "ARCHITECTURE_BLOCKED",
      reasons,
    };
  }

  if (!sellerOAuthConfigured) {
    reasons.push("OAuth do vendedor não configurado (CLIENT_ID/SECRET).");
  }
  if (killSwitch) {
    reasons.push("MP_MARKETPLACE_SPLIT_ENABLED=0 — kill-switch de plataforma.");
  }
  if (!usable.ok) {
    reasons.push("Parceiro sem conexão Mercado Pago CONNECTED com collector (mpUserId) válido.");
  }
  const fee = params.applicationFeeAmount ?? 0;
  const amount = params.transactionAmount ?? 0;
  if (amount > 0 && (fee <= 0 || fee >= amount)) {
    reasons.push("application_fee inválida para o valor do pedido.");
  }

  const splitReady =
    sellerOAuthConfigured &&
    marketplaceSplitEnvEnabled &&
    usable.ok &&
    amount > 0 &&
    fee > 0 &&
    fee < amount;

  return {
    topology: "ONE_ORDER_ONE_PARTNER",
    mpProduct: splitReady ? "payments_api_marketplace" : "orders_api_platform_collector",
    marketplaceFeeCompatibleWithCurrentCheckout: splitReady,
    sellerOAuthConfigured,
    marketplaceSplitEnvEnabled,
    partnerConnected: usable.ok,
    collectorId: usable.collectorId,
    splitReady,
    decision: splitReady ? "SPLIT_READY" : "SPLIT_REQUIRES_MP_ENABLEMENT",
    reasons: splitReady
      ? ["Parceiro CONNECTED. Pagamento via Payments API com application_fee e conta recebedora do seller."]
      : reasons,
  };
}

/** Adapter: o que pode ir no payload /v1/orders. Nunca injeta marketplace_fee. */
export function marketplaceParamsForOrdersApi(_capability: SplitCapability): Record<string, never> {
  return {};
}

export function proportionalApplicationFee(params: {
  originalAmount: number;
  refundAmount: number;
  applicationFee: number;
}): number {
  const original = Number(params.originalAmount);
  const refund = Number(params.refundAmount);
  const fee = Number(params.applicationFee);
  if (!(original > 0) || !(refund > 0) || !(fee > 0)) return 0;
  const ratio = Math.min(1, refund / original);
  return Math.round(fee * ratio * 100) / 100;
}
