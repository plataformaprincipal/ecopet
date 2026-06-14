import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { user, error } = await requireClient();
  if (error) return error;
  const { orderId } = await context.params;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user!.id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      fulfillments: true,
    },
  });

  if (!order) return apiFailure("NOT_FOUND", "Pedido não encontrado.", 404);
  return apiSuccess({ order });
}
