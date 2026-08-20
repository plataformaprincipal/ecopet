import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requirePartner } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PricingError, serverQuoteProduct, serverQuoteService } from "@/lib/pricing/service";
import { getCatalogBySku } from "@/lib/pricing/catalog";
import { OFFICIAL_RULES } from "@/lib/pricing/official-rules";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  kind: z.enum(["PRODUCT", "SERVICE", "HEALTH"]),
  baseAmount: z.number().finite().positive(),
  sku: z.string().optional(),
  urgent: z.boolean().optional(),
  productId: z.string().optional(),
  serviceId: z.string().optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requirePartner();
  if (error) return error;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Payload inválido.", 400);
  }
  const body = parsed.data;

  try {
    if (body.productId) {
      const product = await prisma.product.findFirst({
        where: { id: body.productId, sellerId: user!.id, deletedAt: null },
        select: { id: true },
      });
      if (!product) return apiFailure("FORBIDDEN", "Produto de outro parceiro.", 403);
    }
    if (body.serviceId) {
      const service = await prisma.service.findFirst({
        where: { id: body.serviceId, providerId: user!.id, deletedAt: null },
        select: { id: true },
      });
      if (!service) return apiFailure("FORBIDDEN", "Serviço de outro parceiro.", 403);
    }

    const profile = await prisma.partnerProfile.findUnique({
      where: { userId: user!.id },
      select: { verificationStatus: true },
    });
    const partnerVerified = profile?.verificationStatus === "APPROVED";

    const catalog = body.sku ? getCatalogBySku(body.sku) : null;
    if (body.kind === "PRODUCT") {
      const quoted = await serverQuoteProduct({
        lines: [{ unitPrice: body.baseAmount, quantity: 1, sku: body.sku }],
        partnerVerified,
        partnerId: user!.id,
      });
      return apiSuccess({
        quote: quoted.order,
        catalog,
        rule: `${OFFICIAL_RULES.productCommissionPercentBps / 100}% + R$ ${(OFFICIAL_RULES.productFixedFeeCents / 100).toFixed(2).replace(".", ",")} por pedido`,
        payoutNote: "Estimativa. Reserva D+14 após confirmação.",
      });
    }

    const quote = await serverQuoteService({
      kind: body.kind,
      baseAmount: body.baseAmount,
      sku: body.sku,
      urgent: body.urgent,
      partnerVerified,
      partnerId: user!.id,
    });
    return apiSuccess({
      quote,
      catalog,
      rule: `${OFFICIAL_RULES.serviceCommissionPercentBps / 100}% + R$ ${(OFFICIAL_RULES.serviceBookingFeeCents / 100).toFixed(2).replace(".", ",")} por agendamento`,
      payoutNote: "Estimativa. Reserva D+7 após conclusão.",
    });
  } catch (e) {
    if (e instanceof PricingError) return apiFailure(e.code, e.message, 400);
    return apiFailure("INTERNAL", "Falha no preview de pricing.", 500);
  }
}
