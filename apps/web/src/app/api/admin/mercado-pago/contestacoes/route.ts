import { UserRole } from "@prisma/client";
import { apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireRole(UserRole.ADMIN);
  if (error) return error;
  const disputes = await prisma.mpDispute.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { order: { select: { id: true, orderNumber: true, total: true } } },
  });
  return apiSuccess({ disputes });
}
