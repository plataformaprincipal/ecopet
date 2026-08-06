-- Deduplicação transacional analytics/GTM (sem warehouse de eventos)

CREATE TABLE IF NOT EXISTS "AnalyticsTransactionalDedup" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityReferenceHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CLAIMED',
    "environment" TEXT,
    "firstProcessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "AnalyticsTransactionalDedup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsTransactionalDedup_deduplicationKey_key" ON "AnalyticsTransactionalDedup"("deduplicationKey");
CREATE INDEX IF NOT EXISTS "AnalyticsTransactionalDedup_eventName_firstProcessedAt_idx" ON "AnalyticsTransactionalDedup"("eventName", "firstProcessedAt");
CREATE INDEX IF NOT EXISTS "AnalyticsTransactionalDedup_expiresAt_idx" ON "AnalyticsTransactionalDedup"("expiresAt");
CREATE INDEX IF NOT EXISTS "AnalyticsTransactionalDedup_entityType_entityReferenceHash_idx" ON "AnalyticsTransactionalDedup"("entityType", "entityReferenceHash");
