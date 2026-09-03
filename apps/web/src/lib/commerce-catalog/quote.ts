import { quotePricing } from "@/lib/pricing/engine";
import { officialActiveVersion } from "@/lib/pricing/catalog";
import { resolveActivePricingVersion } from "@/lib/pricing/service";
import { ENTERTAINMENT_SKU, catalogForSku, familyOfSku, getCommercialProduct, publicStatus } from "./products";
import type { PricingQuote } from "@/lib/pricing/types";

export type CatalogQuoteRow = {
  sku: string;
  name: string;
  description: string;
  family: string;
  href: string;
  status: ReturnType<typeof publicStatus>;
  billingEnabled: boolean;
  recurring: boolean;
  petRequired: boolean;
  partnerPanel: boolean;
  requiresLicensedVet: boolean;
  requiresInsurer: boolean;
  terms: string;
  amountCents: number | null;
  annualAmountCents: number | null;
  setupAmountCents: number | null;
  billingCycle: string | null;
  pricingVersion: string;
  quote: PricingQuote | null;
  purchasable: boolean;
};

function entertainmentRow(): CatalogQuoteRow {
  const product = getCommercialProduct(ENTERTAINMENT_SKU)!;
  return {
    sku: ENTERTAINMENT_SKU,
    name: product.name,
    description: product.description,
    family: product.family,
    href: product.href,
    status: "PRICE_PENDING",
    billingEnabled: false,
    recurring: true,
    petRequired: false,
    partnerPanel: false,
    requiresLicensedVet: false,
    requiresInsurer: false,
    terms: product.terms,
    amountCents: null,
    annualAmountCents: null,
    setupAmountCents: null,
    billingCycle: "month",
    pricingVersion: officialActiveVersion().version,
    quote: null,
    purchasable: false,
  };
}

export async function quoteCatalogSku(sku: string, opts?: { billingCycle?: "month" | "year"; urgent?: boolean }) {
  if (sku === ENTERTAINMENT_SKU) return entertainmentRow();
  const item = catalogForSku(sku);
  const product = getCommercialProduct(sku);
  if (!item) {
    throw Object.assign(new Error("SKU_UNKNOWN"), { code: "SKU_UNKNOWN" });
  }
  const version = await resolveActivePricingVersion({ charging: true }).catch(() => officialActiveVersion());
  const annual = opts?.billingCycle === "year";
  const base =
    (annual ? item.annualAmountCents : null) ??
    item.amountCents ??
    item.referenceTutorCents ??
    item.providerBaseCents ??
    item.referenceTicketCents ??
    0;
  const quote = quotePricing({
    kind: item.kind === "HEALTH" ? "HEALTH" : item.kind === "ADDON" ? "ADDON" : item.kind,
    sku: item.sku,
    baseAmountCents: base,
    quantity: 1,
    version,
    catalogItem: item,
    allowZero: Boolean(item.allowZero),
    urgent: Boolean(opts?.urgent && item.urgentEligible),
    urgentEligible: Boolean(item.urgentEligible),
  });
  const status = publicStatus(item, sku);
  return {
    sku: item.sku,
    name: product?.name ?? item.name,
    description: product?.description ?? item.name,
    family: familyOfSku(sku),
    href: product?.href ?? "/assinatura",
    status,
    billingEnabled: Boolean(item.billingEnabled ?? status === "PURCHASABLE"),
    recurring: product?.recurring ?? Boolean(item.billingCycle === "month"),
    petRequired: product?.petRequired ?? false,
    partnerPanel: product?.partnerPanel ?? false,
    requiresLicensedVet: product?.requiresLicensedVet ?? false,
    requiresInsurer: product?.requiresInsurer ?? false,
    terms: product?.terms ?? "Regras oficiais do PFO.",
    amountCents: annual ? item.annualAmountCents ?? item.amountCents ?? null : item.amountCents ?? item.referenceTutorCents ?? null,
    annualAmountCents: item.annualAmountCents ?? null,
    setupAmountCents: item.setupAmountCents ?? null,
    billingCycle: annual ? "year" : item.billingCycle ?? null,
    pricingVersion: quote.pricingVersion,
    quote,
    purchasable: quote.purchasable && status === "PURCHASABLE",
  } satisfies CatalogQuoteRow;
}

export async function listFamilyQuotes(family: string) {
  const { COMMERCIAL_PRODUCTS } = await import("./products");
  const skus = COMMERCIAL_PRODUCTS.filter((p) => p.family === family).map((p) => p.sku);
  const extra =
    family === "ADS"
      ? Array.from({ length: 19 }, (_, i) => `ADS-${String(i + 1).padStart(3, "0")}`)
      : family === "AI_ADDON"
        ? [
            ...Array.from({ length: 14 }, (_, i) => `AI-T${String(i + 1).padStart(2, "0")}`),
            ...Array.from({ length: 14 }, (_, i) => `AI-P${String(i + 1).padStart(2, "0")}`),
            ...Array.from({ length: 5 }, (_, i) => `AI-C${String(i + 1).padStart(2, "0")}`),
          ]
        : family === "IOT"
          ? Array.from({ length: 10 }, (_, i) => `IOT-${String(i + 1).padStart(3, "0")}`)
          : family === "API"
            ? ["API-001", "API-002", "API-003", "API-004"]
            : family === "HEALTH_DIGITAL" || family === "TELEHEALTH" || family === "EXAMS"
              ? Array.from({ length: 57 }, (_, i) => `SAU-${String(i + 1).padStart(3, "0")}`)
              : family === "PROTECT" || family === "HEALTH_PLAN"
                ? Array.from({ length: 10 }, (_, i) => `PRT-${String(i + 1).padStart(3, "0")}`)
            : [];
  const all = [...new Set([...skus, ...extra])];
  const rows: CatalogQuoteRow[] = [];
  for (const sku of all) {
    try {
      rows.push(await quoteCatalogSku(sku));
    } catch {
      /* skip unknown */
    }
  }
  return rows;
}
