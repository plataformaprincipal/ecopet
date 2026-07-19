import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { toClientPaymentView } from "@/lib/mercado-pago/payment-views";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const [orders, claims, disputes, shipments] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        trackingCode: true,
        estimatedDelivery: true,
        fraudHold: true,
        fulfillmentBlocked: true,
        createdAt: true,
        payments: {
          where: { provider: "mercado_pago" },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    }),
    prisma.mpClaim.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        reason: true,
        amount: true,
        dueDate: true,
        orderId: true,
        createdAt: true,
      },
    }),
    prisma.mpDispute.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        amount: true,
        orderId: true,
        createdAt: true,
      },
    }),
    prisma.mpShipment.findMany({
      where: { order: { userId: user!.id } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        trackingCode: true,
        carrier: true,
        estimatedDelivery: true,
        orderId: true,
      },
    }),
  ]);

  return apiSuccess({
    orders: orders.map((o) => ({
      ...o,
      payments: o.payments.map(toClientPaymentView),
      alerts: o.fraudHold
        ? ["Pedido em revisão de segurança — detalhes internos não são exibidos."]
        : [],
    })),
    claims,
    disputes,
    shipments,
    subscriptionsNote:
      "Assinaturas Mercado Pago não estão ativas no EcoPet. Nenhuma cobrança recorrente.",
  });
}
