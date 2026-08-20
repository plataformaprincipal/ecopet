-- Pricing foundation: versioned catalog, rules, snapshots and official launch defaults.
-- Runtime source of truth is PricingVersion ACTIVE + Pricing Engine (not PDFs).

-- CreateEnum
CREATE TYPE "PricingVersionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "PricingSuite" AS ENUM ('MARKET', 'SERVICES', 'HEALTH', 'ONE', 'PRO', 'AI', 'ADS', 'PROTECT', 'CONNECT', 'API');
CREATE TYPE "PricingMode" AS ENUM ('SELLER_DEFINED', 'PROVIDER_DEFINED', 'ECCOPET_FIXED', 'PARTNER_PRODUCT', 'REFERENCE_ONLY');
CREATE TYPE "PricingItemKind" AS ENUM ('PRODUCT', 'SERVICE', 'HEALTH', 'SUBSCRIPTION', 'ADDON', 'AI', 'ADS', 'PROTECT', 'IOT', 'API');
CREATE TYPE "PricingCommercialAvailability" AS ENUM ('PURCHASABLE', 'CATALOG_ONLY', 'FEATURE_FLAGGED', 'PARTNER_REQUIRED', 'DISABLED');
CREATE TYPE "PricingRevenueRecognition" AS ENUM ('COMMISSION_AND_FEE', 'SUBSCRIPTION', 'MANAGEMENT_FEE', 'AFFILIATE_COMMISSION', 'PASS_THROUGH_NOT_REVENUE', 'PREMIUM_NOT_REVENUE');

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "pricingVersion" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "pricingSnapshot" JSONB;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "grossAmount" DOUBLE PRECISION;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "platformFeeAmount" DOUBLE PRECISION;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "partnerAmount" DOUBLE PRECISION;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "bookingFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "urgentFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "pricingCatalogSku" TEXT;

ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "pricingCatalogSku" TEXT;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pricingSnapshot" JSONB;

ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "fundedBy" TEXT NOT NULL DEFAULT 'ECCOPET';
ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "marginFloorBps" INTEGER;
ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "pricingVersionId" TEXT;

ALTER TABLE "PlatformSettings" ALTER COLUMN "pricingVersion" SET DEFAULT 'BR-2026.08-v1';
ALTER TABLE "PlatformSettings" ALTER COLUMN "platformFixedFee" SET DEFAULT 1.49;
ALTER TABLE "PlatformSettings" ALTER COLUMN "gatewayFeePercent" SET DEFAULT 3;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "gatewayFixedFee" DOUBLE PRECISION NOT NULL DEFAULT 0.49;
ALTER TABLE "PlatformSettings" ALTER COLUMN "reservePercent" SET DEFAULT 1.5;
ALTER TABLE "PlatformSettings" ALTER COLUMN "taxEstimatePercent" SET DEFAULT 12;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "activePricingVersionId" TEXT;

CREATE TABLE "PricingVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "PricingVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rollbackVersionId" TEXT,
    "sourceDocument" TEXT NOT NULL DEFAULT 'Planejamento Financeiro e Orçamentário',
    "sourceSection" TEXT,
    "rulesJson" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingCatalogItem" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "suite" "PricingSuite" NOT NULL,
    "kind" "PricingItemKind" NOT NULL,
    "pricingMode" "PricingMode" NOT NULL,
    "commercialAvailability" "PricingCommercialAvailability" NOT NULL DEFAULT 'CATALOG_ONLY',
    "revenueRecognition" "PricingRevenueRecognition" NOT NULL DEFAULT 'COMMISSION_AND_FEE',
    "amountCents" INTEGER,
    "annualAmountCents" INTEGER,
    "setupAmountCents" INTEGER,
    "referenceTicketCents" INTEGER,
    "referenceTutorCents" INTEGER,
    "providerBaseCents" INTEGER,
    "rangeMinCents" INTEGER,
    "rangeMaxCents" INTEGER,
    "nationalReferenceCents" INTEGER,
    "costReferenceCents" INTEGER,
    "eccopetRevenueRefCents" INTEGER,
    "unit" TEXT,
    "billingCycle" TEXT,
    "urgentEligible" BOOLEAN NOT NULL DEFAULT false,
    "complexProcedure" BOOLEAN NOT NULL DEFAULT false,
    "allowZero" BOOLEAN NOT NULL DEFAULT false,
    "capabilityId" TEXT,
    "portfolioSuiteId" TEXT,
    "mediaPassThrough" BOOLEAN NOT NULL DEFAULT false,
    "sourceDocument" TEXT NOT NULL,
    "sourceSection" TEXT NOT NULL,
    "sourceSku" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "formulaJson" JSONB NOT NULL,
    "floorMarginBps" INTEGER,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingContractOverride" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "commissionPercentBps" INTEGER NOT NULL,
    "fixedFeeCents" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedByAdminId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "floorPercentBps" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingContractOverride_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingPromotion" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "fundedBy" TEXT NOT NULL DEFAULT 'ECCOPET',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maxUsage" INTEGER,
    "maxUsagePerUser" INTEGER,
    "marginFloorBps" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPromotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PricingAuditEvent" (
    "id" TEXT NOT NULL,
    "versionId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PricingVersion_version_country_key" ON "PricingVersion"("version", "country");
CREATE INDEX "PricingVersion_status_country_currency_idx" ON "PricingVersion"("status", "country", "currency");
CREATE INDEX "PricingVersion_validFrom_idx" ON "PricingVersion"("validFrom");

CREATE UNIQUE INDEX "PricingCatalogItem_versionId_sku_key" ON "PricingCatalogItem"("versionId", "sku");
CREATE INDEX "PricingCatalogItem_suite_sku_idx" ON "PricingCatalogItem"("suite", "sku");
CREATE INDEX "PricingCatalogItem_kind_idx" ON "PricingCatalogItem"("kind");
CREATE INDEX "PricingCatalogItem_commercialAvailability_idx" ON "PricingCatalogItem"("commercialAvailability");

CREATE UNIQUE INDEX "PricingRule_versionId_code_key" ON "PricingRule"("versionId", "code");
CREATE INDEX "PricingRule_scope_idx" ON "PricingRule"("scope");

CREATE INDEX "PricingContractOverride_partnerId_validFrom_validTo_idx" ON "PricingContractOverride"("partnerId", "validFrom", "validTo");
CREATE INDEX "PricingContractOverride_versionId_idx" ON "PricingContractOverride"("versionId");

CREATE INDEX "PricingPromotion_status_validFrom_validTo_idx" ON "PricingPromotion"("status", "validFrom", "validTo");
CREATE INDEX "PricingPromotion_versionId_idx" ON "PricingPromotion"("versionId");

CREATE INDEX "PricingAuditEvent_versionId_createdAt_idx" ON "PricingAuditEvent"("versionId", "createdAt");
CREATE INDEX "PricingAuditEvent_action_createdAt_idx" ON "PricingAuditEvent"("action", "createdAt");

ALTER TABLE "PricingCatalogItem" ADD CONSTRAINT "PricingCatalogItem_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PricingVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PricingVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PricingContractOverride" ADD CONSTRAINT "PricingContractOverride_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PricingVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PricingPromotion" ADD CONSTRAINT "PricingPromotion_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PricingVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PricingAuditEvent" ADD CONSTRAINT "PricingAuditEvent_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PricingVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
