import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { CouponError, quoteCouponInTx } from "@/lib/commerce/apply-coupon";
import { couponToEngineInput, PricingError, serverQuoteProduct, serverQuoteService } from "@/lib/pricing/service";
import type { CouponInput } from "@/lib/pricing/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  kind: z.enum(["PRODUCT", "SERVICE", "HEALTH", "SUBSCRIPTION", "ADDON", "AI", "ADS", "PROTECT", "IOT", "API"]),
  sku: z.string().optional(),
  baseAmount: z.number().finite().nonnegative().optional(),
  quantity: z.number().int().positive().optional(),
  urgent: z.boolean().optional(),
  couponCode: z.string().optional(),
  productId: z.string().optional(),
  serviceId: z.string().optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().optional(),
        unitPrice: z.number().optional(),
        quantity: z.number().int().positive(),
        sku: z.string().optional(),
      })
    )
    .optional(),
});

async function resolveCoupon(userId: string, code: string | undefined, grossBrl: number): Promise<CouponInput | null> {
  if (!code?.trim()) return null;
  const quoted = await quoteCouponInTx(prisma, { userId, code, grossBrl });
  return couponToEngineInput(quoted.coupon);
}

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Payload inválido.", 400);
  }
  const body = parsed.data;

  try {
    if (body.kind === "PRODUCT") {
      const lines = body.lines?.length
        ? body.lines
        : body.productId
          ? [{ productId: body.productId, quantity: body.quantity ?? 1 }]
          : null;
      if (!lines) {
        if (body.baseAmount == null) return apiFailure("VALIDATION", "Informe linhas ou valor-base.", 400);
        const coupon = await resolveCoupon(user!.id, body.couponCode, body.baseAmount * (body.quantity ?? 1));
        const quoted = await serverQuoteProduct({
          lines: [{ unitPrice: body.baseAmount, quantity: body.quantity ?? 1, sku: body.sku }],
          coupon,
          partnerVerified: true,
        });
        return apiSuccess({ quote: quoted.order, lines: quoted.lines });
      }

      const productIds = lines.map((l) => l.productId).filter(Boolean) as string[];
      const products = productIds.length
        ? await prisma.product.findMany({
            where: { id: { in: productIds }, deletedAt: null },
            select: { id: true, price: true, pricingCatalogSku: true, sellerId: true },
          })
        : [];
      const byId = new Map(products.map((p) => [p.id, p]));
      const resolved = lines.map((line) => {
        const product = line.productId ? byId.get(line.productId) : null;
        const unitPrice = product?.price ?? line.unitPrice;
        if (unitPrice == null) throw new PricingError("INVALID_AMOUNT", "Preço do produto ausente.");
        return {
          unitPrice,
          quantity: line.quantity,
          sku: product?.pricingCatalogSku ?? line.sku ?? body.sku,
          sellerId: product?.sellerId,
        };
      });
      const gross = resolved.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
      const coupon = await resolveCoupon(user!.id, body.couponCode, gross);
      const quoted = await serverQuoteProduct({
        lines: resolved,
        coupon,
        partnerVerified: true,
        partnerId: resolved[0]?.sellerId,
      });
      return apiSuccess({ quote: quoted.order, lines: quoted.lines });
    }

    let baseAmount = body.baseAmount;
    let sku = body.sku ?? null;
    let partnerId: string | undefined;
    if (body.serviceId) {
      const service = await prisma.service.findFirst({
        where: { id: body.serviceId, deletedAt: null },
        select: { price: true, pricingCatalogSku: true, providerId: true },
      });
      if (!service) return apiFailure("NOT_FOUND", "Serviço não encontrado.", 404);
      baseAmount = service.price;
      sku = service.pricingCatalogSku ?? sku;
      partnerId = service.providerId;
    }
    if (baseAmount == null) return apiFailure("VALIDATION", "Informe valor-base.", 400);
    const coupon = await resolveCoupon(user!.id, body.couponCode, baseAmount);
    const quote = await serverQuoteService({
      kind: body.kind === "HEALTH" ? "HEALTH" : body.kind === "SERVICE" ? "SERVICE" : body.kind,
      baseAmount,
      sku,
      urgent: body.urgent,
      partnerVerified: true,
      coupon,
      partnerId,
    });
    return apiSuccess({ quote });
  } catch (e) {
    if (e instanceof PricingError) {
      return apiFailure(e.code, e.message, 400);
    }
    if (e instanceof CouponError) {
      return apiFailure(e.code, e.message, e.status);
    }
    console.error("[pricing.quote]", e);
    return apiFailure("INTERNAL", "Falha ao calcular cotação.", 500);
  }
}
