-- FASE 8: EccoPontos — política, campanhas, catálogo de resgate, REVERSAL/BONUS

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'LoyaltyTxnType' AND e.enumlabel = 'REVERSAL'
  ) THEN
    ALTER TYPE "LoyaltyTxnType" ADD VALUE 'REVERSAL';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'LoyaltyTxnType' AND e.enumlabel = 'BONUS'
  ) THEN
    ALTER TYPE "LoyaltyTxnType" ADD VALUE 'BONUS';
  END IF;
END $$;

ALTER TABLE "LoyaltyTransaction" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

CREATE TABLE IF NOT EXISTS "LoyaltyPolicy" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "pointsPerBrl" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "servicePointsPerBrl" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "expirationDays" INTEGER,
    "maxEarnPerEvent" INTEGER,
    "minRedeemPoints" INTEGER NOT NULL DEFAULT 1,
    "referralEnabled" BOOLEAN NOT NULL DEFAULT false,
    "overdraftPolicy" TEXT NOT NULL DEFAULT 'forbid',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoyaltyPolicy_pkey" PRIMARY KEY ("id")
);

INSERT INTO "LoyaltyPolicy" ("id", "enabled", "pointsPerBrl", "servicePointsPerBrl", "minRedeemPoints", "referralEnabled", "overdraftPolicy", "updatedAt")
VALUES ('singleton', true, 1, 1, 1, false, 'forbid', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "LoyaltyCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sourceType" TEXT,
    "category" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "maxEarnPerUser" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LoyaltyCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LoyaltyCampaign_isActive_startsAt_endsAt_idx" ON "LoyaltyCampaign"("isActive", "startsAt", "endsAt");

CREATE TABLE IF NOT EXISTS "LoyaltyReward" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pointsCost" INTEGER NOT NULL,
    "couponDiscountType" TEXT NOT NULL,
    "couponDiscountValue" DOUBLE PRECISION NOT NULL,
    "minOrderCents" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxRedemptionsPerUser" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyReward_code_key" ON "LoyaltyReward"("code");
CREATE INDEX IF NOT EXISTS "LoyaltyReward_isActive_idx" ON "LoyaltyReward"("isActive");

INSERT INTO "LoyaltyReward" (
  "id", "code", "title", "description", "pointsCost",
  "couponDiscountType", "couponDiscountValue", "isActive", "createdAt", "updatedAt"
) VALUES (
  'fase8_rwd_ecco10',
  'ECCOPONTOS10',
  '10% de desconto',
  'Cupom de 10% gerado ao resgatar 100 EccoPontos.',
  100,
  'PERCENT',
  10,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT ("code") DO NOTHING;
