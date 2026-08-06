-- Mercado Pago Checkout Transparente (API Orders) — campos de pagamento / webhook
-- Idempotente: só adiciona colunas se ainda não existirem (Postgres).

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "partnerId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "environment" TEXT NOT NULL DEFAULT 'test';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "providerOrderId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "providerPaymentId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "externalReference" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "statusDetail" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS "Payment_partnerId_idx" ON "Payment"("partnerId");
CREATE INDEX IF NOT EXISTS "Payment_provider_status_idx" ON "Payment"("provider", "status");
CREATE INDEX IF NOT EXISTS "Payment_providerOrderId_idx" ON "Payment"("providerOrderId");
CREATE INDEX IF NOT EXISTS "Payment_externalReference_idx" ON "Payment"("externalReference");

ALTER TABLE "WebhookEvent" ADD COLUMN IF NOT EXISTS "payloadHash" TEXT;
ALTER TABLE "WebhookEvent" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;
ALTER TABLE "WebhookEvent" ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "WebhookEvent_payloadHash_idx" ON "WebhookEvent"("payloadHash");
