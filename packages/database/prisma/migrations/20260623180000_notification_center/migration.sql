-- EcoPet Notification Center: extended Notification + NotificationPreference (safe additive)

CREATE TYPE "NotificationType" AS ENUM (
  'SYSTEM',
  'SECURITY',
  'ORDER',
  'APPOINTMENT',
  'PRODUCT',
  'SERVICE',
  'SOCIAL',
  'MESSAGE',
  'ADOPTION',
  'CAMPAIGN',
  'DOCUMENT',
  'PAYMENT',
  'REVIEW',
  'SUPPORT'
);

CREATE TYPE "NotificationPriority" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

-- Extend Notification
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "role" "UserRole";
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "message" TEXT;
UPDATE "Notification" SET "message" = "body" WHERE "message" IS NULL;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "actionUrl" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
UPDATE "Notification" SET "metadata" = "data" WHERE "metadata" IS NULL AND "data" IS NOT NULL;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
UPDATE "Notification" SET "readAt" = "createdAt" WHERE "read" = true AND "readAt" IS NULL;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Migrate type column from TEXT to enum
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "typeEnum" "NotificationType";
UPDATE "Notification" SET "typeEnum" = CASE
  WHEN LOWER("type") LIKE 'social_%' OR LOWER("type") = 'social' THEN 'SOCIAL'::"NotificationType"
  WHEN UPPER("type") LIKE 'ORDER%' THEN 'ORDER'::"NotificationType"
  WHEN UPPER("type") LIKE 'APPOINTMENT%' THEN 'APPOINTMENT'::"NotificationType"
  WHEN UPPER("type") = 'MESSAGE_RECEIVED' OR UPPER("type") LIKE 'MESSAGE%' THEN 'MESSAGE'::"NotificationType"
  WHEN UPPER("type") LIKE 'SUPPORT%' THEN 'SUPPORT'::"NotificationType"
  WHEN UPPER("type") LIKE 'SECURITY%' OR UPPER("type") LIKE 'PASSWORD%' THEN 'SECURITY'::"NotificationType"
  WHEN UPPER("type") LIKE 'PRODUCT%' THEN 'PRODUCT'::"NotificationType"
  WHEN UPPER("type") LIKE 'SERVICE%' THEN 'SERVICE'::"NotificationType"
  WHEN UPPER("type") LIKE 'ADOPTION%' THEN 'ADOPTION'::"NotificationType"
  WHEN UPPER("type") LIKE 'CAMPAIGN%' THEN 'CAMPAIGN'::"NotificationType"
  WHEN UPPER("type") LIKE 'DOCUMENT%' THEN 'DOCUMENT'::"NotificationType"
  WHEN UPPER("type") LIKE 'PAYMENT%' THEN 'PAYMENT'::"NotificationType"
  WHEN UPPER("type") LIKE 'REVIEW%' THEN 'REVIEW'::"NotificationType"
  ELSE 'SYSTEM'::"NotificationType"
END
WHERE "typeEnum" IS NULL;

ALTER TABLE "Notification" DROP COLUMN IF EXISTS "type";
ALTER TABLE "Notification" RENAME COLUMN "typeEnum" TO "type";
ALTER TABLE "Notification" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "type" SET DEFAULT 'SYSTEM';

-- Ensure message NOT NULL after backfill
UPDATE "Notification" SET "message" = COALESCE("message", "body", '');
ALTER TABLE "Notification" ALTER COLUMN "message" SET NOT NULL;

-- Make body optional (legacy)
ALTER TABLE "Notification" ALTER COLUMN "body" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX IF NOT EXISTS "Notification_readAt_idx" ON "Notification"("readAt");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_type_idx" ON "Notification"("type");

-- NotificationPreference
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
  "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
  "marketingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "orderUpdates" BOOLEAN NOT NULL DEFAULT true,
  "appointmentUpdates" BOOLEAN NOT NULL DEFAULT true,
  "socialUpdates" BOOLEAN NOT NULL DEFAULT true,
  "adoptionUpdates" BOOLEAN NOT NULL DEFAULT true,
  "campaignUpdates" BOOLEAN NOT NULL DEFAULT true,
  "productUpdates" BOOLEAN NOT NULL DEFAULT true,
  "serviceUpdates" BOOLEAN NOT NULL DEFAULT true,
  "securityUpdates" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
CREATE INDEX IF NOT EXISTS "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'NotificationPreference_userId_fkey'
  ) THEN
    ALTER TABLE "NotificationPreference"
      ADD CONSTRAINT "NotificationPreference_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
