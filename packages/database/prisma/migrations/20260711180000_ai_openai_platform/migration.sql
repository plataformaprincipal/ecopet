-- EcoPet AI OpenAI platform extensions (safe additive migration)

ALTER TABLE "AIConversation" ADD COLUMN IF NOT EXISTS "role" TEXT;
ALTER TABLE "AIConversation" ADD COLUMN IF NOT EXISTS "module" TEXT;
ALTER TABLE "AIConversation" ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'pt-BR';
ALTER TABLE "AIConversation" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

ALTER TABLE "AIMessage" ADD COLUMN IF NOT EXISTS "model" TEXT;
ALTER TABLE "AIMessage" ADD COLUMN IF NOT EXISTS "totalTokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AIMessage" ADD COLUMN IF NOT EXISTS "latencyMs" INTEGER;
ALTER TABLE "AIMessage" ADD COLUMN IF NOT EXISTS "safetyStatus" TEXT;

CREATE INDEX IF NOT EXISTS "AIConversation_userId_module_createdAt_idx" ON "AIConversation"("userId", "module", "createdAt");
CREATE INDEX IF NOT EXISTS "AIConversation_deletedAt_idx" ON "AIConversation"("deletedAt");
CREATE INDEX IF NOT EXISTS "AIMessage_createdAt_idx" ON "AIMessage"("createdAt");

CREATE TABLE IF NOT EXISTS "AIUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requestId" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIUsage_userId_createdAt_idx" ON "AIUsage"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIUsage_module_createdAt_idx" ON "AIUsage"("module", "createdAt");
CREATE INDEX IF NOT EXISTS "AIUsage_createdAt_idx" ON "AIUsage"("createdAt");
CREATE INDEX IF NOT EXISTS "AIUsage_success_idx" ON "AIUsage"("success");

CREATE TABLE IF NOT EXISTS "AIAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "decision" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIAuditLog_userId_createdAt_idx" ON "AIAuditLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIAuditLog_module_createdAt_idx" ON "AIAuditLog"("module", "createdAt");
CREATE INDEX IF NOT EXISTS "AIAuditLog_decision_idx" ON "AIAuditLog"("decision");

CREATE TABLE IF NOT EXISTS "AIKnowledgeDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL DEFAULT 'global',
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "contentHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIKnowledgeDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AIKnowledgeDocument_sourceType_sourceId_locale_key" ON "AIKnowledgeDocument"("sourceType", "sourceId", "locale");
CREATE INDEX IF NOT EXISTS "AIKnowledgeDocument_status_idx" ON "AIKnowledgeDocument"("status");
CREATE INDEX IF NOT EXISTS "AIKnowledgeDocument_sourceType_idx" ON "AIKnowledgeDocument"("sourceType");

CREATE TABLE IF NOT EXISTS "AIEmbedding" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AIEmbedding_documentId_chunkIndex_key" ON "AIEmbedding"("documentId", "chunkIndex");
CREATE INDEX IF NOT EXISTS "AIEmbedding_documentId_idx" ON "AIEmbedding"("documentId");

CREATE TABLE IF NOT EXISTS "AIRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "explanation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIRecommendation_userId_createdAt_idx" ON "AIRecommendation"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIRecommendation_recommendationType_idx" ON "AIRecommendation"("recommendationType");
CREATE INDEX IF NOT EXISTS "AIRecommendation_status_expiresAt_idx" ON "AIRecommendation"("status", "expiresAt");

CREATE TABLE IF NOT EXISTS "AIJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "AIJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIJob_status_createdAt_idx" ON "AIJob"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "AIJob_type_status_idx" ON "AIJob"("type", "status");
CREATE INDEX IF NOT EXISTS "AIJob_userId_idx" ON "AIJob"("userId");

CREATE TABLE IF NOT EXISTS "AIPrivacySettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "historyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "personalizedRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "retentionDays" INTEGER NOT NULL DEFAULT 365,
    "consentAiProcessing" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIPrivacySettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AIPrivacySettings_userId_key" ON "AIPrivacySettings"("userId");

CREATE TABLE IF NOT EXISTS "AIModerationQueue" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'REVIEW',
    "categories" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIModerationQueue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIModerationQueue_status_createdAt_idx" ON "AIModerationQueue"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "AIModerationQueue_sourceType_sourceId_idx" ON "AIModerationQueue"("sourceType", "sourceId");

DO $$ BEGIN
 ALTER TABLE "AIUsage" ADD CONSTRAINT "AIUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "AIAuditLog" ADD CONSTRAINT "AIAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "AIEmbedding" ADD CONSTRAINT "AIEmbedding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "AIKnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "AIJob" ADD CONSTRAINT "AIJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
 ALTER TABLE "AIPrivacySettings" ADD CONSTRAINT "AIPrivacySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;