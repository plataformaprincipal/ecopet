import { apiSuccess } from "@/lib/api-response";
import { listPublicCatalog } from "@/lib/ai-commerce/pricing";
import { ensureAiCommerceProducts } from "@/lib/ai-commerce/product-service";
import { getAiMonetizationMode, isAiCommerceEnabled, isAiMonetizationFree, isAiPaidCheckoutEnabled } from "@/lib/ai-commerce/flags";
import { AI_COMMERCE_PRODUCTS } from "@/lib/ai-commerce/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureAiCommerceProducts();
  const items = await listPublicCatalog();
  const free = isAiMonetizationFree();
  return apiSuccess({
    enabled: true,
    commerceEnabled: isAiCommerceEnabled(),
    monetizationMode: getAiMonetizationMode(),
    requiresPayment: !free,
    free,
    disclaimer:
      "Resultados automatizados e orientativos. Quando necessário, procure um médico-veterinário.",
    products: items.map((p) => ({
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      tag: p.tag,
      category: p.category,
      group: p.group,
      filters: p.filters,
      unitLabel: p.unitLabel,
      billingType: p.billingType,
      shortDescription: p.shortDescription,
      included: p.included,
      avgFillMinutes: p.avgFillMinutes,
      maxImages: p.maxImages,
      href: p.href,
      capabilityId: p.capabilityId,
      free,
      requiresPayment: !free,
      purchasable: !free && p.price.purchasable && isAiPaidCheckoutEnabled(),
      ...(free
        ? {}
        : {
            priceInCents: p.price.priceInCents,
            currency: p.price.currency,
            commercialPending: p.price.commercialPending,
            priceSource: p.price.source,
          }),
    })),
    howItWorks: AI_COMMERCE_PRODUCTS[0]?.howItWorks,
  });
}
