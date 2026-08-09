import { createRequire } from "module";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
require("../apps/web/scripts/stub-server-only.cjs");

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
    )
      v = v.slice(1, -1);
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}

const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
if (e2e.DIRECT_URL) process.env.DATABASE_URL = e2e.DIRECT_URL;
else if (e2e.DATABASE_URL) process.env.DATABASE_URL = e2e.DATABASE_URL;

const prisma = new PrismaClient();
try {
  const sims = await prisma.mpWebhookEvent.findMany({
    where: { resourceId: "123456" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log("=== SIMULATOR EVENTS ===");
  for (const e of sims) {
    console.log(
      JSON.stringify(
        {
          createdAt: e.createdAt,
          applicationId: e.applicationId,
          mpUserId: e.mpUserId,
          liveMode: e.liveMode,
          signatureValid: e.signatureValid,
          failureCode: e.failureCode,
          action: e.action,
          eventType: e.eventType,
          requestIdSanitized: e.requestId
            ? `${String(e.requestId).slice(0, 8)}…`
            : null,
          sanitizedPayload: e.sanitizedPayload,
        },
        null,
        2,
      ),
    );
  }

  const nats = await prisma.mpWebhookEvent.findMany({
    where: { resourceId: "ORDTST01KZJJ1W6BXHNN3X9EFMR1A1MH" },
    orderBy: { createdAt: "asc" },
    take: 2,
  });
  console.log("=== NATURAL EVENTS ===");
  for (const e of nats) {
    console.log(
      JSON.stringify(
        {
          createdAt: e.createdAt,
          applicationId: e.applicationId,
          mpUserId: e.mpUserId,
          liveMode: e.liveMode,
          signatureValid: e.signatureValid,
          failureCode: e.failureCode,
          action: e.action,
          sanitizedPayload: e.sanitizedPayload,
          failureReason: e.failureReason,
        },
        null,
        2,
      ),
    );
  }

  // docs demo IDs for comparison
  console.log(
    JSON.stringify({
      docsDemoApplicationId: "76506430185983",
      docsDemoUserId: "2025701502",
      docsDemoNotificationId: "123456",
      docsDemoDataIdExample: "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3",
      ourSimApplicationId: sims[0]?.applicationId ?? null,
      ourSimUserId: sims[0]?.mpUserId ?? null,
      equalsDocsDemoApp: String(sims[0]?.applicationId) === "76506430185983",
      equalsDocsDemoUser: String(sims[0]?.mpUserId) === "2025701502",
      equalsUserConfirmedTestApp:
        String(sims[0]?.applicationId) === "2558117866767882",
      naturalMatchesUserConfirmedTestApp:
        String(nats[0]?.applicationId) === "2558117866767882",
    }),
  );
} finally {
  await prisma.$disconnect();
}
