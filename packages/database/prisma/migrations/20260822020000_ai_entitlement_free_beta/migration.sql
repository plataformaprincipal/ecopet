-- Additive: free EccoPet AI executions do not require a commercial order.
ALTER TABLE "AIEntitlement" ALTER COLUMN "orderId" DROP NOT NULL;
ALTER TABLE "AIEntitlement" ALTER COLUMN "orderItemId" DROP NOT NULL;

ALTER TABLE "AIEntitlement" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'PURCHASE';

ALTER TABLE "AIEntitlement" DROP CONSTRAINT IF EXISTS "AIEntitlement_orderId_fkey";
ALTER TABLE "AIEntitlement" ADD CONSTRAINT "AIEntitlement_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AIEntitlement" DROP CONSTRAINT IF EXISTS "AIEntitlement_orderItemId_fkey";
ALTER TABLE "AIEntitlement" ADD CONSTRAINT "AIEntitlement_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "AIEntitlement_source_idx" ON "AIEntitlement"("source");
