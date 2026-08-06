-- Admin approval fields on profiles + platform settings
-- Safe additive migration — does not drop existing data

-- VerificationStatus: add SUSPENDED
ALTER TYPE "VerificationStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- PartnerProfile approval metadata
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

DO $$ BEGIN
  ALTER TABLE "PartnerProfile" ADD CONSTRAINT "PartnerProfile_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- OngProfile approval metadata
ALTER TABLE "OngProfile" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "OngProfile" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;
ALTER TABLE "OngProfile" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

DO $$ BEGIN
  ALTER TABLE "OngProfile" ADD CONSTRAINT "OngProfile_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Platform settings singleton
CREATE TABLE IF NOT EXISTS "PlatformSettings" (
  "id" TEXT NOT NULL DEFAULT 'singleton',
  "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
  "maintenanceMessage" TEXT,
  "institutionalText" TEXT,
  "supportEmail" TEXT,
  "contactEmail" TEXT,
  "marketplaceEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedById" TEXT,
  CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlatformSettings" ("id", "updatedAt")
VALUES ('singleton', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
