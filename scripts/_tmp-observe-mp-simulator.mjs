/**
 * Observa UMA notificação (simulador ou natural) após T0 — read-only DB.
 */
import { createRequire } from "module";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
require("../apps/web/scripts/stub-server-only.cjs");

const WAIT_MS = Number(process.env.SIMULATOR_WATCH_MS || 15 * 60 * 1000);
const TICK_MS = Number(process.env.SIMULATOR_TICK_MS || 3000);
const LABEL = process.env.WATCH_LABEL || "EVENT";

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

const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
for (const [k, v] of Object.entries(e2e)) if (!process.env[k]) process.env[k] = v;
for (const k of ["DATABASE_URL", "DIRECT_URL"]) if (e2e[k]) process.env[k] = e2e[k];
if (process.env.DIRECT_URL?.startsWith("postgres")) process.env.DATABASE_URL = process.env.DIRECT_URL;

const prisma = new PrismaClient();
const observeSince = new Date();
const outPath = path.join(process.cwd(), `scripts/_tmp-observe-${LABEL.toLowerCase()}-result.json`);

console.log(JSON.stringify({ mode: LABEL, observeSince: observeSince.toISOString(), waitMs: WAIT_MS }));

const started = Date.now();
try {
  while (Date.now() - started < WAIT_MS) {
    let events = [];
    try {
      events = await prisma.mpWebhookEvent.findMany({
        where: { createdAt: { gt: observeSince } },
        orderBy: { createdAt: "asc" },
        take: 5,
      });
    } catch (e) {
      console.log(JSON.stringify({ watch: "db_retry", err: String(e.message || e).slice(0, 100) }));
      await new Promise((r) => setTimeout(r, TICK_MS));
      continue;
    }
    if (events.length) {
      const ev = events[0];
      const kv = parseKv(ev.failureReason);
      const sig =
        ev.sanitizedPayload && typeof ev.sanitizedPayload === "object"
          ? ev.sanitizedPayload._sigDiag || null
          : null;
      const report = {
        label: LABEL,
        observed: true,
        observeSince: observeSince.toISOString(),
        firstEventAt: ev.createdAt,
        waitMs: Date.now() - started,
        http: ev.signatureValid ? "200 (assinatura aceita)" : "401 (assinatura rejeitada)",
        topicOrType: ev.eventType,
        action: ev.action,
        signatureValid: ev.signatureValid,
        failureCode: ev.failureCode,
        failureReason: ev.failureReason,
        processingStatus: ev.processingStatus,
        requestIdSanitized: ev.requestId
          ? `${String(ev.requestId).slice(0, 8)}…${String(ev.requestId).slice(-4)}`
          : null,
        resourceIdSanitized: ev.resourceId
          ? String(ev.resourceId).length <= 12
            ? ev.resourceId
            : `${String(ev.resourceId).slice(0, 8)}…${String(ev.resourceId).slice(-4)}`
          : null,
        sigDiag: sig,
        parsedFlags: {
          source: kv.source || sig?.source || null,
          rawQueryKeys: kv.rawQueryKeys || (sig?.rawQueryKeys || []).join(",") || null,
          queryDataDotId: kv.queryDataDotId || sig?.queryDataDotId || null,
          queryDataUnderscoreId: kv.queryDataUnderscoreId || sig?.queryDataUnderscoreId || null,
          bodyDataId: kv.bodyDataId || sig?.bodyDataId || null,
          typeQuery: kv.typeQuery || sig?.typeQuery || null,
          bodyType: kv.bodyType || ev.eventType,
          dataIdSrc: kv.dataIdSrc || sig?.dataIdSource || null,
          dataId: kv.dataId || sig?.bodyDataId || null,
          ts: kv.ts || sig?.ts || null,
          reqSha8: kv.reqSha8 || sig?.xRequestIdSha8 || null,
          recvV1Sha8: kv.recvV1Sha8 || sig?.receivedV1Sha8 || null,
          manifestSha8: kv.manifestSha8 || sig?.manifestSha8 || null,
          expHmacSha8: kv.expHmacSha8 || sig?.expectedHmacSha8 || null,
          recvHmacSha8: kv.recvHmacSha8 || sig?.receivedHmacSha8 || null,
          secretSha8: kv.secretSha8 || sig?.secretSha8 || null,
          candidate: kv.candidate || sig?.candidateUsed || null,
        },
      };
      fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
      console.log(`\n=== ${LABEL} CAPTURED ===`);
      console.log(JSON.stringify(report, null, 2));
      process.exitCode = 0;
      break;
    }
    if ((Date.now() - started) % 15000 < TICK_MS) {
      console.log(JSON.stringify({ watch: "waiting", tMs: Date.now() - started }));
    }
    await new Promise((r) => setTimeout(r, TICK_MS));
  }
  if (process.exitCode == null) {
    const timeout = { observed: false, label: LABEL, observeSince: observeSince.toISOString() };
    fs.writeFileSync(outPath, JSON.stringify(timeout, null, 2));
    console.log(JSON.stringify(timeout));
    process.exitCode = 2;
  }
} finally {
  await prisma.$disconnect();
}
