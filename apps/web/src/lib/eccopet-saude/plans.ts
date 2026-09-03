import { getCatalogBySku, officialActiveVersion } from "@/lib/pricing/catalog";
import { quotePricing } from "@/lib/pricing/engine";

export const ECCOPET_SAUDE_SELLER = "ECCOPET";

export type EccoPetSaudeTierId = "essencial" | "plus" | "familia";

export type EccoPetSaudeTier = {
  id: EccoPetSaudeTierId;
  name: string;
  sku: string;
  periodDays: number;
  description: string;
  /** Only catalog SKUs / AI tools that actually exist. */
  includedSkuLabels: string[];
};

/** Tiers map to existing HEALTH catalog SKUs. Coverage is not invented. */
export const ECCOPET_SAUDE_TIERS: EccoPetSaudeTier[] = [
  {
    id: "essencial",
    name: "EccoPet Saúde Essencial",
    sku: "SAU-006",
    periodDays: 30,
    description: "Acesso de 30 dias à triagem remota informativa do catálogo de saúde, renovável. Não é seguro.",
    includedSkuLabels: ["SAU-006 Triagem remota informativa", "EccoVet Triagem (IA)", "Bubis"],
  },
  {
    id: "plus",
    name: "EccoPet Saúde Plus",
    sku: "SAU-007",
    periodDays: 30,
    description: "Acesso de 30 dias à teleorientação veterinária de catálogo, renovável. Não é seguro.",
    includedSkuLabels: ["SAU-007 Teleorientação veterinária", "EccoCheckup AI", "EccoVet Triagem (IA)"],
  },
  {
    id: "familia",
    name: "EccoPet Saúde Família",
    sku: "SAU-055",
    periodDays: 30,
    description: "Acesso de 30 dias ao programa de acompanhamento mensal do catálogo de saúde. Não é seguro nem recorrência automática.",
    includedSkuLabels: ["SAU-055 Programa de doença crônica / mês", "Pet Health Profile", "EccoCheckup AI"],
  },
];

export function quoteEccoPetSaudeTier(id: EccoPetSaudeTierId) {
  const tier = ECCOPET_SAUDE_TIERS.find((t) => t.id === id);
  if (!tier) return null;
  const catalog = getCatalogBySku(tier.sku);
  if (!catalog) return null;
  const base =
    catalog.referenceTutorCents ??
    catalog.amountCents ??
    catalog.nationalReferenceCents ??
    0;
  const quote = quotePricing({
    kind: "HEALTH",
    sku: catalog.sku,
    baseAmountCents: base,
    quantity: 1,
    version: officialActiveVersion(),
    catalogItem: catalog,
    allowZero: false,
  });
  return {
    seller: ECCOPET_SAUDE_SELLER,
    tier,
    catalogName: catalog.name,
    commercialAvailability: catalog.commercialAvailability,
    quote,
    recurringBilling: false,
    splitReady: false,
  };
}

export function listEccoPetSaudeQuotes() {
  return ECCOPET_SAUDE_TIERS.map((t) => quoteEccoPetSaudeTier(t.id)).filter(
    (row): row is NonNullable<ReturnType<typeof quoteEccoPetSaudeTier>> => row != null
  );
}
