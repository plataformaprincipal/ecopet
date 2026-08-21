import type { PrismaClient } from "@prisma/client";
import { OFFICIAL_CATALOG, officialActiveVersion } from "../../../apps/web/src/lib/pricing/catalog";
import { OFFICIAL_RULES } from "../../../apps/web/src/lib/pricing/official-rules";
import { OFFICIAL_PRICING_VERSION } from "../../../apps/web/src/lib/pricing/types";

export async function seedOfficialPricing(prisma: PrismaClient) {
  const official = officialActiveVersion();
  const version = await prisma.pricingVersion.upsert({
    where: { version_country: { version: OFFICIAL_PRICING_VERSION, country: "BR" } },
    update: {
      currency: "BRL",
      status: "ACTIVE",
      validFrom: new Date(official.validFrom),
      validTo: null,
      approvedBy: "DOCUMENT",
      approvedAt: new Date(official.approvedAt ?? official.validFrom),
      sourceDocument: official.sourceDocument,
      sourceSection: official.sourceSection,
      rulesJson: OFFICIAL_RULES,
      metadata: { seed: "official-br-2026-08-v1", immutableCatalog: true },
    },
    create: {
      version: OFFICIAL_PRICING_VERSION,
      country: "BR",
      currency: "BRL",
      status: "ACTIVE",
      validFrom: new Date(official.validFrom),
      approvedBy: "DOCUMENT",
      approvedAt: new Date(official.approvedAt ?? official.validFrom),
      sourceDocument: official.sourceDocument,
      sourceSection: official.sourceSection,
      rulesJson: OFFICIAL_RULES,
      metadata: { seed: "official-br-2026-08-v1", immutableCatalog: true },
    },
  });

  await prisma.pricingVersion.updateMany({
    where: {
      country: "BR",
      status: "ACTIVE",
      id: { not: version.id },
    },
    data: { status: "ARCHIVED" },
  });

  const ruleRows = [
    { code: "COM-PROD", scope: "PRODUCT", priority: 10, formulaJson: { percentBps: 1000, fixedFeeCents: 149 } },
    { code: "COM-SERV", scope: "SERVICE", priority: 10, formulaJson: { percentBps: 1200, bookingFeeCents: 490 } },
    { code: "FEE-URG", scope: "SERVICE", priority: 20, formulaJson: { urgentFeeCents: 1490 } },
    { code: "RSV-PROD", scope: "PRODUCT", priority: 30, formulaJson: { reserveBps: 150, payoutDays: 14 } },
    { code: "RSV-SERV", scope: "SERVICE", priority: 30, formulaJson: { reserveBps: 150, payoutDays: 7 } },
    { code: "PSP-EST", scope: "ALL", priority: 40, formulaJson: { percentBps: 300, fixedFeeCents: 49, estimate: true } },
    { code: "TAX-PROV", scope: "ECCOPET_REVENUE", priority: 50, formulaJson: { bps: 1200, planningOnly: true } },
    { code: "FLOOR-SAAS", scope: "AI", priority: 60, formulaJson: {}, floorMarginBps: 6000 },
    { code: "FLOOR-SUB", scope: "SUBSCRIPTION", priority: 60, formulaJson: {}, floorMarginBps: 4500 },
    { code: "FLOOR-ADS", scope: "ADS", priority: 60, formulaJson: {}, floorMarginBps: 3500 },
  ];

  for (const rule of ruleRows) {
    await prisma.pricingRule.upsert({
      where: { versionId_code: { versionId: version.id, code: rule.code } },
      update: {
        scope: rule.scope,
        priority: rule.priority,
        formulaJson: rule.formulaJson,
        floorMarginBps: rule.floorMarginBps ?? null,
      },
      create: {
        versionId: version.id,
        code: rule.code,
        scope: rule.scope,
        priority: rule.priority,
        formulaJson: rule.formulaJson,
        floorMarginBps: rule.floorMarginBps ?? null,
      },
    });
  }

  for (const sku of OFFICIAL_CATALOG) {
    await prisma.pricingCatalogItem.upsert({
      where: { versionId_sku: { versionId: version.id, sku: sku.sku } },
      update: {
        name: sku.name,
        suite: sku.suite,
        kind: sku.kind,
        pricingMode: sku.pricingMode,
        commercialAvailability: sku.commercialAvailability,
        revenueRecognition: sku.revenueRecognition,
        amountCents: sku.amountCents ?? null,
        annualAmountCents: sku.annualAmountCents ?? null,
        setupAmountCents: sku.setupAmountCents ?? null,
        referenceTicketCents: sku.referenceTicketCents ?? null,
        referenceTutorCents: sku.referenceTutorCents ?? null,
        providerBaseCents: sku.providerBaseCents ?? null,
        rangeMinCents: sku.rangeMinCents ?? null,
        rangeMaxCents: sku.rangeMaxCents ?? null,
        nationalReferenceCents: sku.nationalReferenceCents ?? null,
        costReferenceCents: sku.costReferenceCents ?? null,
        eccopetRevenueRefCents: sku.eccopetRevenueRefCents ?? null,
        unit: sku.unit ?? null,
        billingCycle: sku.billingCycle ?? null,
        urgentEligible: Boolean(sku.urgentEligible),
        complexProcedure: Boolean(sku.complexProcedure),
        allowZero: Boolean(sku.allowZero),
        capabilityId: sku.capabilityId ?? null,
        portfolioSuiteId: sku.portfolioSuiteId,
        mediaPassThrough: Boolean(sku.mediaPassThrough),
        sourceDocument: sku.sourceDocument,
        sourceSection: sku.sourceSection,
        sourceSku: sku.sourceSku,
        metadata: sku.metadata ?? undefined,
      },
      create: {
        versionId: version.id,
        sku: sku.sku,
        name: sku.name,
        suite: sku.suite,
        kind: sku.kind,
        pricingMode: sku.pricingMode,
        commercialAvailability: sku.commercialAvailability,
        revenueRecognition: sku.revenueRecognition,
        amountCents: sku.amountCents ?? null,
        annualAmountCents: sku.annualAmountCents ?? null,
        setupAmountCents: sku.setupAmountCents ?? null,
        referenceTicketCents: sku.referenceTicketCents ?? null,
        referenceTutorCents: sku.referenceTutorCents ?? null,
        providerBaseCents: sku.providerBaseCents ?? null,
        rangeMinCents: sku.rangeMinCents ?? null,
        rangeMaxCents: sku.rangeMaxCents ?? null,
        nationalReferenceCents: sku.nationalReferenceCents ?? null,
        costReferenceCents: sku.costReferenceCents ?? null,
        eccopetRevenueRefCents: sku.eccopetRevenueRefCents ?? null,
        unit: sku.unit ?? null,
        billingCycle: sku.billingCycle ?? null,
        urgentEligible: Boolean(sku.urgentEligible),
        complexProcedure: Boolean(sku.complexProcedure),
        allowZero: Boolean(sku.allowZero),
        capabilityId: sku.capabilityId ?? null,
        portfolioSuiteId: sku.portfolioSuiteId,
        mediaPassThrough: Boolean(sku.mediaPassThrough),
        sourceDocument: sku.sourceDocument,
        sourceSection: sku.sourceSection,
        sourceSku: sku.sourceSku,
        metadata: sku.metadata ?? undefined,
      },
    });
  }

  await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: {
      pricingVersion: OFFICIAL_PRICING_VERSION,
      platformFeePercent: 10,
      platformFixedFee: 1.49,
      gatewayFeePercent: 3,
      gatewayFixedFee: 0.49,
      reservePercent: 1.5,
      taxEstimatePercent: 12,
      gatewayFeeBearer: "PARTNER",
      reserveHoldDays: 14,
      activePricingVersionId: version.id,
    },
    create: {
      id: "singleton",
      pricingVersion: OFFICIAL_PRICING_VERSION,
      platformFeePercent: 10,
      platformFixedFee: 1.49,
      gatewayFeePercent: 3,
      gatewayFixedFee: 0.49,
      reservePercent: 1.5,
      taxEstimatePercent: 12,
      gatewayFeeBearer: "PARTNER",
      reserveHoldDays: 14,
      activePricingVersionId: version.id,
    },
  });

  return { versionId: version.id, skuCount: OFFICIAL_CATALOG.length };
}
