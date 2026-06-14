-- CreateEnum
CREATE TYPE "ProductCatalogStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK');
CREATE TYPE "ProductCatalogCategory" AS ENUM ('FOOD', 'HYGIENE', 'TOYS', 'ACCESSORIES', 'MEDICINE', 'HEALTH', 'BEDDING', 'TRANSPORT', 'OTHER');
CREATE TYPE "ReviewModerationStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'REPORTED');

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "catalogCategory" "ProductCatalogCategory";
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "brand" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "speciesTarget" "PetSpecies";
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "barcode" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "weightGrams" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "dimensions" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "status" "ProductCatalogStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable Service
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Cart
ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Cart" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable CartItem
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "unitPriceSnapshot" DOUBLE PRECISION;

-- AlterTable Review
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "moderationStatus" "ReviewModerationStatus" NOT NULL DEFAULT 'VISIBLE';
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "hiddenAt" TIMESTAMP(3);
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "hiddenBy" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "reportCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable PetDocument
ALTER TABLE "PetDocument" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
ALTER TABLE "PetDocument" ADD COLUMN IF NOT EXISTS "sizeBytes" INTEGER;
ALTER TABLE "PetDocument" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable EmailLog
ALTER TABLE "EmailLog" ADD COLUMN IF NOT EXISTS "event" TEXT;

-- CreateTable ServiceReview
CREATE TABLE IF NOT EXISTS "ServiceReview" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "moderationStatus" "ReviewModerationStatus" NOT NULL DEFAULT 'VISIBLE',
    "hiddenAt" TIMESTAMP(3),
    "hiddenBy" TEXT,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable InventoryLog
CREATE TABLE IF NOT EXISTS "InventoryLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "reason" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ServiceReview_appointmentId_key" ON "ServiceReview"("appointmentId");
CREATE INDEX IF NOT EXISTS "ServiceReview_serviceId_idx" ON "ServiceReview"("serviceId");
CREATE INDEX IF NOT EXISTS "ServiceReview_partnerId_idx" ON "ServiceReview"("partnerId");
CREATE INDEX IF NOT EXISTS "ServiceReview_moderationStatus_idx" ON "ServiceReview"("moderationStatus");
CREATE INDEX IF NOT EXISTS "InventoryLog_productId_createdAt_idx" ON "InventoryLog"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "InventoryLog_partnerId_idx" ON "InventoryLog"("partnerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Cart_sessionId_key" ON "Cart"("sessionId");
CREATE INDEX IF NOT EXISTS "Cart_sessionId_idx" ON "Cart"("sessionId");
CREATE INDEX IF NOT EXISTS "Product_status_idx" ON "Product"("status");
CREATE INDEX IF NOT EXISTS "Product_deletedAt_idx" ON "Product"("deletedAt");
CREATE INDEX IF NOT EXISTS "Product_catalogCategory_idx" ON "Product"("catalogCategory");
CREATE INDEX IF NOT EXISTS "Review_moderationStatus_idx" ON "Review"("moderationStatus");
CREATE INDEX IF NOT EXISTS "PetDocument_deletedAt_idx" ON "PetDocument"("deletedAt");
CREATE INDEX IF NOT EXISTS "EmailLog_event_idx" ON "EmailLog"("event");

DO $$ BEGIN
 ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
 ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
 ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
 ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
 ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
 ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Unique SKU per seller (nullable sku allowed)
CREATE UNIQUE INDEX IF NOT EXISTS "Product_sellerId_sku_key" ON "Product"("sellerId", "sku") WHERE "sku" IS NOT NULL;
