-- AI Enterprise: tool executions, security events, file metadata

CREATE TABLE IF NOT EXISTS "AIToolExecution" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "conversationId" TEXT,
    "toolName" TEXT NOT NULL,
    "module" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIToolExecution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIToolExecution_userId_createdAt_idx" ON "AIToolExecution"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIToolExecution_toolName_createdAt_idx" ON "AIToolExecution"("toolName", "createdAt");
CREATE INDEX IF NOT EXISTS "AIToolExecution_success_createdAt_idx" ON "AIToolExecution"("success", "createdAt");

CREATE TABLE IF NOT EXISTS "AISecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AISecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AISecurityEvent_userId_createdAt_idx" ON "AISecurityEvent"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AISecurityEvent_category_createdAt_idx" ON "AISecurityEvent"("category", "createdAt");
CREATE INDEX IF NOT EXISTS "AISecurityEvent_severity_createdAt_idx" ON "AISecurityEvent"("severity", "createdAt");

CREATE TABLE IF NOT EXISTS "AIFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'ai_attachment',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "extension" TEXT,
    "cloudinaryId" TEXT,
    "secureUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "virusScan" TEXT NOT NULL DEFAULT 'skipped',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIFile_userId_createdAt_idx" ON "AIFile"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIFile_conversationId_idx" ON "AIFile"("conversationId");
CREATE INDEX IF NOT EXISTS "AIFile_status_idx" ON "AIFile"("status");

DO $$ BEGIN
  ALTER TABLE "AIToolExecution" ADD CONSTRAINT "AIToolExecution_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AISecurityEvent" ADD CONSTRAINT "AISecurityEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AIFile" ADD CONSTRAINT "AIFile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
