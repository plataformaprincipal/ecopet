import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const { orderId } = await context.params;

  const order = await prisma.order.findFirst({
    where: { id: orderId, partnerId: user!.id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      fulfillments: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
      payments: {
        where: { OR: [{ partnerId: user!.id }, { partnerId: null }] },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!order) return apiFailure("NOT_FOUND", "Pedido não encontrado.", 404);

  const { toPartnerPaymentView } = await import("@/lib/mercado-pago/payment-views");
  const { payments, ...rest } = order;
  return apiSuccess({
    order: {
      ...rest,
      payments: payments.map(toPartnerPaymentView),
      financialNote:
        "Valores líquidos são estimativas. Split/repasse automático Mercado Pago ainda não está ativo.",
    },
  });
}
