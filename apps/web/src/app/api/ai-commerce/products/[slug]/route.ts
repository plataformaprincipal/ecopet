import { apiFailure, apiSuccess } from "@/lib/api-response";
import { getProductDefBySlug, durationCopy } from "@/lib/ai-commerce/catalog";
import { resolveAiProductPrice } from "@/lib/ai-commerce/pricing";
import { ensureAiCommerceProducts } from "@/lib/ai-commerce/product-service";
import { getAiMonetizationMode, isAiCommerceEnabled, isAiMonetizationFree, isAiPaidCheckoutEnabled } from "@/lib/ai-commerce/flags";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  await ensureAiCommerceProducts();
  const def = getProductDefBySlug(slug);
  if (!def) return apiFailure("NOT_FOUND", "Ferramenta não encontrada.", 404);
  const price = await resolveAiProductPrice(def.sku);
  const free = isAiMonetizationFree();
  return apiSuccess({
    ...def,
    durationCopy: durationCopy(def),
    enabled: true,
    commerceEnabled: isAiCommerceEnabled(),
    monetizationMode: getAiMonetizationMode(),
    free,
    requiresPayment: !free,
    purchasable: !free && price.purchasable && isAiPaidCheckoutEnabled(),
    ...(free ? {} : { price }),
  });
}
