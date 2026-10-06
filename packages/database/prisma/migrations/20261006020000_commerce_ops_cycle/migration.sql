-- Commerce ops cycle: seller accept SLA, tracking URL, after-sales cases.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sellerAcceptBy" TIMESTAMP(3);
ALTER TABLE "OrderFulfillment" ADD COLUMN IF NOT EXISTS "trackingUrl" TEXT;

CREATE TABLE IF NOT EXISTS "CommerceCase" (
    "id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestedResolution" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "CommerceCase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommerceCase_protocol_key" ON "CommerceCase"("protocol");
CREATE INDEX IF NOT EXISTS "CommerceCase_orderId_idx" ON "CommerceCase"("orderId");
CREATE INDEX IF NOT EXISTS "CommerceCase_buyerId_idx" ON "CommerceCase"("buyerId");
CREATE INDEX IF NOT EXISTS "CommerceCase_sellerId_idx" ON "CommerceCase"("sellerId");
CREATE INDEX IF NOT EXISTS "CommerceCase_status_idx" ON "CommerceCase"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CommerceCase_orderId_fkey'
  ) THEN
    ALTER TABLE "CommerceCase"
      ADD CONSTRAINT "CommerceCase_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CommerceCase_buyerId_fkey'
  ) THEN
    ALTER TABLE "CommerceCase"
      ADD CONSTRAINT "CommerceCase_buyerId_fkey"
      FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CommerceCase_sellerId_fkey'
  ) THEN
    ALTER TABLE "CommerceCase"
      ADD CONSTRAINT "CommerceCase_sellerId_fkey"
      FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
