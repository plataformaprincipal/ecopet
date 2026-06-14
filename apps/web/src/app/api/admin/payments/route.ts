import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      order: { select: { orderNumber: true, status: true, userId: true } },
    },
  });

  return apiSuccess({
    payments: payments.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      orderNumber: p.order.orderNumber,
      orderStatus: p.order.status,
      provider: p.provider,
      externalId: p.externalId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    total: payments.length,
  });
}
