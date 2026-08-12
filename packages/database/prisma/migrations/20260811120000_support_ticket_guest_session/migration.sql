-- Allow support tickets from authenticated users OR guest chat sessions.
ALTER TABLE "SupportTicket" ALTER COLUMN "requesterId" DROP NOT NULL;

ALTER TABLE "SupportTicket" ADD COLUMN "guestSessionId" TEXT;

CREATE UNIQUE INDEX "SupportTicket_guestSessionId_key" ON "SupportTicket"("guestSessionId");

ALTER TABLE "SupportTicket"
  ADD CONSTRAINT "SupportTicket_guestSessionId_fkey"
  FOREIGN KEY ("guestSessionId") REFERENCES "GuestChatSession"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
