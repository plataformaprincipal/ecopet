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
  return s.length <= 14 ? s : `${s.slice(0, 8)}…${s.slice(-4)}`;
}

const ORD = "ORDTST01KZJJ1W6BXHNN3X9EFMR1A1MH";
const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
if (e2e.DIRECT_URL) process.env.DATABASE_URL = e2e.DIRECT_URL;
else if (e2e.DATABASE_URL) process.env.DATABASE_URL = e2e.DATABASE_URL;

const prisma = new PrismaClient();
try {
  const since = new Date(Date.now() - 45 * 60 * 1000);

  const logs = await prisma.platformIntegrationLog.findMany({
    where: {
      provider: "mercado_pago",
      action: "webhook:signature",
      createdAt: { gte: since },
      message: { contains: "ORDTST01" },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const allRecentLogs = await prisma.platformIntegrationLog.findMany({
    where: {
      provider: "mercado_pago",
      action: "webhook:signature",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  // Prefer newest log that mentions ORDTST and SIMULATOR or SIGNATURE_OK with that id
  const ordLogs = allRecentLogs.filter((l) =>
    String(l.message || "").includes("ORDTST01"),
  );

  const events = await prisma.mpWebhookEvent.findMany({
    where: {
      createdAt: { gte: since },
      OR: [
        { resourceId: ORD },
        { failureReason: { contains: "ORDTST01" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Classify simulator vs natural from source= in failureReason / message
  const simLogs = ordLogs.filter(
    (l) =>
      String(l.message || "").includes("source=SIMULATOR") ||
      (l.status === "success" &&
        String(l.message || "").includes("queryDataDotId=ORDTST01")),
  );
  const natEvents = events.filter(
    (e) =>
      e.signatureValid === false ||
      String(e.failureReason || "").includes("source=NATURAL"),
  );
  const simEvents = events.filter(
    (e) =>
      String(e.failureReason || "").includes("source=SIMULATOR") ||
      (e.signatureValid === true &&
        String(e.failureReason || "").includes("SIGNATURE_OK")),
  );

  const latestSimLog = simLogs[0] || null;
  // If no source=SIMULATOR in log (older format), take newest ORDTST success after natural window
  const latestOrdLog =
    latestSimLog ||
    ordLogs.find((l) => l.status === "success") ||
    ordLogs[0] ||
    null;

  const kv = parseKv(latestOrdLog?.message);
  const latestSimEv =
    simEvents[0] ||
    events.find(
      (e) =>
        e.createdAt >= (latestOrdLog?.createdAt || since) &&
        (e.signatureValid === true ||
          String(e.failureReason || "").includes("source=SIMULATOR")),
    ) ||
    null;

  const sig =
    latestSimEv?.sanitizedPayload &&
    typeof latestSimEv.sanitizedPayload === "object"
      ? latestSimEv.sanitizedPayload._sigDiag || null
      : null;

  // Last known NATURAL invalid for same Order
  const natural = await prisma.mpWebhookEvent.findFirst({
    where: {
      resourceId: ORD,
      signatureValid: false,
      failureCode: "SIGNATURE_MISMATCH",
    },
    orderBy: { createdAt: "desc" },
  });
  const natKv = parseKv(natural?.failureReason);
  const natSig =
    natural?.sanitizedPayload && typeof natural.sanitizedPayload === "object"
      ? natural.sanitizedPayload._sigDiag || null
      : null;

  const signatureValid =
    latestOrdLog?.status === "success" ||
    String(latestOrdLog?.message || "").startsWith("SIGNATURE_OK") ||
    latestSimEv?.signatureValid === true;

  const report = {
    ord: sanitizeId(ORD),
    latestOrdLog: latestOrdLog
      ? {
          createdAt: latestOrdLog.createdAt,
          status: latestOrdLog.status,
          message: latestOrdLog.message,
        }
      : null,
    latestSimEvent: latestSimEv
      ? {
          createdAt: latestSimEv.createdAt,
          signatureValid: latestSimEv.signatureValid,
          failureCode: latestSimEv.failureCode,
          processingStatus: latestSimEv.processingStatus,
          applicationId: latestSimEv.applicationId,
          mpUserId: latestSimEv.mpUserId,
          liveMode: latestSimEv.liveMode,
          requestId: sanitizeId(latestSimEv.requestId),
          failureReason: latestSimEv.failureReason,
          sigDiag: sig,
          bodyDataId: latestSimEv.sanitizedPayload?.data?.id ?? null,
        }
      : null,
    fields: {
      http:
        signatureValid || latestOrdLog?.status === "success"
          ? "200 OK (painel + assinatura aceita ou log success)"
          : latestOrdLog
            ? "401 (assinatura rejeitada) ou painel 200 com reject interno"
            : "unknown",
      signatureValid,
      failureCode:
        latestSimEv?.failureCode ||
        (signatureValid
          ? null
          : String(latestOrdLog?.message || "").startsWith("SIGNATURE_MISMATCH")
            ? "SIGNATURE_MISMATCH"
            : null),
      queryDataId: kv.queryDataDotId || sig?.queryDataDotId || null,
      bodyDataId: kv.bodyDataId || sig?.bodyDataId || null,
      dataIdSrc: kv.dataIdSrc || sig?.dataIdSource || null,
      candidate: kv.candidate || sig?.candidateUsed || null,
      xRequestIdPresent:
        kv.reqId === "1" ||
        Boolean(sig?.xRequestIdSha8) ||
        Boolean(latestSimEv?.requestId),
      ts: kv.ts || sig?.ts || null,
      manifestSha8: kv.manifestSha8 || sig?.manifestSha8 || null,
      expectedHmacSha8: kv.expHmacSha8 || sig?.expectedHmacSha8 || null,
      receivedHmacSha8: kv.recvHmacSha8 || sig?.receivedHmacSha8 || null,
      secretSha8: kv.secretSha8 || sig?.secretSha8 || null,
      source: kv.source || sig?.source || null,
      rawQueryKeys: kv.rawQueryKeys || (sig?.rawQueryKeys || []).join(",") || null,
      reqSha8: kv.reqSha8 || sig?.xRequestIdSha8 || null,
    },
    naturalCompare: natural
      ? {
          createdAt: natural.createdAt,
          signatureValid: natural.signatureValid,
          failureCode: natural.failureCode,
          requestId: sanitizeId(natural.requestId),
          rawQueryKeys:
            natKv.rawQueryKeys || (natSig?.rawQueryKeys || []).join(",") || null,
          queryDataId: natKv.queryDataDotId || natSig?.queryDataDotId || null,
          bodyDataId: natKv.bodyDataId || natSig?.bodyDataId || null,
          dataIdSrc: natKv.dataIdSrc || natSig?.dataIdSource || null,
          candidate: natKv.candidate || natSig?.candidateUsed || null,
          ts: natKv.ts || natSig?.ts || null,
          manifestSha8: natKv.manifestSha8 || natSig?.manifestSha8 || null,
          expectedHmacSha8: natKv.expHmacSha8 || natSig?.expectedHmacSha8 || null,
          receivedHmacSha8: natKv.recvHmacSha8 || natSig?.receivedHmacSha8 || null,
          secretSha8: natKv.secretSha8 || natSig?.secretSha8 || null,
          reqSha8: natKv.reqSha8 || natSig?.xRequestIdSha8 || null,
          source: natKv.source || natSig?.source || "NATURAL",
          hasExternalReferenceInQuery: String(
            natKv.rawQueryKeys || (natSig?.rawQueryKeys || []).join(",") || "",
          ).includes("data.external_reference"),
          failureReason: natural.failureReason,
        }
      : null,
    recentOrdLogs: ordLogs.slice(0, 8).map((l) => ({
      createdAt: l.createdAt,
      status: l.status,
      source: parseKv(l.message).source || null,
      queryDataDotId: parseKv(l.message).queryDataDotId || null,
      candidate: parseKv(l.message).candidate || null,
      head: String(l.message || "").slice(0, 160),
    })),
  };

  fs.writeFileSync(
    path.join(process.cwd(), "scripts/_tmp-capture-ordtst-sim-result.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await prisma.$disconnect();
}
