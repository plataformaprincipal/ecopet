-- Replace partial unique (WHERE sku IS NOT NULL) with full @@unique([sellerId, sku]).
DROP INDEX IF EXISTS "Product_sellerId_sku_key";
CREATE UNIQUE INDEX "Product_sellerId_sku_key" ON "Product"("sellerId", "sku");
