-- Partner registration: documentation, CNPJ lookup cache, logo alt
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "verificationDocuments" JSONB;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "cnpjDetails" JSONB;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "logoAlt" TEXT;
