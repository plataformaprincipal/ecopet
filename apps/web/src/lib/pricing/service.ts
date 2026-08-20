import "server-only";
import { prisma } from "@/lib/prisma";
import { ECCOPET_PORTFOLIO } from "@/lib/platform/portfolio";
import {
  officialActiveVersion,
  getCatalogBySku,
  quotePricing,
  quoteProductOrder,
  PricingError,
  OFFICIAL_PRICING_VERSION,
  type CatalogItem,
  type ContractOverrideInput,
  type CouponInput,
  type PricingQuote,
  type QuoteKind,
  type ResolvedPricingVersion,
} from "@/lib/pricing";
import type { PricingPolicyRules, PricingVersionStatus } from "@/lib/pricing/types";
import {
  isPricingMemoryFallbackAllowed,
  isChargingMemoryFallbackAllowed,
} from "@/lib/pricing/runtime-mode";

type CacheEntry = { version: ResolvedPricingVersion; loadedAt: number };
let activeCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60_000;

export function invalidatePricingCache() {
  activeCache = null;
}

function parseRules(json: unknown): PricingPolicyRules {
  const row = json as Partial<PricingPolicyRules> | null;
  if (!row || typeof row.productCommissionPercentBps !== "number") {
    return officialActiveVersion().rules;
  }
  return { ...officialActiveVersion().rules, ...row };
}

function toResolved(row: {
  id: string;
  version: string;
  country: string;
  currency: string;
  status: PricingVersionStatus;
  validFrom: Date;
  validTo: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rollbackVersionId: string | null;
  sourceDocument: string;
  sourceSection: string | null;
  rulesJson: unknown;
}): ResolvedPricingVersion {
  return {
    id: row.id,
    version: row.version,
    country: row.country,
    currency: row.currency,
    status: row.status,
    validFrom: row.validFrom.toISOString(),
    validTo: row.validTo ? row.validTo.toISOString() : null,
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
    rollbackVersion: row.rollbackVersionId,
    sourceDocument: row.sourceDocument,
    sourceSection: row.sourceSection ?? "",
    rules: parseRules(row.rulesJson),
  };
}

export async function resolveActivePricingVersion(opts?: {
  country?: string;
  at?: Date;
  allowMemoryFallback?: boolean;
  charging?: boolean;
}): Promise<ResolvedPricingVersion> {
  const country = opts?.country ?? "BR";
  const at = opts?.at ?? new Date();
  const charging = opts?.charging === true;
  const allowMemory =
    opts?.allowMemoryFallback ??
    (charging ? isChargingMemoryFallbackAllowed() : isPricingMemoryFallbackAllowed());

  if (activeCache && Date.now() - activeCache.loadedAt < CACHE_TTL_MS) {
    if (activeCache.version.country === country && activeCache.version.status === "ACTIVE") {
      if (!charging || activeCache.version.id) return activeCache.version;
    }
  }

  let schemaUnavailable = false;
  try {
    const row = await prisma.pricingVersion.findFirst({
      where: {
        country,
        status: "ACTIVE",
        validFrom: { lte: at },
        OR: [{ validTo: null }, { validTo: { gte: at } }],
      },
      orderBy: { validFrom: "desc" },
    });
    if (row) {
      const catalogCount = await prisma.pricingCatalogItem.count({ where: { versionId: row.id } });
      if (catalogCount === 0) {
        if (!allowMemory) {
          throw new PricingError(
            "CATALOG_UNAVAILABLE",
            "Catálogo de Pricing ACTIVE ausente. Operação fail-closed."
          );
        }
      } else {
        const resolved = toResolved(row);
        activeCache = { version: resolved, loadedAt: Date.now() };
        return resolved;
      }
    }
  } catch (e) {
    if (e instanceof PricingError) throw e;
    schemaUnavailable = true;
  }

  if (!allowMemory) {
    throw new PricingError(
      schemaUnavailable ? "PRICING_SCHEMA_UNAVAILABLE" : "VERSION_NOT_ACTIVE",
      schemaUnavailable
        ? "Schema de Pricing indisponível. Checkout bloqueado (fail-closed)."
        : "Nenhuma PricingVersion ACTIVE. Checkout bloqueado (fail-closed)."
    );
  }

  const memory = officialActiveVersion();
  if (!charging) {
    activeCache = { version: memory, loadedAt: Date.now() };
  }
  return memory;
}

export function catalogItemToQuoteItem(sku?: string | null): CatalogItem | null {
  if (!sku) return null;
  return getCatalogBySku(sku) ?? null;
}

export function couponToEngineInput(coupon: {
  code: string;
  discountType: string;
  discountValue: number;
  fundedBy?: string | null;
  marginFloorBps?: number | null;
}): CouponInput {
  const funded =
    coupon.fundedBy === "SELLER" || coupon.fundedBy === "PROVIDER" || coupon.fundedBy === "PARTNER"
      ? coupon.fundedBy
      : "ECCOPET";
  return {
    code: coupon.code,
    discountType: coupon.discountType.toUpperCase().startsWith("PERCENT") ? "PERCENT" : "FIXED",
    discountValue: coupon.discountValue,
    fundedBy: funded,
    marginFloorBps: coupon.marginFloorBps ?? null,
  };
}

export async function loadActiveContractOverride(params: {
  partnerId?: string | null;
  scope: "PRODUCT" | "SERVICE" | "HEALTH" | "ALL";
}): Promise<ContractOverrideInput | null> {
  if (!params.partnerId) return null;
  try {
    const version = await resolveActivePricingVersion();
    if (!version.id) return null;
    const now = new Date();
    const row = await prisma.pricingContractOverride.findFirst({
      where: {
        partnerId: params.partnerId,
        versionId: version.id,
        scope: { in: [params.scope, "ALL"] },
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return null;
    return {
      partnerId: row.partnerId,
      commissionPercentBps: row.commissionPercentBps,
      fixedFeeCents: row.fixedFeeCents,
      validFrom: row.validFrom.toISOString(),
      validTo: row.validTo.toISOString(),
      reason: row.reason,
      approvedByAdminId: row.approvedByAdminId,
      approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
      approvalRequired: row.approvalRequired,
      floorPercentBps: row.floorPercentBps,
    };
  } catch {
    return null;
  }
}

export function isCatalogPurchasable(item: CatalogItem | null): boolean {
  if (!item) return true;
  const suite = ECCOPET_PORTFOLIO.find((s) => s.id === item.portfolioSuiteId);
  if (suite && !suite.commercial) return false;
  return item.commercialAvailability === "PURCHASABLE";
}

export async function serverQuoteProduct(params: {
  lines: { unitPrice: number; quantity: number; sku?: string | null }[];
  coupon?: CouponInput | null;
  partnerVerified?: boolean;
  partnerId?: string | null;
  charging?: boolean;
}): Promise<{ order: PricingQuote; lines: PricingQuote[] }> {
  const version = await resolveActivePricingVersion({ charging: params.charging ?? true });
  const contractOverride = await loadActiveContractOverride({
    partnerId: params.partnerId,
    scope: "PRODUCT",
  });
  return quoteProductOrder({
    version,
    lines: params.lines.map((l) => ({
      unitPriceCents: Math.round(l.unitPrice * 100),
      quantity: l.quantity,
      sku: l.sku ?? undefined,
      catalogItem: catalogItemToQuoteItem(l.sku),
    })),
    coupon: params.coupon,
    partnerVerified: params.partnerVerified,
    contractOverride,
  });
}

export async function serverQuoteService(params: {
  kind?: QuoteKind;
  baseAmount: number;
  sku?: string | null;
  urgent?: boolean;
  partnerVerified?: boolean;
  coupon?: CouponInput | null;
  partnerId?: string | null;
  charging?: boolean;
}): Promise<PricingQuote> {
  const version = await resolveActivePricingVersion({ charging: params.charging ?? true });
  const catalog = catalogItemToQuoteItem(params.sku);
  const kind = params.kind ?? (catalog?.kind === "HEALTH" ? "HEALTH" : "SERVICE");
  const contractOverride = await loadActiveContractOverride({
    partnerId: params.partnerId,
    scope: kind === "HEALTH" ? "HEALTH" : "SERVICE",
  });
  return quotePricing({
    kind,
    sku: params.sku ?? catalog?.sku,
    baseAmountCents: Math.round(params.baseAmount * 100),
    urgent: params.urgent,
    urgentEligible: catalog?.urgentEligible,
    partnerVerified: params.partnerVerified,
    coupon: params.coupon,
    version,
    catalogItem: catalog,
    allowZero: catalog?.allowZero,
    contractOverride,
  });
}

export function quoteToOrderFloats(quote: PricingQuote) {
  return {
    grossAmount: quote.baseAmountCents / 100,
    discountAmount: quote.discountCents / 100,
    platformPercentage: quote.commissionPercentBps / 100,
    platformFixedFee: quote.fixedFeeCents / 100,
    platformFeeAmount: quote.eccopetRevenueCents / 100,
    gatewayFeeEstimated: quote.estimatedPspCents / 100,
    reserveAmount: quote.reserveCents / 100,
    taxEstimate: quote.estimatedTaxProvisionCents / 100,
    partnerAmount: quote.estimatedPayoutCents / 100,
    pricingVersion: quote.pricingVersion || OFFICIAL_PRICING_VERSION,
    total: quote.customerAmountCents / 100,
  };
}

export { PricingError };
