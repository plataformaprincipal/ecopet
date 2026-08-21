import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { orderId } = await ctx.params;
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user!.id },
    include: { items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) return apiFailure("NOT_FOUND", "Pedido não encontrado.", 404);
  return apiSuccess({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      items: order.items.map((i) => ({
        name: i.name,
        sku: i.sku,
        petId: i.petId,
        quantity: i.quantity,
        itemType: i.itemType,
      })),
      paymentStatus: order.payments[0]?.status ?? null,
    },
  });
}
