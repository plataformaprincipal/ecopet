import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";

const moderateSchema = z.object({
  action: z.enum(["hide", "restore"]),
  reason: z.string().optional().nullable(),
});

type RouteContext = { params: Promise<{ productId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireAuth([UserRole.ADMIN]);
  if (error) return error;
  const { productId } = await context.params;

  const parsed = moderateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  const existing = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!existing) return apiFailure("NOT_FOUND", "Produto não encontrado.", 404);

  const approvalStatus = parsed.data.action === "hide" ? "SUSPENDED" : "APPROVED";

  const product = await prisma.product.update({
    where: { id: productId },
    data: { approvalStatus },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          partnerProfile: { select: { businessName: true } },
        },
      },
    },
  });

  return apiSuccess({
    product,
    action: parsed.data.action,
    reason: parsed.data.reason ?? null,
    moderatedBy: user!.id,
  });
}
