-- EcoPet Social: post types, persona fields, adoption metadata (safe additive migration)

CREATE TYPE "SocialPostType" AS ENUM (
  'PET_UPDATE',
  'GENERAL',
  'PRODUCT',
  'SERVICE',
  'ADOPTION',
  'CAMPAIGN',
  'DONATION',
  'EVENT',
  'RESCUE',
  'EDUCATIONAL',
  'URGENT'
);

ALTER TABLE "SocialPost" ADD COLUMN IF NOT EXISTS "authorRole" "UserRole";
ALTER TABLE "SocialPost" ADD COLUMN IF NOT EXISTS "type" "SocialPostType" NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "SocialPost" ADD COLUMN IF NOT EXISTS "linkedProductId" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN IF NOT EXISTS "linkedServiceId" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN IF NOT EXISTS "linkedCampaignId" TEXT;
ALTER TABLE "SocialPost" ADD COLUMN IF NOT EXISTS "adoptionMeta" JSONB;
ALTER TABLE "SocialPost" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SocialPost" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "SocialPost_type_idx" ON "SocialPost"("type");
CREATE INDEX IF NOT EXISTS "SocialPost_authorRole_idx" ON "SocialPost"("authorRole");
