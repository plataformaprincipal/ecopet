import {
  SOURCE_DOCUMENT,
  type CatalogItem,
  type PricingCommercialAvailability,
  type PricingItemKind,
  type PricingMode,
  type PricingRevenueRecognition,
  type PricingSuite,
} from "./types";

export function brl(reais: number): number {
  return Math.round(reais * 100);
}

export function item(partial: CatalogItem): CatalogItem {
  return {
    ...partial,
    sourceDocument: partial.sourceDocument || SOURCE_DOCUMENT,
  };
}

export function fixedSku(params: {
  sku: string;
  name: string;
  suite: PricingSuite;
  kind: PricingItemKind;
  amountCents: number;
  annualAmountCents?: number;
  setupAmountCents?: number;
  unit?: string;
  billingCycle?: string;
  costReferenceCents?: number;
  allowZero?: boolean;
  commercialAvailability: PricingCommercialAvailability;
  revenueRecognition?: PricingRevenueRecognition;
  capabilityId?: string;
  portfolioSuiteId: string;
  sourceSection: string;
  mediaPassThrough?: boolean;
}): CatalogItem {
  return item({
    sku: params.sku,
    name: params.name,
    suite: params.suite,
    kind: params.kind,
    pricingMode: "ECCOPET_FIXED",
    commercialAvailability: params.commercialAvailability,
    revenueRecognition: params.revenueRecognition ?? "SUBSCRIPTION",
    amountCents: params.amountCents,
    annualAmountCents: params.annualAmountCents,
    setupAmountCents: params.setupAmountCents,
    unit: params.unit,
    billingCycle: params.billingCycle,
    costReferenceCents: params.costReferenceCents,
    allowZero: params.allowZero,
    capabilityId: params.capabilityId,
    portfolioSuiteId: params.portfolioSuiteId,
    mediaPassThrough: params.mediaPassThrough,
    sourceDocument: SOURCE_DOCUMENT,
    sourceSection: params.sourceSection,
    sourceSku: params.sku,
  });
}

export function marketSku(
  sku: string,
  name: string,
  ticketReais: number,
  eccopetRevenueReais: number
): CatalogItem {
  return item({
    sku,
    name,
    suite: "MARKET",
    kind: "PRODUCT",
    pricingMode: "SELLER_DEFINED",
    commercialAvailability: "PURCHASABLE",
    revenueRecognition: "COMMISSION_AND_FEE",
    referenceTicketCents: brl(ticketReais),
    eccopetRevenueRefCents: brl(eccopetRevenueReais),
    portfolioSuiteId: "market",
    sourceDocument: SOURCE_DOCUMENT,
    sourceSection: "5. Tabela mestre — Marketplace de produtos",
    sourceSku: sku,
  });
}

export function serviceSku(params: {
  sku: string;
  name: string;
  tutorReais: number;
  baseReais: number;
  eccopetRevenueReais: number;
  urgent?: boolean;
}): CatalogItem {
  return item({
    sku: params.sku,
    name: params.name,
    suite: "SERVICES",
    kind: "SERVICE",
    pricingMode: "PROVIDER_DEFINED",
    commercialAvailability: "CATALOG_ONLY",
    revenueRecognition: "COMMISSION_AND_FEE",
    referenceTutorCents: brl(params.tutorReais),
    providerBaseCents: brl(params.baseReais),
    eccopetRevenueRefCents: brl(params.eccopetRevenueReais),
    urgentEligible: params.urgent,
    portfolioSuiteId: "services",
    sourceDocument: SOURCE_DOCUMENT,
    sourceSection: "6. Tabela mestre — Marketplace de serviços",
    sourceSku: params.sku,
  });
}

export function healthSku(params: {
  sku: string;
  name: string;
  jpReais: number;
  nationalReais: number;
  minReais: number;
  maxReais: number;
  baseReais: number;
  eccopetRevenueReais: number;
  urgent?: boolean;
  complex?: boolean;
}): CatalogItem {
  return item({
    sku: params.sku,
    name: params.name,
    suite: "HEALTH",
    kind: "HEALTH",
    pricingMode: "PROVIDER_DEFINED",
    commercialAvailability: "CATALOG_ONLY",
    revenueRecognition: "COMMISSION_AND_FEE",
    referenceTutorCents: brl(params.jpReais),
    nationalReferenceCents: brl(params.nationalReais),
    rangeMinCents: brl(params.minReais),
    rangeMaxCents: brl(params.maxReais),
    providerBaseCents: brl(params.baseReais),
    eccopetRevenueRefCents: brl(params.eccopetRevenueReais),
    urgentEligible: params.urgent,
    complexProcedure: params.complex,
    portfolioSuiteId: "care",
    sourceDocument: SOURCE_DOCUMENT,
    sourceSection: "7. Tabela mestre — Saúde, exames, emergência e tratamentos",
    sourceSku: params.sku,
  });
}
