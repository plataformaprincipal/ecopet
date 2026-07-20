/**
 * Explorar IA — interpreta intenção e consulta serviços públicos reais.
 */
import "server-only";

import {
  queryPublicProducts,
  queryPublicServices,
  queryPublicPartners,
} from "@/lib/marketplace/public-query";
import { parseMarketplaceNaturalLanguage } from "../marketplace/nl-search";
import { isAiFlagEnabled, assertAiFlag } from "../feature-flags";
import { parseExploreIntent } from "./intent";

export { parseExploreIntent } from "./intent";
export type { ExplorePlan, ExploreTarget } from "./intent";

export async function runExploreByMessage(message: string) {
  assertAiFlag("explore_ai");
  if (!isAiFlagEnabled("explore_ai")) {
    throw new Error("Explore AI desativado");
  }

  const plan = parseExploreIntent(message);
  const market = parseMarketplaceNaturalLanguage(message);
  const cards: Array<{
    type: string;
    id: string;
    title: string;
    subtitle?: string;
    href: string;
    meta?: Record<string, unknown>;
  }> = [];

  if (plan.target === "products" || plan.target === "mixed") {
    const { products } = await queryPublicProducts(market.productFilters);
    for (const p of products.slice(0, 8)) {
      cards.push({
        type: "product",
        id: p.id,
        title: p.name,
        subtitle: p.brand ?? undefined,
        href: `/marketplace/products/${p.id}`,
        meta: { price: p.price, rating: p.rating, stock: p.stock },
      });
    }
  }

  if (plan.target === "services" || plan.target === "mixed") {
    const { services } = await queryPublicServices(market.serviceFilters);
    for (const s of services.slice(0, 8)) {
      cards.push({
        type: "service",
        id: s.id,
        title: s.name,
        subtitle: s.provider?.partnerProfile?.businessName ?? s.provider?.name ?? undefined,
        href: `/marketplace/services/${s.id}`,
        meta: { price: s.price, rating: s.rating },
      });
    }
  }

  if (plan.target === "partners") {
    const { partners } = await queryPublicPartners({
      q: market.suggestedQuery || undefined,
      pageSize: 8,
    });
    for (const p of partners) {
      cards.push({
        type: "partner",
        id: p.id,
        title: p.name,
        subtitle: [p.city, p.state].filter(Boolean).join(" / ") || undefined,
        href: `/parceiros/${p.id}`,
        meta: { productCount: p.productCount, serviceCount: p.serviceCount },
      });
    }
  }

  if (["ngos", "adoptions", "campaigns", "social"].includes(plan.target)) {
    cards.push({
      type: "deep_link",
      id: plan.target,
      title: `Abrir ${plan.target}`,
      subtitle: "Resultados na página oficial do EcoPet",
      href: plan.deepLink,
    });
  }

  return {
    plan,
    marketInterpretation: market.interpretation,
    cards,
    count: cards.length,
    disclaimer:
      "Resultados vindos de catálogo/serviços reais. Preços e estoque não são inventados pela IA.",
  };
}
