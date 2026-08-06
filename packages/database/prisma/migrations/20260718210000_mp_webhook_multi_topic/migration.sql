-- Mercado Pago multi-topic webhooks + entidades de domínio

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "fulfillmentBlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "fraudHold" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "Order_fraudHold_idx" ON "Order"("fraudHold");
CREATE INDEX IF NOT EXISTS "Order_fulfillmentBlocked_idx" ON "Order"("fulfillmentBlocked");

DO $$ BEGIN
  CREATE TYPE "MpWebhookProcessingStatus" AS ENUM (
    'RECEIVED','VALIDATED','PROCESSING','PROCESSED','IGNORED','UNSUPPORTED',
    'NOT_APPLICABLE','RETRY_PENDING','FAILED','DEAD_LETTER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MpFraudAlertStatus" AS ENUM (
    'PENDING_REVIEW','APPROVED','REJECTED','BLOCKED','RELEASED','REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MpClaimStatus" AS ENUM (
    'OPEN','UNDER_REVIEW','WAITING_SELLER','WAITING_BUYER','RESOLVED','CLOSED','UNKNOWN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MpDisputeStatus" AS ENUM (
    'OPEN','UNDER_REVIEW','EVIDENCE_REQUIRED','EVIDENCE_SUBMITTED','WON','LOST','CANCELLED','UNKNOWN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "MpWebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'mercado_pago',
  "environment" TEXT NOT NULL DEFAULT 'test',
  "eventType" TEXT NOT NULL,
  "panelTopic" TEXT,
  "action" TEXT,
  "providerEventId" TEXT,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "applicationId" TEXT,
  "mpUserId" TEXT,
  "requestId" TEXT,
  "payloadHash" TEXT NOT NULL,
  "signatureValid" BOOLEAN NOT NULL DEFAULT false,
  "liveMode" BOOLEAN,
  "processingStatus" "MpWebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "maxRetries" INTEGER NOT NULL DEFAULT 5,
  "nextRetryAt" TIMESTAMP(3),
  "failureCode" TEXT,
  "failureReason" TEXT,
  "sanitizedPayload" JSONB NOT NULL,
  "orderId" TEXT,
  "paymentId" TEXT,
  "partnerId" TEXT,
  "userId" TEXT,
  "legacyWebhookId" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validatedAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MpWebhookEvent_providerEventId_eventType_resourceId_key"
  ON "MpWebhookEvent"("providerEventId", "eventType", "resourceId");
CREATE INDEX IF NOT EXISTS "MpWebhookEvent_processingStatus_createdAt_idx" ON "MpWebhookEvent"("processingStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "MpWebhookEvent_eventType_createdAt_idx" ON "MpWebhookEvent"("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "MpWebhookEvent_resourceId_idx" ON "MpWebhookEvent"("resourceId");
CREATE INDEX IF NOT EXISTS "MpWebhookEvent_orderId_idx" ON "MpWebhookEvent"("orderId");
CREATE INDEX IF NOT EXISTS "MpWebhookEvent_paymentId_idx" ON "MpWebhookEvent"("paymentId");
CREATE INDEX IF NOT EXISTS "MpWebhookEvent_payloadHash_idx" ON "MpWebhookEvent"("payloadHash");
CREATE INDEX IF NOT EXISTS "MpWebhookEvent_nextRetryAt_idx" ON "MpWebhookEvent"("nextRetryAt");
CREATE INDEX IF NOT EXISTS "MpWebhookEvent_environment_createdAt_idx" ON "MpWebhookEvent"("environment", "createdAt");

CREATE TABLE IF NOT EXISTS "MpWebhookAttempt" (
  "id" TEXT NOT NULL,
  "webhookEventId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "failureCode" TEXT,
  "failureReason" TEXT,
  "latencyMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MpWebhookAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MpWebhookAttempt_webhookEventId_createdAt_idx" ON "MpWebhookAttempt"("webhookEventId", "createdAt");
ALTER TABLE "MpWebhookAttempt" DROP CONSTRAINT IF EXISTS "MpWebhookAttempt_webhookEventId_fkey";
ALTER TABLE "MpWebhookAttempt" ADD CONSTRAINT "MpWebhookAttempt_webhookEventId_fkey"
  FOREIGN KEY ("webhookEventId") REFERENCES "MpWebhookEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MpResourceSnapshot" (
  "id" TEXT NOT NULL,
  "webhookEventId" TEXT,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sanitizedBody" JSONB NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MpResourceSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MpResourceSnapshot_resourceType_resourceId_idx" ON "MpResourceSnapshot"("resourceType", "resourceId");
CREATE INDEX IF NOT EXISTS "MpResourceSnapshot_webhookEventId_idx" ON "MpResourceSnapshot"("webhookEventId");
ALTER TABLE "MpResourceSnapshot" DROP CONSTRAINT IF EXISTS "MpResourceSnapshot_webhookEventId_fkey";
ALTER TABLE "MpResourceSnapshot" ADD CONSTRAINT "MpResourceSnapshot_webhookEventId_fkey"
  FOREIGN KEY ("webhookEventId") REFERENCES "MpWebhookEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MpFraudAlert" (
  "id" TEXT NOT NULL,
  "providerAlertId" TEXT,
  "paymentProviderId" TEXT,
  "merchantOrderId" TEXT,
  "siteId" TEXT,
  "description" TEXT,
  "status" "MpFraudAlertStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "orderId" TEXT,
  "paymentId" TEXT,
  "partnerId" TEXT,
  "userId" TEXT,
  "webhookEventId" TEXT,
  "adminNotes" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolvedById" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpFraudAlert_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MpFraudAlert_status_createdAt_idx" ON "MpFraudAlert"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "MpFraudAlert_orderId_idx" ON "MpFraudAlert"("orderId");
CREATE INDEX IF NOT EXISTS "MpFraudAlert_paymentId_idx" ON "MpFraudAlert"("paymentId");
CREATE INDEX IF NOT EXISTS "MpFraudAlert_partnerId_idx" ON "MpFraudAlert"("partnerId");
ALTER TABLE "MpFraudAlert" DROP CONSTRAINT IF EXISTS "MpFraudAlert_orderId_fkey";
ALTER TABLE "MpFraudAlert" ADD CONSTRAINT "MpFraudAlert_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MpClaim" (
  "id" TEXT NOT NULL,
  "providerClaimId" TEXT NOT NULL,
  "status" "MpClaimStatus" NOT NULL DEFAULT 'OPEN',
  "reason" TEXT,
  "description" TEXT,
  "amount" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "dueDate" TIMESTAMP(3),
  "orderId" TEXT,
  "paymentId" TEXT,
  "partnerId" TEXT,
  "userId" TEXT,
  "webhookEventId" TEXT,
  "resolution" TEXT,
  "sellerResponse" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpClaim_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MpClaim_providerClaimId_key" ON "MpClaim"("providerClaimId");
CREATE INDEX IF NOT EXISTS "MpClaim_status_createdAt_idx" ON "MpClaim"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "MpClaim_orderId_idx" ON "MpClaim"("orderId");
CREATE INDEX IF NOT EXISTS "MpClaim_partnerId_idx" ON "MpClaim"("partnerId");
CREATE INDEX IF NOT EXISTS "MpClaim_userId_idx" ON "MpClaim"("userId");
ALTER TABLE "MpClaim" DROP CONSTRAINT IF EXISTS "MpClaim_orderId_fkey";
ALTER TABLE "MpClaim" ADD CONSTRAINT "MpClaim_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MpDispute" (
  "id" TEXT NOT NULL,
  "providerDisputeId" TEXT NOT NULL,
  "status" "MpDisputeStatus" NOT NULL DEFAULT 'OPEN',
  "reason" TEXT,
  "amount" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "paymentProviderId" TEXT,
  "dueDate" TIMESTAMP(3),
  "orderId" TEXT,
  "paymentId" TEXT,
  "partnerId" TEXT,
  "userId" TEXT,
  "webhookEventId" TEXT,
  "evidenceSubmitted" BOOLEAN NOT NULL DEFAULT false,
  "outcome" TEXT,
  "payoutBlocked" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpDispute_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MpDispute_providerDisputeId_key" ON "MpDispute"("providerDisputeId");
CREATE INDEX IF NOT EXISTS "MpDispute_status_createdAt_idx" ON "MpDispute"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "MpDispute_orderId_idx" ON "MpDispute"("orderId");
CREATE INDEX IF NOT EXISTS "MpDispute_partnerId_idx" ON "MpDispute"("partnerId");
CREATE INDEX IF NOT EXISTS "MpDispute_dueDate_idx" ON "MpDispute"("dueDate");
ALTER TABLE "MpDispute" DROP CONSTRAINT IF EXISTS "MpDispute_orderId_fkey";
ALTER TABLE "MpDispute" ADD CONSTRAINT "MpDispute_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MpShipment" (
  "id" TEXT NOT NULL,
  "providerShipmentId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "carrier" TEXT,
  "trackingCode" TEXT,
  "estimatedDelivery" TIMESTAMP(3),
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "returnedAt" TIMESTAMP(3),
  "orderId" TEXT,
  "partnerId" TEXT,
  "webhookEventId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpShipment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MpShipment_providerShipmentId_key" ON "MpShipment"("providerShipmentId");
CREATE INDEX IF NOT EXISTS "MpShipment_status_createdAt_idx" ON "MpShipment"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "MpShipment_orderId_idx" ON "MpShipment"("orderId");
CREATE INDEX IF NOT EXISTS "MpShipment_partnerId_idx" ON "MpShipment"("partnerId");
CREATE INDEX IF NOT EXISTS "MpShipment_trackingCode_idx" ON "MpShipment"("trackingCode");
ALTER TABLE "MpShipment" DROP CONSTRAINT IF EXISTS "MpShipment_orderId_fkey";
ALTER TABLE "MpShipment" ADD CONSTRAINT "MpShipment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "MpApplicationLink" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT,
  "mpUserId" TEXT,
  "action" TEXT,
  "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "scopes" JSONB,
  "partnerId" TEXT,
  "webhookEventId" TEXT,
  "revokedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpApplicationLink_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MpApplicationLink_partnerId_idx" ON "MpApplicationLink"("partnerId");
CREATE INDEX IF NOT EXISTS "MpApplicationLink_status_createdAt_idx" ON "MpApplicationLink"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "MpApplicationLink_applicationId_idx" ON "MpApplicationLink"("applicationId");

CREATE TABLE IF NOT EXISTS "MpSubscriptionEvent" (
  "id" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "applicability" TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
  "userId" TEXT,
  "webhookEventId" TEXT,
  "sanitizedData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpSubscriptionEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MpSubscriptionEvent_topic_createdAt_idx" ON "MpSubscriptionEvent"("topic", "createdAt");
CREATE INDEX IF NOT EXISTS "MpSubscriptionEvent_providerId_idx" ON "MpSubscriptionEvent"("providerId");
CREATE INDEX IF NOT EXISTS "MpSubscriptionEvent_applicability_idx" ON "MpSubscriptionEvent"("applicability");

CREATE TABLE IF NOT EXISTS "MpPointEvent" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "applicability" TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
  "deviceId" TEXT,
  "partnerId" TEXT,
  "webhookEventId" TEXT,
  "sanitizedData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpPointEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MpPointEvent_status_createdAt_idx" ON "MpPointEvent"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "MpPointEvent_partnerId_idx" ON "MpPointEvent"("partnerId");

CREATE TABLE IF NOT EXISTS "MpWalletEvent" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "applicability" TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
  "webhookEventId" TEXT,
  "sanitizedData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpWalletEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MpWalletEvent_status_createdAt_idx" ON "MpWalletEvent"("status", "createdAt");

CREATE TABLE IF NOT EXISTS "MpPayerProfileEvent" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "applicability" TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
  "webhookEventId" TEXT,
  "sanitizedData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpPayerProfileEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MpSelfServiceEvent" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "applicability" TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
  "webhookEventId" TEXT,
  "sanitizedData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpSelfServiceEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MpCommercialOrder" (
  "id" TEXT NOT NULL,
  "providerMerchantOrderId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "applicability" TEXT NOT NULL DEFAULT 'LEGACY_COMPAT',
  "orderId" TEXT,
  "paymentId" TEXT,
  "partnerId" TEXT,
  "webhookEventId" TEXT,
  "sanitizedData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpCommercialOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MpCommercialOrder_providerMerchantOrderId_key" ON "MpCommercialOrder"("providerMerchantOrderId");
CREATE INDEX IF NOT EXISTS "MpCommercialOrder_status_createdAt_idx" ON "MpCommercialOrder"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "MpCommercialOrder_orderId_idx" ON "MpCommercialOrder"("orderId");

CREATE TABLE IF NOT EXISTS "MpReconciliationIssue" (
  "id" TEXT NOT NULL,
  "issueType" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "orderId" TEXT,
  "paymentId" TEXT,
  "resourceId" TEXT,
  "message" TEXT NOT NULL,
  "details" JSONB,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MpReconciliationIssue_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MpReconciliationIssue_status_createdAt_idx" ON "MpReconciliationIssue"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "MpReconciliationIssue_issueType_status_idx" ON "MpReconciliationIssue"("issueType", "status");
CREATE INDEX IF NOT EXISTS "MpReconciliationIssue_orderId_idx" ON "MpReconciliationIssue"("orderId");
