-- TicketPriority.NORMAL was added in 20260806180100; set default after commit.
ALTER TABLE "SupportTicket"
  ALTER COLUMN "priority" SET DEFAULT 'NORMAL'::"TicketPriority";
