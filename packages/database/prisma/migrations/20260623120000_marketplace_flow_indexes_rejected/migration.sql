-- Marketplace flow: REJECTED appointment status + catalog indexes
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

CREATE INDEX IF NOT EXISTS "Product_approvalStatus_idx" ON "Product"("approvalStatus");
CREATE INDEX IF NOT EXISTS "Product_sellerId_status_idx" ON "Product"("sellerId", "status");
CREATE INDEX IF NOT EXISTS "Service_approvalStatus_idx" ON "Service"("approvalStatus");
