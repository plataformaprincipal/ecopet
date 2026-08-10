import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL || "";
if (/supabase/i.test(url) || !/localhost|127\.0\.0\.1/.test(url)) {
  console.error("Refusing non-localhost");
  process.exit(2);
}
const p = new PrismaClient();

async function cols(table) {
  return p.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY 1`,
    table,
  );
}

for (const t of [
  "NotificationPreference",
  "Conversation",
  "Hashtag",
  "SupportTicket",
  "PartnerProfile",
]) {
  const c = await cols(t);
  console.log(
    t,
    c.map((x) => x.column_name).join(", "),
  );
}

// expected schema fields that residual diff wanted
const expected = {
  PartnerProfile: ["slug"],
  NotificationPreference: ["pushEnabled"],
  Conversation: ["contextType", "directKey", "createdById"],
  Hashtag: ["slug", "name"],
  SupportTicket: ["closedAt"],
};
for (const [table, fields] of Object.entries(expected)) {
  const present = new Set((await cols(table)).map((x) => x.column_name));
  const missing = fields.filter((f) => !present.has(f));
  console.log(`MISSING ${table}:`, missing.length ? missing.join(", ") : "(none)");
}

await p.$disconnect();
