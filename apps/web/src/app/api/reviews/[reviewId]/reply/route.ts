import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { createInternalNotification } from "@/lib/notifications/internal";

const schema = z.object({
  reply: z.string().min(2).max(2000),
});

type RouteContext = { params: Promise<{ reviewId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const { reviewId } = await context.params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiFailure("VALIDATION", "Resposta inválida.", 400);

  const review = await prisma.review.findFirst({
    where: { id: reviewId, product: { sellerId: user!.id } },
    include: { product: { select: { name: true } } },
  });
  if (!review) return apiFailure("NOT_FOUND", "Avaliação não encontrada.", 404);
  if (review.partnerReply) return apiFailure("CONFLICT", "Esta avaliação já foi respondida.", 409);

  const updated = await prisma.review.update({
    where: { id: review.id },
    data: { partnerReply: parsed.data.reply },
  });
  await createInternalNotification({
    userId: review.userId,
    title: "O vendedor respondeu sua avaliação",
    body: `Resposta em ${review.product.name}.`,
    type: "REVIEW",
    actionUrl: `/produtos/${review.productId}`,
    data: { reviewId: review.id },
  }).catch(() => undefined);
  return apiSuccess({ review: updated });
}
