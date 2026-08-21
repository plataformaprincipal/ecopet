import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { writeAiCommerceAudit } from "@/lib/ai-commerce/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  name: z.string().min(2).max(80).optional(),
  shortDescription: z.string().max(240).optional(),
  longDescription: z.string().max(4000).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
  usageLimit: z.number().int().min(1).max(20).optional(),
  sortOrder: z.number().int().min(0).max(100).optional(),
  badge: z.string().max(40).nullable().optional(),
  priceInCents: z.number().int().min(1).max(1_000_000).optional(),
  confirmPrice: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const { user, error } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return apiFailure("VALIDATION", "Dados inválidos.", 400);

  const product = await prisma.aIProduct.findUnique({ where: { id }, include: { prices: { where: { active: true }, take: 1, orderBy: { version: "desc" } } } });
  if (!product) return apiFailure("NOT_FOUND", "Produto não encontrado.", 404);

  const updated = await prisma.$transaction(async (tx) => {
    const data: Record<string, unknown> = {};
    if (parsed.data.name) data.name = parsed.data.name;
    if (parsed.data.shortDescription) data.shortDescription = parsed.data.shortDescription;
    if (parsed.data.longDescription) data.longDescription = parsed.data.longDescription;
    if (parsed.data.status) data.status = parsed.data.status;
    if (parsed.data.usageLimit) data.usageLimit = parsed.data.usageLimit;
    if (parsed.data.sortOrder != null) data.sortOrder = parsed.data.sortOrder;
    if (parsed.data.badge !== undefined) data.badge = parsed.data.badge;
    if (parsed.data.confirmPrice) data.pricesConfirmedAt = new Date();

    const productRow = await tx.aIProduct.update({ where: { id }, data });

    if (parsed.data.priceInCents) {
      const current = product.prices[0];
      if (!current || current.priceInCents !== parsed.data.priceInCents) {
        if (current) {
          await tx.aIProductPrice.update({ where: { id: current.id }, data: { active: false, endsAt: new Date() } });
        }
        await tx.aIProductPrice.create({
          data: {
            productId: id,
            priceInCents: parsed.data.priceInCents,
            version: (current?.version ?? 0) + 1,
            active: true,
            source: "ADMIN_CONFIRMED",
            actorId: user!.id,
          },
        });
      }
    }
    return productRow;
  });

  await writeAiCommerceAudit({
    userId: user!.id,
    action: "AI_PRODUCT_UPDATED",
    sku: product.sku,
    metadata: parsed.data,
  });
  return apiSuccess({ id: updated.id });
}
