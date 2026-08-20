/**
 * Settlement operacional a partir de snapshot + ledger + payout.
 * Não simula dinheiro. Estimativa ≠ liquidado.
 */

import { OFFICIAL_RULES } from "@/lib/pricing/official-rules";
import { metricsFromOrderRow, type SnapshotLike } from "@/lib/finance/metrics";

export type PaymentLifecycleStatus =
  | "CREATED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "CHARGEBACK"
  | "OTHER";

export type SettlementStatus =
  | "NOT_STARTED"
  | "PAYMENT_PENDING"
  | "LEDGER_POSTED"
  | "HELD"
  | "ELIGIBLE"
  | "PAID_SANDBOX"
  | "REVERSED"
  | "FAILED";

export type OperationalPayoutStatus =
  | "NOT_APPLICABLE"
  | "PENDING"
  | "HELD"
  | "ELIGIBLE"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REVERSED";

export type SettlementProjection = {
  orderId: string;
  paymentId: string | null;
  partnerId: string | null;
  pricingVersion: string | null;
  paymentStatus: PaymentLifecycleStatus;
  settlementStatus: SettlementStatus;
  payoutStatus: OperationalPayoutStatus;
  gmv: number;
  platformRevenue: number;
  partnerEconomicAmount: number;
  estimatedPartnerAmount: number;
  actualPartnerAmount: number | null;
  estimatedPayoutAt: string | null;
  actualPayoutAt: string | null;
  riskReserveEstimate: number;
  actualHeldAmount: number | null;
  pspFeeEstimate: number;
  pspFeeActual: number | null;
  discount: number;
  refundAmount: number;
  chargebackAmount: number;
  splitReady: false;
  labels: {
    estimatedPartnerAmount: "Estimativa";
    actualPartnerAmount: "Ledger / liquidado";
    riskReserveEstimate: "Reserva de planejamento (1,5%) — não é hold PSP";
    payout: "Estimativa até o PSP liquidar";
  };
};

function mapPaymentStatus(raw?: string | null): PaymentLifecycleStatus {
  const s = (raw ?? "").toUpperCase();
  if (s === "CREATED") return "CREATED";
  if (s === "PENDING" || s === "PROCESSING" || s === "ACTION_REQUIRED") return "PENDING";
  if (s === "APPROVED" || s === "PAID") return "APPROVED";
  if (s === "REJECTED") return "REJECTED";
  if (s === "CANCELLED" || s === "EXPIRED") return "CANCELLED";
  if (s === "REFUNDED") return "REFUNDED";
  if (s === "PARTIALLY_REFUNDED") return "PARTIALLY_REFUNDED";
  if (s === "CHARGED_BACK" || s === "CHARGEBACK") return "CHARGEBACK";
  return "OTHER";
}

function snapshotKind(raw: unknown): "PRODUCT" | "SERVICE" {
  if (!raw || typeof raw !== "object") return "PRODUCT";
  const snap = raw as Record<string, unknown>;
  const kind = String(snap.kind ?? "").toUpperCase();
  if (kind === "SERVICE" || kind === "HEALTH") return "SERVICE";
  if (typeof snap.bookingFeeCents === "number" && snap.bookingFeeCents > 0) return "SERVICE";
  return "PRODUCT";
}

function centsToBrl(cents: number | null | undefined): number | null {
  if (cents == null || !Number.isFinite(cents)) return null;
  return Math.round(cents) / 100;
}

export function projectSettlement(input: {
  orderId: string;
  partnerId?: string | null;
  pricingVersion?: string | null;
  order: SnapshotLike & { createdAt?: Date | string | null; gatewayFeeEstimated?: number | null; gatewayFeeActual?: number | null };
  payment?: { id: string; status: string; refundedAmount?: number | null; approvedAt?: Date | string | null } | null;
  ledgerPosted?: boolean;
  partnerPayableCents?: number | null;
  reserveHeldCents?: number | null;
  payoutStatus?: string | null;
  payoutPaidAt?: Date | string | null;
  chargebackAmountCents?: number | null;
}): SettlementProjection {
  const metrics = metricsFromOrderRow(input.order);
  const paymentStatus = mapPaymentStatus(input.payment?.status);
  const kind = snapshotKind(input.order.pricingSnapshot);
  const holdDays = kind === "SERVICE" ? OFFICIAL_RULES.servicePayoutDays : OFFICIAL_RULES.productPayoutDays;
  const approvedAt = input.payment?.approvedAt ? new Date(input.payment.approvedAt) : null;
  const estimatedPayoutAt =
    approvedAt && !Number.isNaN(approvedAt.getTime())
      ? new Date(approvedAt.getTime() + holdDays * 86_400_000).toISOString()
      : null;

  let settlementStatus: SettlementStatus = "NOT_STARTED";
  if (paymentStatus === "PENDING" || paymentStatus === "CREATED") settlementStatus = "PAYMENT_PENDING";
  if (paymentStatus === "APPROVED" && input.ledgerPosted) settlementStatus = "LEDGER_POSTED";
  if (settlementStatus === "LEDGER_POSTED" && (input.reserveHeldCents ?? 0) > 0) settlementStatus = "HELD";
  if (
    settlementStatus === "LEDGER_POSTED" ||
    settlementStatus === "HELD"
  ) {
    if (estimatedPayoutAt && Date.now() >= new Date(estimatedPayoutAt).getTime() && (input.reserveHeldCents ?? 0) <= 0) {
      settlementStatus = "ELIGIBLE";
    }
  }
  const payoutRaw = (input.payoutStatus ?? "").toUpperCase();
  if (payoutRaw === "PAID") settlementStatus = "PAID_SANDBOX";
  if (payoutRaw === "FAILED") settlementStatus = "FAILED";
  if (payoutRaw === "REVERSED" || paymentStatus === "REFUNDED" || paymentStatus === "CHARGEBACK") {
    settlementStatus = "REVERSED";
  }

  let payoutStatus: OperationalPayoutStatus = "NOT_APPLICABLE";
  if (paymentStatus === "APPROVED") payoutStatus = "PENDING";
  if (settlementStatus === "HELD") payoutStatus = "HELD";
  if (settlementStatus === "ELIGIBLE") payoutStatus = "ELIGIBLE";
  if (payoutRaw === "PROCESSING") payoutStatus = "PROCESSING";
  if (payoutRaw === "PAID") payoutStatus = "PAID";
  if (payoutRaw === "FAILED") payoutStatus = "FAILED";
  if (payoutRaw === "REVERSED" || settlementStatus === "REVERSED") payoutStatus = "REVERSED";
  if (paymentStatus === "PENDING" || paymentStatus === "CREATED" || paymentStatus === "REJECTED") {
    payoutStatus = "NOT_APPLICABLE";
  }

  const actualPartner = centsToBrl(input.partnerPayableCents);
  const actualHeld = centsToBrl(input.reserveHeldCents);
  const pspActual = input.order.gatewayFeeActual ?? null;

  return {
    orderId: input.orderId,
    paymentId: input.payment?.id ?? null,
    partnerId: input.partnerId ?? null,
    pricingVersion: input.pricingVersion ?? null,
    paymentStatus,
    settlementStatus,
    payoutStatus,
    gmv: metrics.gmv,
    platformRevenue: metrics.platformRevenue,
    partnerEconomicAmount: metrics.partnerEconomicValue,
    estimatedPartnerAmount: metrics.estimatedPayout,
    actualPartnerAmount: actualPartner,
    estimatedPayoutAt,
    actualPayoutAt: input.payoutPaidAt ? new Date(input.payoutPaidAt).toISOString() : null,
    riskReserveEstimate: metrics.reserveAmount,
    actualHeldAmount: actualHeld,
    pspFeeEstimate: Number(input.order.gatewayFeeEstimated ?? 0),
    pspFeeActual: pspActual,
    discount: metrics.discountAmount,
    refundAmount: Number(input.payment?.refundedAmount ?? 0),
    chargebackAmount: centsToBrl(input.chargebackAmountCents) ?? 0,
    splitReady: false,
    labels: {
      estimatedPartnerAmount: "Estimativa",
      actualPartnerAmount: "Ledger / liquidado",
      riskReserveEstimate: "Reserva de planejamento (1,5%) — não é hold PSP",
      payout: "Estimativa até o PSP liquidar",
    },
  };
}
