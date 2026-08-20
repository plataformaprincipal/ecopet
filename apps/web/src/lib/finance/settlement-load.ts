import "server-only";

import { prisma } from "@/lib/prisma";
import { projectSettlement, type SettlementProjection } from "@/lib/finance/settlement";

export async function loadSettlementForOrder(orderId: string): Promise<SettlementProjection | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) return null;

  const payment = order.payments[0] ?? null;
  const [payable, held, payout, chargeback] = await Promise.all([
    payment
      ? prisma.financialLedgerEntry.aggregate({
          where: { paymentId: payment.id, entryType: "PARTNER_PAYABLE", direction: "CREDIT" },
          _sum: { amountCents: true },
        })
      : Promise.resolve({ _sum: { amountCents: null } }),
    payment
      ? prisma.financialLedgerEntry.aggregate({
          where: { paymentId: payment.id, entryType: "RESERVE_HOLD", status: "BLOCKED" },
          _sum: { amountCents: true },
        })
      : Promise.resolve({ _sum: { amountCents: null } }),
    prisma.partnerPayout.findFirst({
      where: { orderId: order.id },
      orderBy: { requestedAt: "desc" },
      select: { status: true, paidAt: true },
    }),
    payment
      ? prisma.financialChargeback.aggregate({
          where: { paymentId: payment.id, status: { in: ["OPEN", "UNDER_REVIEW", "LOST"] } },
          _sum: { amountCents: true },
        })
      : Promise.resolve({ _sum: { amountCents: null } }),
  ]);

  return projectSettlement({
    orderId: order.id,
    partnerId: order.partnerId,
    pricingVersion: order.pricingVersion,
    order: {
      grossAmount: order.grossAmount,
      platformFeeAmount: order.platformFeeAmount,
      partnerAmount: order.partnerAmount,
      discount: order.discount,
      reserveAmount: order.reserveAmount,
      pricingSnapshot: order.pricingSnapshot,
      total: order.total,
      gatewayFeeEstimated: order.gatewayFeeEstimated,
      gatewayFeeActual: order.gatewayFeeActual,
      createdAt: order.createdAt,
    },
    payment: payment
      ? {
          id: payment.id,
          status: payment.status,
          refundedAmount: payment.refundedAmount,
          approvedAt: payment.approvedAt,
        }
      : null,
    ledgerPosted: Boolean(order.financialLedgerPostedAt),
    partnerPayableCents: payable._sum.amountCents,
    reserveHeldCents: held._sum.amountCents,
    payoutStatus: payout?.status ?? null,
    payoutPaidAt: payout?.paidAt ?? null,
    chargebackAmountCents: chargeback._sum.amountCents,
  });
}
