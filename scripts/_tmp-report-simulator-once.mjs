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

function sanitizeId(id) {
  if (id == null || id === "") return null;
  const s = String(id);
  return s.length <= 12 ? s : `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function parseDiag(failureReason) {
  const s = String(failureReason || "");
  const get = (key) => {
    const m = s.match(new RegExp(`${key}=([^\\s]+)`));
    return m ? m[1] : null;
  };
  return {
    queryDataIdPresent: get("queryDataId"),
    bodyDataIdPresent: get("bodyDataId"),
    secretSha8: get("secretSha8"),
    ts: get("ts"),
    v1Present: get("v1"),
    reqIdPresent: get("reqId"),
    expHmacSha8: get("expHmacSha8"),
    recvHmacSha8: get("recvHmacSha8"),
  };
}

const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
for (const [k, v] of Object.entries(e2e)) if (!process.env[k]) process.env[k] = v;
for (const k of ["DATABASE_URL", "DIRECT_URL"]) if (e2e[k]) process.env[k] = e2e[k];
if (process.env.DIRECT_URL?.startsWith("postgres")) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const since = new Date("2026-08-09T05:38:57.753Z");
const prisma = new PrismaClient();
try {
  const events = await prisma.mpWebhookEvent.findMany({
    where: { createdAt: { gt: since } },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: {
      id: true,
      eventType: true,
      panelTopic: true,
      action: true,
      resourceId: true,
      requestId: true,
      signatureValid: true,
      failureCode: true,
      failureReason: true,
      processingStatus: true,
      createdAt: true,
      receivedAt: true,
      liveMode: true,
      environment: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        since: since.toISOString(),
        count: events.length,
        events: events.map((ev) => {
          const diag = parseDiag(ev.failureReason);
          let simSig = "INDETERMINADO";
          if (ev.signatureValid === true) simSig = "VALID";
          else if (ev.signatureValid === false) simSig = "INVALID";
          return {
            createdAt: ev.createdAt,
            topicOrType: ev.eventType,
            action: ev.action,
            queryDataId: diag.queryDataIdPresent === "1" ? "present" : "absent",
            bodyDataId: sanitizeId(ev.resourceId),
            xRequestIdPresent: Boolean(ev.requestId) || diag.reqIdPresent === "1",
            xSignaturePresent: diag.v1Present === "1",
            ts: diag.ts,
            signatureValid: ev.signatureValid,
            failureCode: ev.failureCode,
            expectedHmacSha8: diag.expHmacSha8,
            receivedHmacSha8: diag.recvHmacSha8,
            secretSha8Runtime: diag.secretSha8,
            processingStatus: ev.processingStatus,
            SIMULADOR_SIGNATURE: simSig,
            // HTTP: painel MP reportou 200; pipeline aceita assinatura com 200
            http: "200 OK (painel MP + assinatura aceita no pipeline)",
            note:
              diag.v1Present == null
                ? "failureReason sem diag HMAC (caminho não rejeitou assinatura)"
                : null,
          };
        }),
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
