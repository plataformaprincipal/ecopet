import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";

export async function GET() {
  const { user, error } = await requireActivePartner();
  if (error) return error;

  const orders = await prisma.order.findMany({
    where: { partnerId: user!.id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ orders, total: orders.length });
}
