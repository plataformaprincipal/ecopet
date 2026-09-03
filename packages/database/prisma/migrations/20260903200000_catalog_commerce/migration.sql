-- AlterEnum
ALTER TYPE "PricingCommercialAvailability" ADD VALUE IF NOT EXISTS 'PRICE_PENDING';

-- AlterTable
ALTER TABLE "PricingCatalogItem" ADD COLUMN IF NOT EXISTS "billingEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CatalogSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCEL_SCHEDULED', 'CANCELLED', 'EXPIRED', 'DRAFT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CatalogEntitlementStatus" AS ENUM ('AVAILABLE', 'ACTIVE', 'CONSUMED', 'CANCELLED', 'REFUNDED', 'EXPIRED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CreditLedgerStatus" AS ENUM ('AVAILABLE', 'CONSUMED', 'EXPIRED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "HealthCaseKind" AS ENUM ('TELECONSULT', 'TELEORIENTATION', 'SECOND_OPINION', 'EXAM_REVIEW', 'REPORT', 'CERTIFICATE', 'TRIAGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "HealthCaseStatus" AS ENUM ('DRAFT', 'AWAITING_PAYMENT', 'PAID', 'SCHEDULED', 'IN_PROGRESS', 'AWAITING_PROFESSIONAL', 'READY_FOR_REVIEW', 'ISSUED', 'CANCELLED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProtectionEnrollmentStatus" AS ENUM ('CATALOG', 'PENDING_PARTNER', 'ACTIVE', 'CANCELLED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EntertainmentMembershipStatus" AS ENUM ('DRAFT', 'PRICE_PENDING', 'ACTIVE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CatalogSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerId" TEXT,
    "sku" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "status" "CatalogSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "annualAmountCents" INTEGER,
    "setupAmountCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "pricingVersion" TEXT NOT NULL,
    "pricingSnapshot" JSONB,
    "billingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "mpPreapprovalId" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CatalogSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CatalogEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "petId" TEXT,
    "partnerId" TEXT,
    "sku" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "status" "CatalogEntitlementStatus" NOT NULL DEFAULT 'AVAILABLE',
    "usageLimit" INTEGER NOT NULL DEFAULT 1,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "orderId" TEXT,
    "orderItemId" TEXT,
    "subscriptionId" TEXT,
    "paymentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CatalogEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CreditLedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "reference" TEXT,
    "status" "CreditLedgerStatus" NOT NULL DEFAULT 'AVAILABLE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HealthClinicalCase" (
    "id" TEXT NOT NULL,
    "kind" "HealthCaseKind" NOT NULL,
    "status" "HealthCaseStatus" NOT NULL DEFAULT 'DRAFT',
    "sku" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "professionalUserId" TEXT,
    "orderId" TEXT,
    "entitlementId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "intakeJson" JSONB,
    "aiDraftJson" JSONB,
    "professionalNotes" TEXT,
    "crmv" TEXT,
    "issuedAt" TIMESTAMP(3),
    "auditTrail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthClinicalCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HealthClinicalDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "storageKey" TEXT,
    "pdfIdentified" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "signedByCrmv" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthClinicalDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProtectionEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "petId" TEXT,
    "sku" TEXT NOT NULL,
    "status" "ProtectionEnrollmentStatus" NOT NULL DEFAULT 'PENDING_PARTNER',
    "amountCents" INTEGER NOT NULL,
    "partnerCode" TEXT,
    "coverageJson" JSONB,
    "exclusionsJson" JSONB,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProtectionEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProtectionClaim" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "documentsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProtectionClaim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EntertainmentMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "petId" TEXT,
    "sku" TEXT NOT NULL DEFAULT 'ENT-DRAFT',
    "status" "EntertainmentMembershipStatus" NOT NULL DEFAULT 'PRICE_PENDING',
    "billingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EntertainmentMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SkuRefundPolicy" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "beforeAcceptRefund" BOOLEAN NOT NULL DEFAULT true,
    "afterStartPolicy" TEXT NOT NULL DEFAULT 'SKU_SPECIFIC',
    "noShowProviderMaxBps" INTEGER NOT NULL DEFAULT 5000,
    "payoutDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SkuRefundPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CatalogEntitlement_orderItemId_key" ON "CatalogEntitlement"("orderItemId");
CREATE INDEX IF NOT EXISTS "CatalogSubscription_userId_status_idx" ON "CatalogSubscription"("userId", "status");
CREATE INDEX IF NOT EXISTS "CatalogSubscription_sku_status_idx" ON "CatalogSubscription"("sku", "status");
CREATE INDEX IF NOT EXISTS "CatalogSubscription_orderId_idx" ON "CatalogSubscription"("orderId");
CREATE INDEX IF NOT EXISTS "CatalogSubscription_currentPeriodEnd_idx" ON "CatalogSubscription"("currentPeriodEnd");
CREATE INDEX IF NOT EXISTS "CatalogEntitlement_userId_status_idx" ON "CatalogEntitlement"("userId", "status");
CREATE INDEX IF NOT EXISTS "CatalogEntitlement_sku_idx" ON "CatalogEntitlement"("sku");
CREATE INDEX IF NOT EXISTS "CatalogEntitlement_petId_idx" ON "CatalogEntitlement"("petId");
CREATE INDEX IF NOT EXISTS "CatalogEntitlement_orderId_idx" ON "CatalogEntitlement"("orderId");
CREATE INDEX IF NOT EXISTS "CatalogEntitlement_subscriptionId_idx" ON "CatalogEntitlement"("subscriptionId");
CREATE INDEX IF NOT EXISTS "CreditLedgerEntry_userId_status_idx" ON "CreditLedgerEntry"("userId", "status");
CREATE INDEX IF NOT EXISTS "CreditLedgerEntry_expiresAt_idx" ON "CreditLedgerEntry"("expiresAt");
CREATE INDEX IF NOT EXISTS "CreditLedgerEntry_reference_idx" ON "CreditLedgerEntry"("reference");
CREATE INDEX IF NOT EXISTS "HealthClinicalCase_userId_status_idx" ON "HealthClinicalCase"("userId", "status");
CREATE INDEX IF NOT EXISTS "HealthClinicalCase_professionalUserId_status_idx" ON "HealthClinicalCase"("professionalUserId", "status");
CREATE INDEX IF NOT EXISTS "HealthClinicalCase_petId_idx" ON "HealthClinicalCase"("petId");
CREATE INDEX IF NOT EXISTS "HealthClinicalCase_sku_idx" ON "HealthClinicalCase"("sku");
CREATE INDEX IF NOT EXISTS "HealthClinicalCase_orderId_idx" ON "HealthClinicalCase"("orderId");
CREATE INDEX IF NOT EXISTS "HealthClinicalDocument_caseId_idx" ON "HealthClinicalDocument"("caseId");
CREATE INDEX IF NOT EXISTS "ProtectionEnrollment_userId_status_idx" ON "ProtectionEnrollment"("userId", "status");
CREATE INDEX IF NOT EXISTS "ProtectionEnrollment_sku_idx" ON "ProtectionEnrollment"("sku");
CREATE INDEX IF NOT EXISTS "ProtectionEnrollment_petId_idx" ON "ProtectionEnrollment"("petId");
CREATE INDEX IF NOT EXISTS "ProtectionClaim_enrollmentId_status_idx" ON "ProtectionClaim"("enrollmentId", "status");
CREATE INDEX IF NOT EXISTS "EntertainmentMembership_userId_status_idx" ON "EntertainmentMembership"("userId", "status");
CREATE INDEX IF NOT EXISTS "EntertainmentMembership_sku_idx" ON "EntertainmentMembership"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "SkuRefundPolicy_sku_key" ON "SkuRefundPolicy"("sku");

ALTER TABLE "CatalogSubscription" ADD CONSTRAINT "CatalogSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogSubscription" ADD CONSTRAINT "CatalogSubscription_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CatalogEntitlement" ADD CONSTRAINT "CatalogEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogEntitlement" ADD CONSTRAINT "CatalogEntitlement_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CatalogEntitlement" ADD CONSTRAINT "CatalogEntitlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CatalogEntitlement" ADD CONSTRAINT "CatalogEntitlement_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "CatalogSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthClinicalCase" ADD CONSTRAINT "HealthClinicalCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthClinicalCase" ADD CONSTRAINT "HealthClinicalCase_professionalUserId_fkey" FOREIGN KEY ("professionalUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HealthClinicalCase" ADD CONSTRAINT "HealthClinicalCase_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthClinicalCase" ADD CONSTRAINT "HealthClinicalCase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HealthClinicalDocument" ADD CONSTRAINT "HealthClinicalDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "HealthClinicalCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProtectionEnrollment" ADD CONSTRAINT "ProtectionEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProtectionEnrollment" ADD CONSTRAINT "ProtectionEnrollment_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProtectionEnrollment" ADD CONSTRAINT "ProtectionEnrollment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProtectionClaim" ADD CONSTRAINT "ProtectionClaim_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProtectionEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntertainmentMembership" ADD CONSTRAINT "EntertainmentMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntertainmentMembership" ADD CONSTRAINT "EntertainmentMembership_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EntertainmentMembership" ADD CONSTRAINT "EntertainmentMembership_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
