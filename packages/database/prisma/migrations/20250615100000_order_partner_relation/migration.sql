-- Add foreign key for Order.partnerId -> User.id
DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_partnerId_fkey"
    FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
