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
  includedSkuLabels: string[];
};

/** Planos oficiais PRT-001…003 — operador externo obrigatório. */
export const ECCOPET_SAUDE_TIERS: EccoPetSaudeTier[] = [
  {
    id: "essencial",
    name: "Clube preventivo",
    sku: "PRT-001",
    periodDays: 30,
    description: "Plano preventivo intermediado. Não é cobertura própria da EccoPet.",
    includedSkuLabels: ["PRT-001 Clube preventivo"],
  },
  {
    id: "plus",
    name: "Plano ambulatorial",
    sku: "PRT-002",
    periodDays: 30,
    description: "Plano ambulatorial via operador autorizado.",
    includedSkuLabels: ["PRT-002 Plano ambulatorial"],
  },
  {
    id: "familia",
    name: "Plano completo",
    sku: "PRT-003",
    periodDays: 30,
    description: "Plano completo via operador. Prêmio não é receita integral EccoPet.",
    includedSkuLabels: ["PRT-003 Plano completo"],
  },
];

export function quoteEccoPetSaudeTier(id: EccoPetSaudeTierId) {
  const tier = ECCOPET_SAUDE_TIERS.find((t) => t.id === id);
  if (!tier) return null;
  const catalog = getCatalogBySku(tier.sku);
  if (!catalog) return null;
  const base = catalog.amountCents ?? catalog.referenceTutorCents ?? 0;
  const quote = quotePricing({
    kind: "PROTECT",
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
    recurringBilling: true,
    billingEnabled: false,
    splitReady: false,
  };
}

export function listEccoPetSaudeQuotes() {
  return ECCOPET_SAUDE_TIERS.map((t) => quoteEccoPetSaudeTier(t.id)).filter(
    (row): row is NonNullable<ReturnType<typeof quoteEccoPetSaudeTier>> => row != null
  );
}
