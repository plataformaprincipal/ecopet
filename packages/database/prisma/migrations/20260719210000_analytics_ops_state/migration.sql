-- Analytics Ops — estado interno (não duplica warehouse GA4)

CREATE TABLE IF NOT EXISTS "AnalyticsOpsState" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "environment" TEXT,
    "configFlags" JSONB,
    "lastDiagnostics" JSONB,
    "lastHealthAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "avgResponseMs" DOUBLE PRECISION,
    "catalogEventCount" INTEGER,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsOpsState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsOpsState_provider_key" ON "AnalyticsOpsState"("provider");
CREATE INDEX IF NOT EXISTS "AnalyticsOpsState_status_updatedAt_idx" ON "AnalyticsOpsState"("status", "updatedAt");
CREATE INDEX IF NOT EXISTS "AnalyticsOpsState_lastHealthAt_idx" ON "AnalyticsOpsState"("lastHealthAt");

CREATE TABLE IF NOT EXISTS "AnalyticsOpsError" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google_analytics',
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "module" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsOpsError_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnalyticsOpsError_provider_createdAt_idx" ON "AnalyticsOpsError"("provider", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsOpsError_code_createdAt_idx" ON "AnalyticsOpsError"("code", "createdAt");
