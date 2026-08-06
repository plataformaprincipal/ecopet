-- AlterEnum OrderStatus (idempotente)
DO $$ BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE 'PARTIALLY_REFUNDED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable Payment
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paymentType" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "installments" INTEGER;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundLockUntil" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundLockBy" TEXT;

-- CreateTable PaymentRefund
CREATE TABLE IF NOT EXISTS "PaymentRefund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buyerUserId" TEXT,
    "providerRefundId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "internalReason" TEXT,
    "requestedById" TEXT,
    "approvedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "providerStatus" TEXT,
    "idempotencyKey" TEXT,
    "stockReturnStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentRefund_idempotencyKey_key" ON "PaymentRefund"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "PaymentRefund_paymentId_createdAt_idx" ON "PaymentRefund"("paymentId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentRefund_orderId_createdAt_idx" ON "PaymentRefund"("orderId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentRefund_status_createdAt_idx" ON "PaymentRefund"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentRefund_providerRefundId_idx" ON "PaymentRefund"("providerRefundId");

ALTER TABLE "PaymentRefund" DROP CONSTRAINT IF EXISTS "PaymentRefund_paymentId_fkey";
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentRefund" DROP CONSTRAINT IF EXISTS "PaymentRefund_orderId_fkey";
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentRefund" DROP CONSTRAINT IF EXISTS "PaymentRefund_requestedById_fkey";
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentRefund" DROP CONSTRAINT IF EXISTS "PaymentRefund_approvedById_fkey";
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable PaymentMethodConfiguration
CREATE TABLE IF NOT EXISTS "PaymentMethodConfiguration" (
    "id" TEXT NOT NULL,
    "methodId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "supportedByAccount" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckedAt" TIMESTAMP(3),
    "notes" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethodConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentMethodConfiguration_methodId_key" ON "PaymentMethodConfiguration"("methodId");
CREATE INDEX IF NOT EXISTS "PaymentMethodConfiguration_enabled_supportedByAccount_idx"
  ON "PaymentMethodConfiguration"("enabled", "supportedByAccount");
