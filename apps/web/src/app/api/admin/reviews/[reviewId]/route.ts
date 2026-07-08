import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { reviewModerationSchema } from "@/schemas/review";

type RouteContext = { params: Promise<{ reviewId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireAdmin({ path: new URL(request.url).pathname });
  if (error) return error;
  const { reviewId } = await context.params;

  const parsed = reviewModerationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  const existing = await prisma.serviceReview.findUnique({ where: { id: reviewId } });
  if (!existing) return apiFailure("NOT_FOUND", "Avaliação não encontrada.", 404);

  const now = new Date();
  const { action, reason } = parsed.data;

  const review = await prisma.$transaction(async (tx) => {
    let updated;
    if (action === "hide") {
      updated = await tx.serviceReview.update({
        where: { id: reviewId },
        data: { moderationStatus: "HIDDEN", hiddenAt: now, hiddenBy: user!.id },
      });
    } else if (action === "restore") {
      updated = await tx.serviceReview.update({
        where: { id: reviewId },
        data: { moderationStatus: "VISIBLE", hiddenAt: null, hiddenBy: null },
      });
    } else {
      updated = await tx.serviceReview.update({
        where: { id: reviewId },
        data: {
          moderationStatus: "REPORTED",
          reportCount: { increment: 1 },
        },
      });
    }

    const [avgResult, reviewCount] = await Promise.all([
      tx.serviceReview.aggregate({
        where: { serviceId: existing.serviceId, moderationStatus: "VISIBLE" },
        _avg: { rating: true },
      }),
      tx.serviceReview.count({
        where: { serviceId: existing.serviceId, moderationStatus: "VISIBLE" },
      }),
    ]);

    await tx.service.update({
      where: { id: existing.serviceId },
      data: {
        rating: avgResult._avg.rating ?? 0,
        reviewCount,
      },
    });

    return updated;
  });

  return apiSuccess({ review, reason: reason ?? null });
}
