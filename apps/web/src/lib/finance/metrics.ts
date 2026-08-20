/**
 * Definições centrais de métricas comerciais.
 * GMV ≠ receita EccoPet ≠ valor do parceiro ≠ payout.
 * Pedido antigo NÃO é recalculado com a tabela vigente.
 */

export type SnapshotLike = {
  grossAmount?: number | null;
  platformFeeAmount?: number | null;
  partnerAmount?: number | null;
  discount?: number | null;
  reserveAmount?: number | null;
  pricingSnapshot?: unknown;
  total?: number | null;
};

export type CommerceMetrics = {
  gmv: number;
  platformRevenue: number;
  partnerEconomicValue: number;
  discountAmount: number;
  reserveAmount: number;
  estimatedPayout: number;
  orderCount: number;
};

function centsToBrl(cents: unknown): number | null {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return null;
  return cents / 100;
}

export function metricsFromPricingSnapshot(raw: unknown): Partial<CommerceMetrics> | null {
  if (!raw || typeof raw !== "object") return null;
  const snap = raw as Record<string, unknown>;
  if (snap.fallback === "commerce-allocation") return null;
  const gmv = centsToBrl(snap.baseAmountCents);
  const platformRevenue = centsToBrl(snap.eccopetRevenueCents);
  const partnerEconomicValue = centsToBrl(snap.partnerEconomicAmountCents);
  const discountAmount = centsToBrl(snap.discountCents);
  const reserveAmount = centsToBrl(snap.reserveCents);
  const estimatedPayout = centsToBrl(snap.estimatedPayoutCents);
  if (gmv == null && platformRevenue == null) return null;
  return {
    gmv: gmv ?? 0,
    platformRevenue: platformRevenue ?? 0,
    partnerEconomicValue: partnerEconomicValue ?? 0,
    discountAmount: discountAmount ?? 0,
    reserveAmount: reserveAmount ?? 0,
    estimatedPayout: estimatedPayout ?? 0,
  };
}

/** Usa snapshot imutável; se ausente, campos persistidos no pedido (não recalcula %). */
export function metricsFromOrderRow(order: SnapshotLike): CommerceMetrics {
  const fromSnap = metricsFromPricingSnapshot(order.pricingSnapshot);
  if (fromSnap) {
    return {
      gmv: fromSnap.gmv ?? 0,
      platformRevenue: fromSnap.platformRevenue ?? 0,
      partnerEconomicValue: fromSnap.partnerEconomicValue ?? 0,
      discountAmount: fromSnap.discountAmount ?? 0,
      reserveAmount: fromSnap.reserveAmount ?? 0,
      estimatedPayout: fromSnap.estimatedPayout ?? 0,
      orderCount: 1,
    };
  }
  const gmv = Number(order.grossAmount ?? order.total ?? 0);
  return {
    gmv,
    platformRevenue: Number(order.platformFeeAmount ?? 0),
    partnerEconomicValue: Number(order.partnerAmount ?? 0),
    discountAmount: Number(order.discount ?? 0),
    reserveAmount: Number(order.reserveAmount ?? 0),
    estimatedPayout: Number(order.partnerAmount ?? 0),
    orderCount: 1,
  };
}

export function sumCommerceMetrics(rows: SnapshotLike[]): CommerceMetrics {
  return rows.reduce<CommerceMetrics>(
    (acc, row) => {
      const m = metricsFromOrderRow(row);
      acc.gmv += m.gmv;
      acc.platformRevenue += m.platformRevenue;
      acc.partnerEconomicValue += m.partnerEconomicValue;
      acc.discountAmount += m.discountAmount;
      acc.reserveAmount += m.reserveAmount;
      acc.estimatedPayout += m.estimatedPayout;
      acc.orderCount += 1;
      return acc;
    },
    {
      gmv: 0,
      platformRevenue: 0,
      partnerEconomicValue: 0,
      discountAmount: 0,
      reserveAmount: 0,
      estimatedPayout: 0,
      orderCount: 0,
    }
  );
}

export function roundMetric(n: number): number {
  return Math.round(n * 100) / 100;
}

export function humanizeOrderPricing(order: SnapshotLike) {
  const m = metricsFromOrderRow(order);
  return {
    customerPaid: roundMetric(m.gmv - m.discountAmount),
    itemsSubtotal: roundMetric(m.gmv),
    discount: roundMetric(m.discountAmount),
    platformFee: roundMetric(m.platformRevenue),
    partnerShare: roundMetric(m.partnerEconomicValue),
    labels: {
      platformFee: "Taxa EccoPet",
      partnerShare: "Valor do vendedor",
      discount: "Desconto",
    },
  };
}

export const METRIC_DEFINITIONS = {
  gmv: "Volume transacionado (preço seller/prestador × quantidade). Não é receita EccoPet.",
  platformRevenue: "Receita própria EccoPet (comissão + taxas fixas/booking/urgent) no snapshot.",
  partnerEconomicValue: "Valor econômico do parceiro antes de reserva/PSP. Não é saldo disponível.",
  estimatedPayout: "Estimativa de repasse após reserva/PSP. Não é payout liquidado.",
  refundAmount: "Estornos registrados em Payment/ledger. Não recalcula pedido.",
} as const;
