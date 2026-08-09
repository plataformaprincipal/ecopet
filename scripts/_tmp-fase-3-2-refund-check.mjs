import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}
const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
for (const [k, v] of Object.entries(e2e)) if (!process.env[k]) process.env[k] = v;
if (process.env.DIRECT_URL?.startsWith("postgres")) process.env.DATABASE_URL = process.env.DIRECT_URL;

const prisma = new PrismaClient();
const pay = await prisma.payment.findFirst({
  where: { providerOrderId: "ORDTST01KZHX2HTPB90NY53GS3DN65P9" },
  include: { paymentRefunds: true },
});
console.log(
  JSON.stringify(
    {
      status: pay?.status,
      refundedAmount: pay?.refundedAmount,
      refunds: (pay?.paymentRefunds || []).map((r) => ({
        id: r.id?.slice?.(0, 8),
        status: r.status,
        amount: r.amount,
        providerRefundId: r.providerRefundId || r.externalRefundId || r.externalId || null,
      })),
    },
    null,
    2
  )
);
await prisma.$disconnect();
