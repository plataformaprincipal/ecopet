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
  });

  return apiSuccess({ orders, total: orders.length });
}
