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
if (e2e.DIRECT_URL) process.env.DATABASE_URL = e2e.DIRECT_URL;
else if (e2e.DATABASE_URL) process.env.DATABASE_URL = e2e.DATABASE_URL;

const since = new Date(Date.now() - 30 * 60 * 1000);
const prisma = new PrismaClient();
try {
  const logs = await prisma.platformIntegrationLog.findMany({
    where: {
      provider: "mercado_pago",
      action: "webhook:signature",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const events = await prisma.mpWebhookEvent.findMany({
    where: {
      createdAt: { gte: since },
      OR: [
        { resourceId: "123456" },
        { failureReason: { contains: "source=SIMULATOR" } },
        { failureReason: { contains: "SIGNATURE_OK" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Also any recent SIGNATURE_OK regardless
  const okLogs = logs.filter(
    (l) =>
      l.status === "success" ||
      String(l.message || "").includes("SIGNATURE_OK") ||
      String(l.message || "").includes("source=SIMULATOR"),
  );

  const latestOk = okLogs[0] || logs[0] || null;
  const kv = parseKv(latestOk?.message);
  const latestEv = events[0] || null;
  const sig =
    latestEv?.sanitizedPayload && typeof latestEv.sanitizedPayload === "object"
      ? latestEv.sanitizedPayload._sigDiag || null
      : null;

  const report = {
    captureWindowSince: since.toISOString(),
    latestSignatureLog: latestOk
      ? {
          createdAt: latestOk.createdAt,
          status: latestOk.status,
          message: latestOk.message,
        }
      : null,
    latestEvent: latestEv
      ? {
          createdAt: latestEv.createdAt,
          resourceId: sanitizeId(latestEv.resourceId),
          applicationId: latestEv.applicationId,
          mpUserId: latestEv.mpUserId,
          liveMode: latestEv.liveMode,
          signatureValid: latestEv.signatureValid,
          failureCode: latestEv.failureCode,
          processingStatus: latestEv.processingStatus,
          action: latestEv.action,
          eventType: latestEv.eventType,
          failureReason: latestEv.failureReason,
          sigDiag: sig,
          bodyAppId: latestEv.sanitizedPayload?.application_id ?? null,
          bodyUserId: latestEv.sanitizedPayload?.user_id ?? null,
          bodyDataId: latestEv.sanitizedPayload?.data?.id ?? null,
        }
      : null,
    fields: {
      signatureValid:
        latestOk?.status === "success" ||
        String(latestOk?.message || "").startsWith("SIGNATURE_OK") ||
        latestEv?.signatureValid === true,
      failureCode:
        latestEv?.failureCode ||
        (String(latestOk?.message || "").startsWith("SIGNATURE_OK")
          ? null
          : kv.SIGNATURE_MISMATCH
            ? "SIGNATURE_MISMATCH"
            : null),
      queryDataId: kv.queryDataDotId || sig?.queryDataDotId || null,
      bodyDataId: kv.bodyDataId || sig?.bodyDataId || null,
      candidate: kv.candidate || sig?.candidateUsed || null,
      ts: kv.ts || sig?.ts || null,
      manifestSha8: kv.manifestSha8 || sig?.manifestSha8 || null,
      expectedHmacSha8: kv.expHmacSha8 || sig?.expectedHmacSha8 || null,
      receivedHmacSha8: kv.recvHmacSha8 || sig?.receivedHmacSha8 || null,
      secretSha8: kv.secretSha8 || sig?.secretSha8 || null,
      source: kv.source || sig?.source || null,
      rawQueryKeys: kv.rawQueryKeys || (sig?.rawQueryKeys || []).join(",") || null,
      dataIdSrc: kv.dataIdSrc || sig?.dataIdSource || null,
    },
    recentLogs: logs.slice(0, 5).map((l) => ({
      createdAt: l.createdAt,
      status: l.status,
      head: String(l.message || "").slice(0, 120),
    })),
  };

  fs.writeFileSync(
    path.join(process.cwd(), "scripts/_tmp-capture-latest-simulator-result.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await prisma.$disconnect();
}
