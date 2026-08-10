-- Align @updatedAt columns (no DB default) and ensure Product unique (sellerId, sku).
ALTER TABLE "ConversationParticipant" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Hashtag" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Message" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS "Product_sellerId_sku_key" ON "Product"("sellerId", "sku");
