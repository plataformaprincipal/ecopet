-- EccoPet AI Commerce: catálogo pago, entitlements, execuções, relatórios e carrinho digital.
-- Incremental: não dropa tabelas existentes.

-- CartItem: suporte a DIGITAL_AI (productId opcional)
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "itemType" TEXT NOT NULL DEFAULT 'product';
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "lineKey" TEXT;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "petId" TEXT;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "pricingVersion" TEXT;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

UPDATE "CartItem"
SET "lineKey" = 'product:' || "productId"
WHERE "lineKey" IS NULL AND "productId" IS NOT NULL;

ALTER TABLE "CartItem" ALTER COLUMN "productId" DROP NOT NULL;

UPDATE "CartItem"
SET "lineKey" = 'orphan:' || "id"
WHERE "lineKey" IS NULL;
ALTER TABLE "CartItem" ALTER COLUMN "lineKey" SET NOT NULL;

ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_cartId_productId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_cartId_lineKey_key" ON "CartItem"("cartId", "lineKey");
CREATE INDEX IF NOT EXISTS "CartItem_sku_idx" ON "CartItem"("sku");
CREATE INDEX IF NOT EXISTS "CartItem_petId_idx" ON "CartItem"("petId");
CREATE INDEX IF NOT EXISTS "CartItem_itemType_idx" ON "CartItem"("itemType");

-- OrderItem: snapshot de SKU/pet para DIGITAL_AI
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "petId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
CREATE INDEX IF NOT EXISTS "OrderItem_sku_idx" ON "OrderItem"("sku");
CREATE INDEX IF NOT EXISTS "OrderItem_petId_idx" ON "OrderItem"("petId");
CREATE INDEX IF NOT EXISTS "OrderItem_itemType_idx" ON "OrderItem"("itemType");

-- Cupom: elegibilidade por SKU (JSON string[])
ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "eligibleSkus" JSONB;

-- Enums
DO $$ BEGIN
  CREATE TYPE "AIProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "AIEntitlementStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'CONSUMED', 'REVOKED', 'EXPIRED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "AIExecutionStatus" AS ENUM ('DRAFT', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "AIUrgencyLevel" AS ENUM ('ROUTINE', 'MONITOR', 'SOON', 'URGENT', 'EMERGENCY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "AIAssetStatus" AS ENUM ('PENDING', 'READY', 'REJECTED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AIProduct" (
  "id" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "longDescription" TEXT NOT NULL,
  "status" "AIProductStatus" NOT NULL DEFAULT 'DRAFT',
  "category" TEXT NOT NULL,
  "billingType" TEXT NOT NULL DEFAULT 'ONE_TIME',
  "usageLimit" INTEGER NOT NULL DEFAULT 1,
  "capabilityId" TEXT NOT NULL,
  "icon" TEXT,
  "heroAsset" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "badge" TEXT,
  "maxImages" INTEGER,
  "maxFiles" INTEGER,
  "avgFillMinutes" INTEGER,
  "pricesConfirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIProduct_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AIProduct_sku_key" ON "AIProduct"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "AIProduct_slug_key" ON "AIProduct"("slug");
CREATE INDEX IF NOT EXISTS "AIProduct_status_sortOrder_idx" ON "AIProduct"("status", "sortOrder");
CREATE INDEX IF NOT EXISTS "AIProduct_capabilityId_idx" ON "AIProduct"("capabilityId");

CREATE TABLE IF NOT EXISTS "AIProductPrice" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "priceInCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "version" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "source" TEXT NOT NULL DEFAULT 'ADMIN_DEFAULT_PENDING_COMMERCIAL',
  "actorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIProductPrice_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AIProductPrice_productId_active_idx" ON "AIProductPrice"("productId", "active");
CREATE INDEX IF NOT EXISTS "AIProductPrice_productId_version_idx" ON "AIProductPrice"("productId", "version");

CREATE TABLE IF NOT EXISTS "AIEntitlement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "productId" TEXT,
  "orderId" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "paymentId" TEXT,
  "status" "AIEntitlementStatus" NOT NULL DEFAULT 'AVAILABLE',
  "usageLimit" INTEGER NOT NULL DEFAULT 1,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "reservedExecutionId" TEXT,
  "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activatedAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIEntitlement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AIEntitlement_orderItemId_key" ON "AIEntitlement"("orderItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "AIEntitlement_reservedExecutionId_key" ON "AIEntitlement"("reservedExecutionId");
CREATE INDEX IF NOT EXISTS "AIEntitlement_userId_status_idx" ON "AIEntitlement"("userId", "status");
CREATE INDEX IF NOT EXISTS "AIEntitlement_petId_idx" ON "AIEntitlement"("petId");
CREATE INDEX IF NOT EXISTS "AIEntitlement_sku_idx" ON "AIEntitlement"("sku");
CREATE INDEX IF NOT EXISTS "AIEntitlement_orderId_idx" ON "AIEntitlement"("orderId");
CREATE INDEX IF NOT EXISTS "AIEntitlement_status_idx" ON "AIEntitlement"("status");
CREATE INDEX IF NOT EXISTS "AIEntitlement_createdAt_idx" ON "AIEntitlement"("createdAt");

CREATE TABLE IF NOT EXISTS "AIExecution" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "productId" TEXT,
  "entitlementId" TEXT NOT NULL,
  "capabilityId" TEXT NOT NULL,
  "status" "AIExecutionStatus" NOT NULL DEFAULT 'DRAFT',
  "inputSnapshot" JSONB,
  "structuredOutput" JSONB,
  "model" TEXT,
  "promptVersion" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "failureCode" TEXT,
  "failureMessage" TEXT,
  "inputTokens" INTEGER,
  "cachedInputTokens" INTEGER,
  "outputTokens" INTEGER,
  "estimatedCostUsd" DOUBLE PRECISION,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIExecution_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AIExecution_userId_createdAt_idx" ON "AIExecution"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIExecution_petId_idx" ON "AIExecution"("petId");
CREATE INDEX IF NOT EXISTS "AIExecution_entitlementId_idx" ON "AIExecution"("entitlementId");
CREATE INDEX IF NOT EXISTS "AIExecution_status_idx" ON "AIExecution"("status");
CREATE INDEX IF NOT EXISTS "AIExecution_capabilityId_idx" ON "AIExecution"("capabilityId");
CREATE INDEX IF NOT EXISTS "AIExecution_createdAt_idx" ON "AIExecution"("createdAt");

CREATE TABLE IF NOT EXISTS "AIReport" (
  "id" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "version" TEXT NOT NULL DEFAULT 'v1',
  "structuredData" JSONB NOT NULL,
  "pdfStorageKey" TEXT,
  "pdfUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AIReport_userId_createdAt_idx" ON "AIReport"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIReport_petId_createdAt_idx" ON "AIReport"("petId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIReport_executionId_idx" ON "AIReport"("executionId");

CREATE TABLE IF NOT EXISTS "AIUploadedAsset" (
  "id" TEXT NOT NULL,
  "executionId" TEXT,
  "userId" TEXT NOT NULL,
  "petId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "status" "AIAssetStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIUploadedAsset_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AIUploadedAsset_userId_idx" ON "AIUploadedAsset"("userId");
CREATE INDEX IF NOT EXISTS "AIUploadedAsset_petId_idx" ON "AIUploadedAsset"("petId");
CREATE INDEX IF NOT EXISTS "AIUploadedAsset_executionId_idx" ON "AIUploadedAsset"("executionId");
CREATE INDEX IF NOT EXISTS "AIUploadedAsset_sha256_idx" ON "AIUploadedAsset"("sha256");
CREATE INDEX IF NOT EXISTS "AIUploadedAsset_status_idx" ON "AIUploadedAsset"("status");

CREATE TABLE IF NOT EXISTS "AICommerceAuditEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "sku" TEXT,
  "orderId" TEXT,
  "paymentId" TEXT,
  "executionId" TEXT,
  "entitlementId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AICommerceAuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AICommerceAuditEvent_userId_createdAt_idx" ON "AICommerceAuditEvent"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AICommerceAuditEvent_action_createdAt_idx" ON "AICommerceAuditEvent"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "AICommerceAuditEvent_sku_idx" ON "AICommerceAuditEvent"("sku");
CREATE INDEX IF NOT EXISTS "AICommerceAuditEvent_orderId_idx" ON "AICommerceAuditEvent"("orderId");
CREATE INDEX IF NOT EXISTS "AICommerceAuditEvent_executionId_idx" ON "AICommerceAuditEvent"("executionId");

ALTER TABLE "AIProductPrice" ADD CONSTRAINT "AIProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "AIProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIProductPrice" ADD CONSTRAINT "AIProductPrice_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIEntitlement" ADD CONSTRAINT "AIEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIEntitlement" ADD CONSTRAINT "AIEntitlement_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIEntitlement" ADD CONSTRAINT "AIEntitlement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "AIProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIEntitlement" ADD CONSTRAINT "AIEntitlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIEntitlement" ADD CONSTRAINT "AIEntitlement_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_productId_fkey" FOREIGN KEY ("productId") REFERENCES "AIProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "AIEntitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIReport" ADD CONSTRAINT "AIReport_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AIExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIReport" ADD CONSTRAINT "AIReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIReport" ADD CONSTRAINT "AIReport_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIUploadedAsset" ADD CONSTRAINT "AIUploadedAsset_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AIExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIUploadedAsset" ADD CONSTRAINT "AIUploadedAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIUploadedAsset" ADD CONSTRAINT "AIUploadedAsset_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AICommerceAuditEvent" ADD CONSTRAINT "AICommerceAuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
