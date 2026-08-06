-- Partner registration extended fields (safe, additive)
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "partnerType" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "corporateType" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "activityStartDate" TIMESTAMP(3);
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "activityAreas" JSONB;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "addressDetails" JSONB;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "operationDetails" JSONB;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "financialDetails" JSONB;

ALTER TABLE "PartnerProfile" ALTER COLUMN "cnpj" DROP NOT NULL;
