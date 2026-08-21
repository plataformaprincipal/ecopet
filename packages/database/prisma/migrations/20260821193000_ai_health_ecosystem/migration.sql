-- EccoPet AI Health Ecosystem: 13 produtos, assinaturas, workbooks, health profile.
-- Incremental. Não dropa tabelas nem dados.

ALTER TYPE "AIEntitlementStatus" ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE "AIEntitlementStatus" ADD VALUE IF NOT EXISTS 'RESERVED';

ALTER TYPE "AIExecutionStatus" ADD VALUE IF NOT EXISTS 'CREATED';

ALTER TABLE "AIProductPrice" ADD COLUMN IF NOT EXISTS "reference" TEXT;
ALTER TABLE "AIProductPrice" ADD COLUMN IF NOT EXISTS "billingType" TEXT;
ALTER TABLE "AIProductPrice" ADD COLUMN IF NOT EXISTS "usageLimit" INTEGER;

ALTER TABLE "AIEntitlement" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
CREATE INDEX IF NOT EXISTS "AIEntitlement_subscriptionId_idx" ON "AIEntitlement"("subscriptionId");

ALTER TABLE "AIReport" ADD COLUMN IF NOT EXISTS "verificationHash" TEXT;

DO $$ BEGIN
  CREATE TYPE "AISubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AISubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "productId" TEXT,
  "status" "AISubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "currentPeriodStart" TIMESTAMP(3) NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "cancelledAt" TIMESTAMP(3),
  "mercadoPagoSubscriptionId" TEXT,
  "usageAllowance" INTEGER NOT NULL DEFAULT 1,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AISubscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AISubscription_userId_status_idx" ON "AISubscription"("userId", "status");
CREATE INDEX IF NOT EXISTS "AISubscription_petId_sku_idx" ON "AISubscription"("petId", "sku");
CREATE INDEX IF NOT EXISTS "AISubscription_sku_status_idx" ON "AISubscription"("sku", "status");
CREATE INDEX IF NOT EXISTS "AISubscription_currentPeriodEnd_idx" ON "AISubscription"("currentPeriodEnd");

CREATE TABLE IF NOT EXISTS "AIWorkbook" (
  "id" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "version" TEXT NOT NULL DEFAULT 'v1',
  "storageKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIWorkbook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIWorkbook_userId_createdAt_idx" ON "AIWorkbook"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIWorkbook_executionId_idx" ON "AIWorkbook"("executionId");
CREATE INDEX IF NOT EXISTS "AIWorkbook_petId_idx" ON "AIWorkbook"("petId");

CREATE TABLE IF NOT EXISTS "PetHealthProfile" (
  "id" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "activatedFromEntitlementId" TEXT,
  "lastSummary" JSONB,
  "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PetHealthProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PetHealthProfile_petId_key" ON "PetHealthProfile"("petId");
CREATE INDEX IF NOT EXISTS "PetHealthProfile_userId_idx" ON "PetHealthProfile"("userId");

CREATE TABLE IF NOT EXISTS "AICommerceFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "helpful" BOOLEAN NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AICommerceFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AICommerceFeedback_executionId_key" ON "AICommerceFeedback"("executionId");
CREATE INDEX IF NOT EXISTS "AICommerceFeedback_userId_createdAt_idx" ON "AICommerceFeedback"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "AISubscription" ADD CONSTRAINT "AISubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "AISubscription" ADD CONSTRAINT "AISubscription_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "AISubscription" ADD CONSTRAINT "AISubscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "AIProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "AIEntitlement" ADD CONSTRAINT "AIEntitlement_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "AISubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "AIWorkbook" ADD CONSTRAINT "AIWorkbook_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AIExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "AIWorkbook" ADD CONSTRAINT "AIWorkbook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "AIWorkbook" ADD CONSTRAINT "AIWorkbook_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PetHealthProfile" ADD CONSTRAINT "PetHealthProfile_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PetHealthProfile" ADD CONSTRAINT "PetHealthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "AICommerceFeedback" ADD CONSTRAINT "AICommerceFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "AICommerceFeedback" ADD CONSTRAINT "AICommerceFeedback_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AIExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
