-- Fase 2: snapshot comercial + precificação contábil (NÃO é split/repasse)
-- Justificativa: pedidos devem preservar gross/fee/partnerAmount/pricingVersion
-- e aceitar idempotencyKey no checkout. Campos são contábeis, não payout.

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "grossAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "platformFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "partnerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pricingVersion" TEXT NOT NULL DEFAULT 'v1';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'BRL';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "grossAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "platformFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "partnerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "pricingVersion" TEXT NOT NULL DEFAULT 'v1';

CREATE INDEX IF NOT EXISTS "OrderItem_partnerId_idx" ON "OrderItem"("partnerId");

ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "pricingVersion" TEXT NOT NULL DEFAULT 'v1';
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "platformFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 10;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "platformFixedFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
