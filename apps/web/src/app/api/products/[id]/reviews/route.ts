import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { id: productId } = await context.params;
  const reviews = await prisma.review.findMany({
    where: { productId, moderationStatus: "VISIBLE" },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return apiSuccess({ reviews, total: reviews.length });
}
