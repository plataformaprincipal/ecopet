-- Google Maps / geolocalização — Address + Partner/ONG + métricas

ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "googlePlaceId" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "formattedAddress" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "geocodedAt" TIMESTAMP(3);
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "geocodingSource" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "locationAccuracy" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "locationVerifiedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Address_city_state_idx" ON "Address"("city", "state");
CREATE INDEX IF NOT EXISTS "Address_latitude_longitude_idx" ON "Address"("latitude", "longitude");

ALTER TABLE "OngProfile" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "OngProfile" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "OngProfile" ADD COLUMN IF NOT EXISTS "googlePlaceId" TEXT;
ALTER TABLE "OngProfile" ADD COLUMN IF NOT EXISTS "formattedAddress" TEXT;
ALTER TABLE "OngProfile" ADD COLUMN IF NOT EXISTS "geocodedAt" TIMESTAMP(3);
ALTER TABLE "OngProfile" ADD COLUMN IF NOT EXISTS "publicLocationEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "OngProfile" ADD COLUMN IF NOT EXISTS "locationApproximate" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "OngProfile_latitude_longitude_idx" ON "OngProfile"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "OngProfile_city_state_idx" ON "OngProfile"("city", "state");

ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "googlePlaceId" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "formattedAddress" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "geocodedAt" TIMESTAMP(3);
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "serviceRadiusKm" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS "PartnerProfile_latitude_longitude_idx" ON "PartnerProfile"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "PartnerProfile_city_state_idx" ON "PartnerProfile"("city", "state");
CREATE INDEX IF NOT EXISTS "PartnerProfile_category_verificationStatus_idx" ON "PartnerProfile"("category", "verificationStatus");

CREATE TABLE IF NOT EXISTS "MapsUsageEvent" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorCode" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MapsUsageEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MapsUsageEvent_action_createdAt_idx" ON "MapsUsageEvent"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "MapsUsageEvent_success_createdAt_idx" ON "MapsUsageEvent"("success", "createdAt");
CREATE INDEX IF NOT EXISTS "MapsUsageEvent_userId_idx" ON "MapsUsageEvent"("userId");
