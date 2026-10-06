import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  const orders = await prisma.order.findMany({
    where: { userId: user!.id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return apiSuccess({
    orders: orders.map((o) => {
      const snap = (o.pricingSnapshot as Record<string, unknown> | null) ?? {};
      const checkoutSession = (snap.checkoutSession as Record<string, unknown> | null) ?? null;
      const { pricingSnapshot: _snap, ...rest } = o;
      void _snap;
      return {
        ...rest,
        partnerId: o.partnerId,
        checkoutSession,
      };
    }),
    total: orders.length,
  });
}
