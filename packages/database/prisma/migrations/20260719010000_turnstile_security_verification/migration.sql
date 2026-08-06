-- Turnstile metrics / anti-replay (hash only) + distributed rate limit buckets

CREATE TABLE IF NOT EXISTS "SecurityVerificationEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "flow" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "hostname" TEXT,
    "environment" TEXT,
    "userId" TEXT,
    "requestCorrelationId" TEXT,
    "tokenHash" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityVerificationEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SecurityVerificationEvent_tokenHash_key"
  ON "SecurityVerificationEvent"("tokenHash");

CREATE INDEX IF NOT EXISTS "SecurityVerificationEvent_provider_createdAt_idx"
  ON "SecurityVerificationEvent"("provider", "createdAt");

CREATE INDEX IF NOT EXISTS "SecurityVerificationEvent_action_createdAt_idx"
  ON "SecurityVerificationEvent"("action", "createdAt");

CREATE INDEX IF NOT EXISTS "SecurityVerificationEvent_success_createdAt_idx"
  ON "SecurityVerificationEvent"("success", "createdAt");

CREATE INDEX IF NOT EXISTS "SecurityVerificationEvent_errorCode_createdAt_idx"
  ON "SecurityVerificationEvent"("errorCode", "createdAt");

CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");
