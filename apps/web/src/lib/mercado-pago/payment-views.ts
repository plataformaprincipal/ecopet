import "server-only";

import type { Payment } from "@prisma/client";

type PaymentMeta = {
  platformFeeEstimated?: number | null;
  partnerNetEstimated?: number | null;
  splitReady?: boolean;
};

/** Visão segura para o cliente. */
export function toClientPaymentView(p: Payment) {
  return {
    id: p.id,
    provider: p.provider,
    environment: p.environment,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    statusDetail: p.statusDetail,
    paymentMethod: p.paymentMethod,
    approvedAt: p.approvedAt,
    cancelledAt: p.cancelledAt,
    refundedAt: p.refundedAt,
    createdAt: p.createdAt,
    canRetry: ["REJECTED", "CANCELLED", "EXPIRED", "ERROR", "PENDING", "CREATED"].includes(
      p.status
    ),
  };
}

/** Visão financeira estimada para o parceiro (sem split real). */
export function toPartnerPaymentView(p: Payment) {
  const meta = (p.metadata as PaymentMeta | null) ?? {};
  const gross = p.amount;
  const fee = typeof meta.platformFeeEstimated === "number" ? meta.platformFeeEstimated : null;
  const net =
    typeof meta.partnerNetEstimated === "number"
      ? meta.partnerNetEstimated
      : fee != null
        ? gross - fee
        : gross;

  return {
    id: p.id,
    provider: p.provider,
    status: p.status,
    statusDetail: p.statusDetail,
    paymentMethod: p.paymentMethod,
    gross,
    platformFeeEstimated: fee,
    partnerNetEstimated: net,
    payoutStatus: meta.splitReady ? "SPLIT_READY" : "SPLIT_PENDING",
    splitImplemented: false,
    approvedAt: p.approvedAt,
    cancelledAt: p.cancelledAt,
    refundedAt: p.refundedAt,
    createdAt: p.createdAt,
  };
}
