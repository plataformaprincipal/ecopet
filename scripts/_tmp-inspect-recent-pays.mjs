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
for (const [k, v] of Object.entries(e2e)) {
  if (!process.env[k]) process.env[k] = v;
}
if (process.env.DIRECT_URL?.startsWith("postgres")) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const p = new PrismaClient();
const pays = await p.payment.findMany({
  where: { provider: "mercado_pago" },
  orderBy: { createdAt: "desc" },
  take: 8,
  select: {
    id: true,
    status: true,
    providerOrderId: true,
    providerPaymentId: true,
    orderId: true,
    createdAt: true,
    amount: true,
    statusDetail: true,
  },
});
console.log(
  JSON.stringify(
    pays.map((x) => ({
      id: `${x.id.slice(0, 8)}…`,
      status: x.status,
      statusDetail: x.statusDetail,
      amount: x.amount,
      providerOrderId: x.providerOrderId,
      providerPaymentId: x.providerPaymentId,
      createdAt: x.createdAt,
    })),
    null,
    2
  )
);
const wh = await p.mpWebhookEvent.findMany({
  orderBy: { createdAt: "desc" },
  take: 8,
  select: {
    id: true,
    eventType: true,
    resourceId: true,
    processingStatus: true,
    signatureValid: true,
    createdAt: true,
    paymentId: true,
    failureCode: true,
  },
});
console.log(
  "WH",
  JSON.stringify(
    wh.map((w) => ({
      id: `${w.id.slice(0, 8)}…`,
      eventType: w.eventType,
      resourceId: w.resourceId,
      processingStatus: w.processingStatus,
      signatureValid: w.signatureValid,
      failureCode: w.failureCode,
      createdAt: w.createdAt,
    })),
    null,
    2
  )
);
await p.$disconnect();
