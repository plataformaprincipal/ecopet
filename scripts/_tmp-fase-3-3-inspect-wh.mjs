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
const since = new Date(Date.now() - 15 * 60 * 1000);
const rows = await prisma.mpWebhookEvent.findMany({
  where: { createdAt: { gte: since } },
  orderBy: { createdAt: "desc" },
  take: 15,
});
console.log(
  JSON.stringify(
    rows.map((r) => ({
      id: r.id.slice(0, 8) + "…",
      eventType: r.eventType,
      resourceId: r.resourceId,
      signatureValid: r.signatureValid,
      processingStatus: r.processingStatus,
      failureCode: r.failureCode,
      failureReason: (r.failureReason || "").slice(0, 120),
      createdAt: r.createdAt,
      payloadKeys: r.sanitizedPayload && typeof r.sanitizedPayload === "object"
        ? Object.keys(r.sanitizedPayload)
        : null,
      type: r.sanitizedPayload?.type || r.sanitizedPayload?.topic || null,
      action: r.sanitizedPayload?.action || null,
      dataId: r.sanitizedPayload?.data?.id || r.sanitizedPayload?.["data.id"] || null,
    })),
    null,
    2
  )
);

// Also payments recently PROCESSING accredited
const pays = await prisma.payment.findMany({
  where: { createdAt: { gte: since }, provider: "mercado_pago" },
  orderBy: { createdAt: "desc" },
  take: 3,
  select: {
    id: true,
    status: true,
    statusDetail: true,
    providerOrderId: true,
    providerPaymentId: true,
    createdAt: true,
  },
});
console.log("PAYS", JSON.stringify(pays, null, 2));
await prisma.$disconnect();
