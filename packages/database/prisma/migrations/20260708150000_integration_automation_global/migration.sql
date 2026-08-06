-- Integração & Automação Global EcoPet

CREATE TYPE "WebhookEventStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'DUPLICATE');
CREATE TYPE "JobQueueStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED');
CREATE TYPE "WorkflowLifecycleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'FAILED');
CREATE TYPE "InternalTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED');

ALTER TABLE "WorkflowDefinition" ADD COLUMN IF NOT EXISTS "lifecycleStatus" "WorkflowLifecycleStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "WorkflowDefinition" ADD COLUMN IF NOT EXISTS "createdById" TEXT;

CREATE TABLE IF NOT EXISTS "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "externalId" TEXT,
    "payload" JSONB NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SystemEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "payload" JSONB,
    "metadata" JSONB,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AutomationTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerEvent" TEXT NOT NULL,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AutomationTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "JobQueue" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobQueueStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobQueue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InternalTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "InternalTaskStatus" NOT NULL DEFAULT 'OPEN',
    "assigneeId" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "InternalTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NotificationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WebhookEvent_idempotencyKey_key" ON "WebhookEvent"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "WebhookEvent_provider_createdAt_idx" ON "WebhookEvent"("provider", "createdAt");
CREATE INDEX IF NOT EXISTS "WebhookEvent_status_createdAt_idx" ON "WebhookEvent"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "WebhookEvent_externalId_idx" ON "WebhookEvent"("externalId");
CREATE INDEX IF NOT EXISTS "SystemEvent_type_createdAt_idx" ON "SystemEvent"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "SystemEvent_entityType_entityId_idx" ON "SystemEvent"("entityType", "entityId");
CREATE UNIQUE INDEX IF NOT EXISTS "AutomationTemplate_slug_key" ON "AutomationTemplate"("slug");
CREATE INDEX IF NOT EXISTS "AutomationTemplate_triggerEvent_idx" ON "AutomationTemplate"("triggerEvent");
CREATE INDEX IF NOT EXISTS "JobQueue_status_scheduledAt_idx" ON "JobQueue"("status", "scheduledAt");
CREATE INDEX IF NOT EXISTS "JobQueue_type_createdAt_idx" ON "JobQueue"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "InternalTask_status_createdAt_idx" ON "InternalTask"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "NotificationEvent_status_createdAt_idx" ON "NotificationEvent"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "NotificationEvent_userId_idx" ON "NotificationEvent"("userId");

ALTER TABLE "SystemEvent" ADD CONSTRAINT "SystemEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InternalTask" ADD CONSTRAINT "InternalTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InternalTask" ADD CONSTRAINT "InternalTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
