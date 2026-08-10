import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL || "";
if (/supabase/i.test(url) || !/localhost|127\.0\.0\.1/.test(url)) {
  console.error("Refusing non-localhost DATABASE_URL");
  process.exit(2);
}

const p = new PrismaClient();
const cols = await p.$queryRaw`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'PartnerProfile'
    AND column_name IN ('slug','approvedAt','rejectionReason','profileDetails')
  ORDER BY 1`;
console.log("PartnerProfile cols:", cols);

const mig = await p.$queryRaw`
  SELECT migration_name, (finished_at IS NOT NULL) AS ok
  FROM _prisma_migrations
  ORDER BY started_at DESC
  LIMIT 8`;
console.log("Recent migrations:", mig);

const count = await p.$queryRaw`SELECT COUNT(*)::int AS n FROM _prisma_migrations WHERE finished_at IS NOT NULL`;
console.log("Applied migrations:", count);
await p.$disconnect();
