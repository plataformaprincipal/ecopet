-- =============================================================================
-- Catch-up residual: ALTERs / enum values / indexes that schema.prisma expects
-- but were never applied by prior migrations (measured via prisma migrate diff
-- after a clean deploy of all previous migrations).
--
-- IMPORTANT - SupportTicket.category (TEXT -> enum SupportCategory):
-- Production / any DB with real rows must review existing category values
-- BEFORE applying this migration. Values that are not one of:
--   ACCOUNT, ORDER, PAYMENT, PET, PARTNER, ONG, TECHNICAL, OTHER
-- are coerced to OTHER via USING + CASE (safe default). That avoids a hard
-- failure on unknown free-text, but may silently reclassify legacy labels.
-- Audit SupportTicket.category on the target DB first; adjust the CASE map
-- if you need to preserve specific legacy strings as other enum members.
-- Depends on enum SupportCategory from 20260623115959_add_missing_core_tables.
-- Also depends on ConversationContextType from that same migration.
-- =============================================================================

-- AlterEnum: ConversationStatus
ALTER TYPE "ConversationStatus" ADD VALUE 'ACTIVE';
ALTER TYPE "ConversationStatus" ADD VALUE 'ARCHIVED';
ALTER TYPE "ConversationStatus" ADD VALUE 'BLOCKED';

-- AlterEnum: ConversationType
ALTER TYPE "ConversationType" ADD VALUE 'SUPPORT';
ALTER TYPE "ConversationType" ADD VALUE 'CLIENT_ONG';
ALTER TYPE "ConversationType" ADD VALUE 'DIRECT';
ALTER TYPE "ConversationType" ADD VALUE 'SYSTEM';

-- AlterEnum: ProductCatalogCategory
ALTER TYPE "ProductCatalogCategory" ADD VALUE 'COLLARS';
ALTER TYPE "ProductCatalogCategory" ADD VALUE 'HARNESSES';
ALTER TYPE "ProductCatalogCategory" ADD VALUE 'LEASHES';
ALTER TYPE "ProductCatalogCategory" ADD VALUE 'HOUSING';
ALTER TYPE "ProductCatalogCategory" ADD VALUE 'AQUARIUM';
ALTER TYPE "ProductCatalogCategory" ADD VALUE 'EQUINE';
ALTER TYPE "ProductCatalogCategory" ADD VALUE 'CATTLE';
ALTER TYPE "ProductCatalogCategory" ADD VALUE 'BIRDS';
ALTER TYPE "ProductCatalogCategory" ADD VALUE 'EXOTIC';
ALTER TYPE "ProductCatalogCategory" ADD VALUE 'TECHNOLOGY';
ALTER TYPE "ProductCatalogCategory" ADD VALUE 'TRAINING';

-- AlterEnum: ReadyServiceCategory
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'VETERINARY';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'BATH';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'GROOMING';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'DAYCARE';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'EXAMS';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'SURGERY';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'CONSULTING';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'REPRODUCTION';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'AQUARIUM';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'EQUINE';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'CATTLE';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'EXOTIC';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'EMERGENCY_24H';
ALTER TYPE "ReadyServiceCategory" ADD VALUE 'OTHER';

-- AlterEnum
ALTER TYPE "TicketPriority" ADD VALUE 'NORMAL';
ALTER TYPE "TicketStatus" ADD VALUE 'WAITING_USER';

-- DropForeignKey (recreated below with ON DELETE CASCADE to match schema)
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_productId_fkey";

-- AlterTable
ALTER TABLE "AnalyticsTransactionalDedup" ALTER COLUMN "lastAttemptAt" DROP DEFAULT;

ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "blockedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "contextId" TEXT,
ADD COLUMN IF NOT EXISTS "contextType" "ConversationContextType",
ADD COLUMN IF NOT EXISTS "createdById" TEXT,
ADD COLUMN IF NOT EXISTS "directKey" TEXT,
ADD COLUMN IF NOT EXISTS "lastMessageAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "talkjsConversationId" TEXT;

ALTER TABLE "ConversationParticipant" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isMuted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "leftAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "roleSnapshot" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Favorite" ADD COLUMN IF NOT EXISTS "partnerId" TEXT,
ADD COLUMN IF NOT EXISTS "serviceId" TEXT;

-- Hashtag: backfill from legacy "tag" so existing rows survive NOT NULL
ALTER TABLE "Hashtag" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Hashtag" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "Hashtag" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Hashtag" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Hashtag" ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0;
UPDATE "Hashtag" SET "name" = COALESCE(NULLIF(TRIM("name"), ''), "tag") WHERE "name" IS NULL;
UPDATE "Hashtag" SET "slug" = COALESCE(NULLIF(TRIM("slug"), ''), "tag") WHERE "slug" IS NULL;
ALTER TABLE "Hashtag" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Hashtag" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Hashtag" ALTER COLUMN "tag" DROP NOT NULL;

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "MessageAttachment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "storageProvider" TEXT;

ALTER TABLE "Notification" ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "pushEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "NotificationPreference" ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "OngProfile" ADD COLUMN IF NOT EXISTS "profileDetails" JSONB;

ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "slug" TEXT;

ALTER TABLE "PlatformSettings" ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "partnerReply" TEXT;
ALTER TABLE "Review" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- SupportTicket: convert category TEXT -> SupportCategory without DROP COLUMN.
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);

ALTER TABLE "SupportTicket"
  ALTER COLUMN "category" TYPE "SupportCategory"
  USING (
    CASE UPPER(TRIM(COALESCE("category"::text, '')))
      WHEN 'ACCOUNT' THEN 'ACCOUNT'::"SupportCategory"
      WHEN 'ORDER' THEN 'ORDER'::"SupportCategory"
      WHEN 'PAYMENT' THEN 'PAYMENT'::"SupportCategory"
      WHEN 'PET' THEN 'PET'::"SupportCategory"
      WHEN 'PARTNER' THEN 'PARTNER'::"SupportCategory"
      WHEN 'ONG' THEN 'ONG'::"SupportCategory"
      WHEN 'TECHNICAL' THEN 'TECHNICAL'::"SupportCategory"
      WHEN 'OTHER' THEN 'OTHER'::"SupportCategory"
      ELSE 'OTHER'::"SupportCategory"
    END
  ),
  ALTER COLUMN "category" SET DEFAULT 'OTHER'::"SupportCategory",
  ALTER COLUMN "category" SET NOT NULL;
-- Note: TicketPriority.NORMAL default is set in the next migration after this
-- transaction commits (Postgres forbids using a new enum value in the same tx).

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdoptionListing_ongId_idx" ON "AdoptionListing"("ongId");
CREATE INDEX IF NOT EXISTS "AdoptionListing_status_idx" ON "AdoptionListing"("status");
CREATE INDEX IF NOT EXISTS "AiSession_userId_idx" ON "AiSession"("userId");
CREATE INDEX IF NOT EXISTS "AiSession_petId_idx" ON "AiSession"("petId");
CREATE INDEX IF NOT EXISTS "Allergy_petId_idx" ON "Allergy"("petId");
CREATE INDEX IF NOT EXISTS "CartItem_productId_idx" ON "CartItem"("productId");
CREATE INDEX IF NOT EXISTS "Comment_postId_idx" ON "Comment"("postId");
CREATE INDEX IF NOT EXISTS "Comment_authorId_idx" ON "Comment"("authorId");
CREATE INDEX IF NOT EXISTS "Consultation_petId_idx" ON "Consultation"("petId");
CREATE INDEX IF NOT EXISTS "Consultation_veterinarianId_idx" ON "Consultation"("veterinarianId");
CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_directKey_key" ON "Conversation"("directKey");
CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_talkjsConversationId_key" ON "Conversation"("talkjsConversationId");
CREATE INDEX IF NOT EXISTS "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "Conversation_createdById_idx" ON "Conversation"("createdById");
CREATE INDEX IF NOT EXISTS "Conversation_contextType_contextId_idx" ON "Conversation"("contextType", "contextId");
CREATE INDEX IF NOT EXISTS "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");
CREATE INDEX IF NOT EXISTS "ConversationParticipant_conversationId_idx" ON "ConversationParticipant"("conversationId");
CREATE INDEX IF NOT EXISTS "Exam_petId_idx" ON "Exam"("petId");
CREATE INDEX IF NOT EXISTS "Favorite_userId_idx" ON "Favorite"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_productId_key" ON "Favorite"("userId", "productId");
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_serviceId_key" ON "Favorite"("userId", "serviceId");
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_partnerId_key" ON "Favorite"("userId", "partnerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Hashtag_slug_key" ON "Hashtag"("slug");
CREATE INDEX IF NOT EXISTS "MedicalRecord_petId_idx" ON "MedicalRecord"("petId");
CREATE INDEX IF NOT EXISTS "MedicalRecord_authorId_idx" ON "MedicalRecord"("authorId");
CREATE INDEX IF NOT EXISTS "Medication_petId_idx" ON "Medication"("petId");
CREATE INDEX IF NOT EXISTS "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "PartnerProfile_slug_key" ON "PartnerProfile"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_sellerId_sku_key" ON "Product"("sellerId", "sku");
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "User_cnpj_key" ON "User"("cnpj");
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");
CREATE INDEX IF NOT EXISTS "Vaccination_petId_idx" ON "Vaccination"("petId");

-- AddForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_productId_fkey";
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favorite" DROP CONSTRAINT IF EXISTS "Favorite_serviceId_fkey";
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Favorite" DROP CONSTRAINT IF EXISTS "Favorite_partnerId_fkey";
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_createdById_fkey";
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
