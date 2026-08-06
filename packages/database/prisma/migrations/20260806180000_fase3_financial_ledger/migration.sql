-- Fase 3: ledger financeiro, contas, reservas, repasses sandbox, chargebacks, conciliação
-- Não altera migrations históricas. Valores críticos do ledger em centavos (Int).

-- Order: snapshot financeiro estendido
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "platformPercentage" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "platformFixedFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "gatewayFeeEstimated" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "gatewayFeeActual" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "reserveAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "taxEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "financialLedgerPostedAt" TIMESTAMP(3);

-- PlatformSettings: política financeira provisória
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "gatewayFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 2.5;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "reservePercent" DOUBLE PRECISION NOT NULL DEFAULT 2;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "taxEstimatePercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "gatewayFeeBearer" TEXT NOT NULL DEFAULT 'PARTNER';
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "reserveHoldDays" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "manualAdjustmentDualApprovalLimit" DOUBLE PRECISION NOT NULL DEFAULT 500;

-- Enums
DO $$ BEGIN
  CREATE TYPE "LedgerAccountType" AS ENUM (
    'PLATFORM_REVENUE', 'PLATFORM_RECEIVABLE', 'PARTNER_PAYABLE', 'GATEWAY_FEES',
    'RESERVE', 'REFUNDS', 'CHARGEBACKS', 'TAX_ESTIMATE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FinancialLedgerEntryType" AS ENUM (
    'PAYMENT_RECEIVED', 'PLATFORM_COMMISSION', 'PLATFORM_FIXED_FEE',
    'GATEWAY_FEE_ESTIMATED', 'GATEWAY_FEE_ACTUAL', 'GATEWAY_FEE_ADJUSTMENT',
    'PARTNER_PAYABLE', 'RESERVE_HOLD', 'RESERVE_RELEASE', 'RESERVE_CONSUMPTION',
    'REFUND', 'REVERSAL_PLATFORM_COMMISSION', 'REVERSAL_PLATFORM_FIXED_FEE',
    'REVERSAL_PARTNER_PAYABLE', 'CHARGEBACK', 'PAYOUT', 'PAYOUT_REVERSAL',
    'ADJUSTMENT', 'TAX_ESTIMATE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FinancialLedgerDirection" AS ENUM ('DEBIT', 'CREDIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FinancialLedgerStatus" AS ENUM (
    'PENDING', 'POSTED', 'BLOCKED', 'AVAILABLE', 'SETTLED', 'REVERSED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FinancialReserveStatus" AS ENUM ('HELD', 'RELEASED', 'CONSUMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PartnerPayoutStatus" AS ENUM (
    'PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REVERSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FinancialChargebackStatus" AS ENUM (
    'OPEN', 'UNDER_REVIEW', 'WON', 'LOST', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FinancialReconciliationStatus" AS ENUM (
    'RECONCILED', 'VALUE_MISMATCH', 'STATUS_MISMATCH', 'MISSING_LEDGER',
    'MISSING_EXTERNAL_PAYMENT', 'DUPLICATE_EVENT', 'REFUND_MISMATCH', 'MANUAL_REVIEW'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "LedgerAccount" (
  "id" TEXT NOT NULL,
  "type" "LedgerAccountType" NOT NULL,
  "partnerId" TEXT,
  "ownerKey" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LedgerAccount_type_ownerKey_currency_key"
  ON "LedgerAccount"("type", "ownerKey", "currency");
CREATE INDEX IF NOT EXISTS "LedgerAccount_partnerId_type_idx"
  ON "LedgerAccount"("partnerId", "type");
CREATE INDEX IF NOT EXISTS "LedgerAccount_ownerKey_type_idx"
  ON "LedgerAccount"("ownerKey", "type");

CREATE TABLE IF NOT EXISTS "PartnerPayout" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "orderId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "status" "PartnerPayoutStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "externalReference" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "failureReason" TEXT,
  "approvedById" TEXT,
  "requestedById" TEXT,
  "paidById" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartnerPayout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PartnerPayout_idempotencyKey_key" ON "PartnerPayout"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "PartnerPayout_partnerId_status_idx" ON "PartnerPayout"("partnerId", "status");
CREATE INDEX IF NOT EXISTS "PartnerPayout_status_requestedAt_idx" ON "PartnerPayout"("status", "requestedAt");

CREATE TABLE IF NOT EXISTS "FinancialChargeback" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "partnerId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "reason" TEXT,
  "externalReference" TEXT,
  "status" "FinancialChargebackStatus" NOT NULL DEFAULT 'OPEN',
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolution" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialChargeback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FinancialChargeback_idempotencyKey_key" ON "FinancialChargeback"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "FinancialChargeback_paymentId_idx" ON "FinancialChargeback"("paymentId");
CREATE INDEX IF NOT EXISTS "FinancialChargeback_orderId_idx" ON "FinancialChargeback"("orderId");
CREATE INDEX IF NOT EXISTS "FinancialChargeback_partnerId_status_idx" ON "FinancialChargeback"("partnerId", "status");
CREATE INDEX IF NOT EXISTS "FinancialChargeback_status_openedAt_idx" ON "FinancialChargeback"("status", "openedAt");

CREATE TABLE IF NOT EXISTS "FinancialLedgerEntry" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "orderId" TEXT,
  "paymentId" TEXT,
  "partnerId" TEXT,
  "payoutId" TEXT,
  "chargebackId" TEXT,
  "entryType" "FinancialLedgerEntryType" NOT NULL,
  "direction" "FinancialLedgerDirection" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "status" "FinancialLedgerStatus" NOT NULL DEFAULT 'POSTED',
  "externalReference" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "availableAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FinancialLedgerEntry_idempotencyKey_key" ON "FinancialLedgerEntry"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "FinancialLedgerEntry_accountId_createdAt_idx" ON "FinancialLedgerEntry"("accountId", "createdAt");
CREATE INDEX IF NOT EXISTS "FinancialLedgerEntry_orderId_idx" ON "FinancialLedgerEntry"("orderId");
CREATE INDEX IF NOT EXISTS "FinancialLedgerEntry_paymentId_idx" ON "FinancialLedgerEntry"("paymentId");
CREATE INDEX IF NOT EXISTS "FinancialLedgerEntry_partnerId_status_entryType_idx" ON "FinancialLedgerEntry"("partnerId", "status", "entryType");
CREATE INDEX IF NOT EXISTS "FinancialLedgerEntry_payoutId_idx" ON "FinancialLedgerEntry"("payoutId");
CREATE INDEX IF NOT EXISTS "FinancialLedgerEntry_status_availableAt_idx" ON "FinancialLedgerEntry"("status", "availableAt");

CREATE TABLE IF NOT EXISTS "FinancialReserve" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "paymentId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "reserveReason" TEXT NOT NULL,
  "status" "FinancialReserveStatus" NOT NULL DEFAULT 'HELD',
  "availableAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  "idempotencyKey" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialReserve_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FinancialReserve_idempotencyKey_key" ON "FinancialReserve"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "FinancialReserve_partnerId_status_idx" ON "FinancialReserve"("partnerId", "status");
CREATE INDEX IF NOT EXISTS "FinancialReserve_orderId_idx" ON "FinancialReserve"("orderId");
CREATE INDEX IF NOT EXISTS "FinancialReserve_status_availableAt_idx" ON "FinancialReserve"("status", "availableAt");

CREATE TABLE IF NOT EXISTS "FinancialReconciliation" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT,
  "orderId" TEXT,
  "runId" TEXT,
  "status" "FinancialReconciliationStatus" NOT NULL,
  "expectedAmountCents" INTEGER,
  "receivedAmountCents" INTEGER,
  "summary" TEXT,
  "details" JSONB,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialReconciliation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FinancialReconciliation_idempotencyKey_key" ON "FinancialReconciliation"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "FinancialReconciliation_paymentId_createdAt_idx" ON "FinancialReconciliation"("paymentId", "createdAt");
CREATE INDEX IF NOT EXISTS "FinancialReconciliation_runId_idx" ON "FinancialReconciliation"("runId");
CREATE INDEX IF NOT EXISTS "FinancialReconciliation_status_createdAt_idx" ON "FinancialReconciliation"("status", "createdAt");

CREATE TABLE IF NOT EXISTS "FinancialManualAdjustment" (
  "id" TEXT NOT NULL,
  "partnerId" TEXT,
  "accountId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "direction" "FinancialLedgerDirection" NOT NULL,
  "reason" TEXT NOT NULL,
  "evidence" TEXT,
  "actorId" TEXT NOT NULL,
  "approverId" TEXT,
  "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
  "idempotencyKey" TEXT NOT NULL,
  "ledgerEntryId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialManualAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FinancialManualAdjustment_idempotencyKey_key" ON "FinancialManualAdjustment"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "FinancialManualAdjustment_partnerId_createdAt_idx" ON "FinancialManualAdjustment"("partnerId", "createdAt");
CREATE INDEX IF NOT EXISTS "FinancialManualAdjustment_actorId_createdAt_idx" ON "FinancialManualAdjustment"("actorId", "createdAt");

CREATE TABLE IF NOT EXISTS "FinancialReconciliationRun" (
  "id" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "paymentsChecked" INTEGER NOT NULL DEFAULT 0,
  "divergences" INTEGER NOT NULL DEFAULT 0,
  "triggeredBy" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "report" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialReconciliationRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FinancialReconciliationRun_idempotencyKey_key" ON "FinancialReconciliationRun"("idempotencyKey");

-- FKs (IF NOT EXISTS via DO blocks)
DO $$ BEGIN
  ALTER TABLE "PartnerPayout" ADD CONSTRAINT "PartnerPayout_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialChargeback" ADD CONSTRAINT "FinancialChargeback_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialChargeback" ADD CONSTRAINT "FinancialChargeback_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialLedgerEntry" ADD CONSTRAINT "FinancialLedgerEntry_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialLedgerEntry" ADD CONSTRAINT "FinancialLedgerEntry_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialLedgerEntry" ADD CONSTRAINT "FinancialLedgerEntry_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialLedgerEntry" ADD CONSTRAINT "FinancialLedgerEntry_payoutId_fkey"
    FOREIGN KEY ("payoutId") REFERENCES "PartnerPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialLedgerEntry" ADD CONSTRAINT "FinancialLedgerEntry_chargebackId_fkey"
    FOREIGN KEY ("chargebackId") REFERENCES "FinancialChargeback"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialReserve" ADD CONSTRAINT "FinancialReserve_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialReconciliation" ADD CONSTRAINT "FinancialReconciliation_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FinancialReconciliation" ADD CONSTRAINT "FinancialReconciliation_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
