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
    },
  });

  if (!order) return apiFailure("NOT_FOUND", "Pedido não encontrado.", 404);
  return apiSuccess({ order });
}
