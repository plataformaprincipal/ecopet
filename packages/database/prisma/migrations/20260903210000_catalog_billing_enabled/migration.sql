-- Catch-up: ensure billingEnabled exists even if the previous ALTER was skipped.
ALTER TABLE "PricingCatalogItem" ADD COLUMN IF NOT EXISTS "billingEnabled" BOOLEAN NOT NULL DEFAULT false;
