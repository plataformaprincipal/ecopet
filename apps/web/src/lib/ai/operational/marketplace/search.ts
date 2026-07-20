import "server-only";

import { queryPublicProducts, queryPublicServices } from "@/lib/marketplace/public-query";
import { assertAiFlag } from "../feature-flags";
import { parseMarketplaceNaturalLanguage } from "./nl-search";

export async function searchMarketplaceByNaturalLanguage(message: string) {
  assertAiFlag("marketplace_ai");
  const plan = parseMarketplaceNaturalLanguage(message);

  if (plan.intent === "services") {
    const result = await queryPublicServices(plan.serviceFilters);
    return {
      plan,
      kind: "services" as const,
      items: result.services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        rating: s.rating,
        href: `/marketplace/services/${s.id}`,
        partnerName: s.provider?.partnerProfile?.businessName ?? s.provider?.name ?? null,
      })),
      total: result.total,
      disclaimer: "Dados reais do catálogo. A IA não inventa preço, estoque ou disponibilidade.",
    };
  }

  const result = await queryPublicProducts(plan.productFilters);
  return {
    plan,
    kind: "products" as const,
    items: result.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      rating: p.rating,
      stock: p.stock,
      brand: p.brand,
      href: `/marketplace/products/${p.id}`,
    })),
    total: result.total,
    disclaimer: "Dados reais do catálogo. A IA não inventa preço, estoque ou disponibilidade.",
  };
}
