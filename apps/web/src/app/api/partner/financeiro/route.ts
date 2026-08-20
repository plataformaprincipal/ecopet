import { apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { toPartnerPaymentView } from "@/lib/mercado-pago/payment-views";
import { evaluateSplitCapability } from "@/lib/finance/split-capability";
import { getPartnerMpConnectionView } from "@/lib/mercado-pago/partner-oauth";
import { loadSettlementForOrder } from "@/lib/finance/settlement-load";

export const dynamic = "force-dynamic";

/** Isolamento estrito: partnerId = user autenticado (nunca do body). */
export async function GET() {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const partnerId = user!.id;

  const [orders, claims, disputes, fraudAlerts, payments, financeAgg, refundAgg, chargebackAgg] = await Promise.all([
    prisma.order.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        trackingCode: true,
        fraudHold: true,
        fulfillmentBlocked: true,
        createdAt: true,
      },
    }),
    prisma.mpClaim.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.mpDispute.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.mpFraudAlert.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        orderId: true,
        createdAt: true,
        description: true,
      },
    }),
    prisma.payment.findMany({
      where: { partnerId, provider: "mercado_pago" },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.order.aggregate({
      where: {
        partnerId,
        status: { in: ["PAID", "COMPLETED", "DELIVERED", "SHIPPED", "CONFIRMED"] },
      },
      _sum: {
        grossAmount: true,
        platformFeeAmount: true,
        partnerAmount: true,
        reserveAmount: true,
        discount: true,
      },
    }),
    prisma.payment.aggregate({
      where: { partnerId, refundedAmount: { gt: 0 } },
      _sum: { refundedAmount: true },
    }),
    prisma.financialChargeback.aggregate({
      where: { partnerId, status: { in: ["OPEN", "UNDER_REVIEW", "LOST"] } },
      _sum: { amountCents: true },
    }),
  ]);

  const gross = payments
    .filter((p) => p.status === "APPROVED")
    .reduce((s, p) => s + p.amount, 0);
  const disputed = disputes
    .filter((d) => d.payoutBlocked)
    .reduce((s, d) => s + (d.amount ?? 0), 0);

  const cap = evaluateSplitCapability();
  const connection = await getPartnerMpConnectionView(partnerId);
  const settlements = await Promise.all(orders.slice(0, 15).map((o) => loadSettlementForOrder(o.id)));

  return apiSuccess({
    orders,
    payments: payments.map(toPartnerPaymentView),
    claims,
    disputes,
    fraudAlerts: fraudAlerts.map((f) => ({
      id: f.id,
      status: f.status,
      orderId: f.orderId,
      createdAt: f.createdAt,
      message: "Expedição bloqueada — revise o pedido. Critérios internos omitidos.",
    })),
    mpConnection: connection,
    split: {
      splitReady: false,
      splitImplemented: false,
      decision: cap.decision,
      topology: cap.topology,
      reasons: cap.reasons,
    },
    settlements: settlements.filter(Boolean),
    summary: {
      gmv: financeAgg._sum.grossAmount ?? 0,
      platformRevenue: financeAgg._sum.platformFeeAmount ?? 0,
      partnerEconomicValue: financeAgg._sum.partnerAmount ?? 0,
      reserveAmount: financeAgg._sum.reserveAmount ?? 0,
      discountAmount: financeAgg._sum.discount ?? 0,
      refundAmount: refundAgg._sum.refundedAmount ?? 0,
      chargebackOpenAmount: (chargebackAgg._sum.amountCents ?? 0) / 100,
      grossApprovedEstimated: gross,
      blockedInDisputeEstimated: disputed,
      splitImplemented: false,
      splitReady: false,
      note: "GMV ≠ receita EccoPet ≠ payout. Split/repasse automático Mercado Pago não está ativo. Estimativa não é saldo disponível.",
    },
  });
}
