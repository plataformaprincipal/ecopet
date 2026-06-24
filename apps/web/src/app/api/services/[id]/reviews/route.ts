import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { id: serviceId } = await context.params;
  const reviews = await prisma.serviceReview.findMany({
    where: { serviceId, moderationStatus: "VISIBLE" },
    include: {
      user: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return apiSuccess({ reviews, total: reviews.length });
}
