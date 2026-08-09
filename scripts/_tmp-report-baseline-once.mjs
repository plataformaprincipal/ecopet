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

function parseKv(s) {
  const out = {};
  for (const part of String(s || "").split(/\s+/)) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    out[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return out;
}

function sanitizeId(id) {
  if (id == null || id === "") return null;
  const s = String(id);
  return s.length <= 12 ? s : `${s.slice(0, 8)}…${s.slice(-4)}`;
}

const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
for (const [k, v] of Object.entries(e2e)) if (!process.env[k]) process.env[k] = v;
for (const k of ["DATABASE_URL", "DIRECT_URL"]) if (e2e[k]) process.env[k] = e2e[k];
if (process.env.DIRECT_URL?.startsWith("postgres")) process.env.DATABASE_URL = process.env.DIRECT_URL;

const since = new Date(process.argv[2] || "2026-08-09T05:59:32.066Z");
const prisma = new PrismaClient();
try {
  const events = await prisma.mpWebhookEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    take: 10,
  });
  // also check integration logs for SIGNATURE_OK after since
  const logs = await prisma.platformIntegrationLog
    .findMany({
      where: {
        provider: "mercado_pago",
        action: "webhook:signature",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: { createdAt: true, status: true, message: true },
    })
    .catch(() => []);

  console.log(
    JSON.stringify(
      {
        since: since.toISOString(),
        eventCount: events.length,
        logCount: logs.length,
        events: events.map((ev) => {
          const kv = parseKv(ev.failureReason);
          const sig =
            ev.sanitizedPayload && typeof ev.sanitizedPayload === "object"
              ? ev.sanitizedPayload._sigDiag || null
              : null;
          return {
            createdAt: ev.createdAt,
            eventType: ev.eventType,
            action: ev.action,
            signatureValid: ev.signatureValid,
            failureCode: ev.failureCode,
            processingStatus: ev.processingStatus,
            resourceId: sanitizeId(ev.resourceId),
            requestId: sanitizeId(ev.requestId),
            failureReason: ev.failureReason,
            sigDiag: sig,
            parsed: {
              source: kv.source || sig?.source || null,
              rawQueryKeys: kv.rawQueryKeys || (sig?.rawQueryKeys || []).join(",") || null,
              queryDataDotId: kv.queryDataDotId || sig?.queryDataDotId || null,
              bodyDataId: kv.bodyDataId || sig?.bodyDataId || null,
              candidate: kv.candidate || sig?.candidateUsed || null,
              ts: kv.ts || sig?.ts || null,
              manifestSha8: kv.manifestSha8 || sig?.manifestSha8 || null,
              secretSha8: kv.secretSha8 || sig?.secretSha8 || null,
              expHmacSha8: kv.expHmacSha8 || sig?.expectedHmacSha8 || null,
              recvHmacSha8: kv.recvHmacSha8 || sig?.receivedHmacSha8 || null,
            },
          };
        }),
        logs: logs.map((l) => ({
          createdAt: l.createdAt,
          status: l.status,
          message: l.message,
        })),
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
