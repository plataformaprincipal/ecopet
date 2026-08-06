-- Firebase Cloud Messaging — dispositivos e entregas

CREATE TYPE "PushProvider" AS ENUM ('FCM', 'WEB_PUSH');

CREATE TYPE "PushDeliveryStatus" AS ENUM (
  'QUEUED',
  'SENDING',
  'SENT',
  'FAILED',
  'INVALID_TOKEN',
  'SKIPPED',
  'RETRY_PENDING'
);

CREATE TABLE "PushDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "PushProvider" NOT NULL DEFAULT 'FCM',
    "tokenHash" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceName" TEXT,
    "platform" TEXT,
    "browser" TEXT,
    "userAgentSanitized" TEXT,
    "permissionStatus" TEXT NOT NULL DEFAULT 'GRANTED',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "invalidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushDevice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushNotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT,
    "pushDeviceId" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "status" "PushDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushNotificationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushDevice_tokenHash_key" ON "PushDevice"("tokenHash");
CREATE INDEX "PushDevice_userId_active_idx" ON "PushDevice"("userId", "active");
CREATE INDEX "PushDevice_active_lastSeenAt_idx" ON "PushDevice"("active", "lastSeenAt");
CREATE INDEX "PushDevice_provider_active_idx" ON "PushDevice"("provider", "active");
CREATE INDEX "PushDevice_deviceId_idx" ON "PushDevice"("deviceId");

CREATE INDEX "PushNotificationDelivery_pushDeviceId_status_idx" ON "PushNotificationDelivery"("pushDeviceId", "status");
CREATE INDEX "PushNotificationDelivery_notificationId_idx" ON "PushNotificationDelivery"("notificationId");
CREATE INDEX "PushNotificationDelivery_status_createdAt_idx" ON "PushNotificationDelivery"("status", "createdAt");
CREATE INDEX "PushNotificationDelivery_idempotencyKey_idx" ON "PushNotificationDelivery"("idempotencyKey");
CREATE UNIQUE INDEX "PushNotificationDelivery_idempotencyKey_pushDeviceId_key" ON "PushNotificationDelivery"("idempotencyKey", "pushDeviceId");

ALTER TABLE "PushDevice" ADD CONSTRAINT "PushDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushNotificationDelivery" ADD CONSTRAINT "PushNotificationDelivery_pushDeviceId_fkey" FOREIGN KEY ("pushDeviceId") REFERENCES "PushDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
