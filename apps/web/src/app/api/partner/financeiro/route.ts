import { apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { toPartnerPaymentView } from "@/lib/mercado-pago/payment-views";

export const dynamic = "force-dynamic";

/** Isolamento estrito: partnerId = user autenticado (nunca do body). */
export async function GET() {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const partnerId = user!.id;

  const [orders, claims, disputes, fraudAlerts, payments] = await Promise.all([
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
  ]);

  const gross = payments
    .filter((p) => p.status === "APPROVED")
    .reduce((s, p) => s + p.amount, 0);
  const disputed = disputes
    .filter((d) => d.payoutBlocked)
    .reduce((s, d) => s + (d.amount ?? 0), 0);

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
    summary: {
      grossApprovedEstimated: gross,
      blockedInDisputeEstimated: disputed,
      splitImplemented: false,
      note: "Líquido estimado. Split/repasse automático Mercado Pago não está ativo.",
    },
  });
}
