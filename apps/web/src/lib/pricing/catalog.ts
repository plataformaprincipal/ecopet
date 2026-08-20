import { ADS_CATALOG } from "./catalog-ads";
import { AI_CATALOG } from "./catalog-ai";
import { HEALTH_CATALOG } from "./catalog-health";
import { MARKET_CATALOG } from "./catalog-market";
import { ONE_CATALOG, PRO_CATALOG } from "./catalog-one-pro";
import { API_CATALOG, IOT_CATALOG, PROTECT_CATALOG } from "./catalog-protect-iot";
import { SERVICE_CATALOG } from "./catalog-services";
import { OFFICIAL_RULES } from "./official-rules";
import {
  OFFICIAL_COUNTRY,
  OFFICIAL_CURRENCY,
  OFFICIAL_PRICING_VERSION,
  SOURCE_DOCUMENT,
  type CatalogItem,
  type ResolvedPricingVersion,
} from "./types";

export const OFFICIAL_CATALOG: CatalogItem[] = [
  ...MARKET_CATALOG,
  ...SERVICE_CATALOG,
  ...HEALTH_CATALOG,
  ...ONE_CATALOG,
  ...PRO_CATALOG,
  ...AI_CATALOG,
  ...ADS_CATALOG,
  ...PROTECT_CATALOG,
  ...IOT_CATALOG,
  ...API_CATALOG,
];

export const CATALOG_COUNTS = {
  MKT: MARKET_CATALOG.length,
  SRV: SERVICE_CATALOG.length,
  SAU: HEALTH_CATALOG.length,
  ONE: ONE_CATALOG.length,
  PRO: PRO_CATALOG.length,
  AI: AI_CATALOG.length,
  ADS: ADS_CATALOG.length,
  PRT: PROTECT_CATALOG.length,
  IOT: IOT_CATALOG.length,
  API: API_CATALOG.length,
  TOTAL: OFFICIAL_CATALOG.length,
} as const;

const CATALOG_BY_SKU = new Map(OFFICIAL_CATALOG.map((row) => [row.sku, row]));

export function getCatalogBySku(sku: string): CatalogItem | undefined {
  return CATALOG_BY_SKU.get(sku);
}

export function officialActiveVersion(): ResolvedPricingVersion {
  return {
    version: OFFICIAL_PRICING_VERSION,
    country: OFFICIAL_COUNTRY,
    currency: OFFICIAL_CURRENCY,
    status: "ACTIVE",
    validFrom: "2026-08-15T00:00:00-03:00",
    validTo: null,
    approvedBy: "DOCUMENT",
    approvedAt: "2026-08-15T00:00:00-03:00",
    rollbackVersion: null,
    sourceDocument: SOURCE_DOCUMENT,
    sourceSection: "27.2 Exemplo JSON de PricingVersion",
    rules: { ...OFFICIAL_RULES },
  };
}

export {
  MARKET_CATALOG,
  SERVICE_CATALOG,
  HEALTH_CATALOG,
  ONE_CATALOG,
  PRO_CATALOG,
  AI_CATALOG,
  ADS_CATALOG,
  PROTECT_CATALOG,
  IOT_CATALOG,
  API_CATALOG,
};
