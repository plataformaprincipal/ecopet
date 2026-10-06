import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { serializeClientOrder } from "@/lib/commerce/order-access";
import { reconcilePaidPlatformOrders } from "@/lib/commerce/fulfill-approved-order";

const orderInclude = {
  items: true,
  statusHistory: { orderBy: { createdAt: "asc" as const } },
  payments: { orderBy: { createdAt: "desc" as const }, take: 5 },
  aiEntitlements: true,
  catalogEntitlements: true,
  catalogSubscriptions: true,
  partner: { select: { name: true } },
} as const;

export async function GET() {
  const { user, error } = await requireClient();
  if (error) return error;

  await reconcilePaidPlatformOrders({ userId: user!.id, limit: 40 }).catch(() => undefined);

  const orders = await prisma.order.findMany({
    where: { userId: user!.id },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return apiSuccess({
    orders: orders.map(serializeClientOrder),
    total: orders.length,
  });
}
