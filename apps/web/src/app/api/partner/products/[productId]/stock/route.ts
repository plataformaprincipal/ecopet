import { prisma } from "@/lib/prisma";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { stockPatchSchema } from "@/schemas/product";

type RouteContext = { params: Promise<{ productId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user, error } = await requireActivePartner();
  if (error) return error;
  const { productId } = await context.params;

  const parsed = stockPatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Inválido", 400);
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId: user!.id, deletedAt: null },
  });
  if (!product) return apiFailure("NOT_FOUND", "Produto não encontrado.", 404);

  const { delta, reason } = parsed.data;
  const stockAfter = product.stock + delta;
  if (stockAfter < 0) {
    return apiFailure("VALIDATION", "Estoque insuficiente para esta operação.", 400);
  }

  const [updated, log] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { stock: stockAfter },
    }),
    prisma.inventoryLog.create({
      data: {
        productId,
        partnerId: user!.id,
        delta,
        stockAfter,
        reason: reason ?? "MANUAL_ADJUSTMENT",
        actorId: user!.id,
      },
    }),
  ]);

  return apiSuccess({ product: updated, inventoryLog: log });
}
