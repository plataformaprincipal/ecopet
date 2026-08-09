/**
 * FASE 3.3 — Auditoria SIGNATURE_MISMATCH (sem imprimir secrets).
 * Compara fingerprints do secret local vs Vercel Preview e inspeciona eventos recentes.
 */
import { createHash, createHmac } from "node:crypto";
import { createRequire } from "module";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

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
    ) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}

function fp(secret) {
  const s = String(secret || "");
  if (!s) return { present: false, length: 0, sha8: null, charset: null };
  const hexLike = /^[0-9a-fA-F]+$/.test(s);
  const alnum = /^[0-9a-zA-Z_-]+$/.test(s);
  return {
    present: true,
    length: s.length,
    sha8: createHash("sha256").update(s, "utf8").digest("hex").slice(0, 8),
    charset: hexLike ? "hex" : alnum ? "alnum" : "mixed",
    hasWhitespace: /\s/.test(s),
    hasNewline: /[\r\n]/.test(s),
  };
}

const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
const verify = loadEnvFile(path.join(process.cwd(), "apps/web/.env.preview.verify"));
for (const [k, v] of Object.entries({ ...verify, ...e2e })) {
  if (!process.env[k]) process.env[k] = v;
}
for (const k of ["DATABASE_URL", "DIRECT_URL"]) {
  if (e2e[k]) process.env[k] = e2e[k];
}
if (process.env.DIRECT_URL?.startsWith("postgres")) process.env.DATABASE_URL = process.env.DIRECT_URL;

const localSecret =
  process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() ||
  verify.MERCADO_PAGO_WEBHOOK_SECRET?.trim() ||
  "";

// Pull Preview env via vercel CLI (session) into temp — never print values
let vercelSecretFp = null;
let vercelPullOk = false;
try {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ecopet-mpwh-"));
  const out = execSync(
    [
      "npx",
      "--yes",
      "vercel@58.7.1",
      "env",
      "pull",
      path.join(tmp, ".env"),
      "--environment=preview",
      "--cwd",
      "apps/web",
      "--yes",
      "--non-interactive",
    ].join(" "),
    { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], maxBuffer: 5 * 1024 * 1024 }
  );
  const pulled = loadEnvFile(path.join(tmp, ".env"));
  vercelSecretFp = fp(pulled.MERCADO_PAGO_WEBHOOK_SECRET?.trim() || "");
  vercelPullOk = true;
  // wipe
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  void out;
} catch (e) {
  vercelPullOk = false;
  vercelSecretFp = { error: String(e.stderr || e.message).slice(0, 240) };
}

const prisma = new PrismaClient();
const since = new Date(Date.now() - 60 * 60 * 1000);
const events = await prisma.mpWebhookEvent.findMany({
  where: {
    createdAt: { gte: since },
    failureCode: "SIGNATURE_MISMATCH",
  },
  orderBy: { createdAt: "desc" },
  take: 8,
});

const inspected = events.map((ev) => {
  const p = ev.sanitizedPayload && typeof ev.sanitizedPayload === "object" ? ev.sanitizedPayload : {};
  const data = p.data && typeof p.data === "object" ? p.data : {};
  const bodyId = data.id != null ? String(data.id) : null;
  const resourceId = ev.resourceId ? String(ev.resourceId) : null;
  return {
    id: String(ev.id).slice(0, 8) + "…",
    createdAt: ev.createdAt,
    eventType: ev.eventType,
    action: ev.action,
    resourceId: resourceId
      ? `${resourceId.slice(0, 8)}…${resourceId.slice(-4)}`
      : null,
    requestIdPresent: Boolean(ev.requestId),
    requestIdLen: ev.requestId ? String(ev.requestId).length : 0,
    bodyDataIdPresent: Boolean(bodyId),
    bodyDataIdCase:
      bodyId == null
        ? null
        : bodyId === bodyId.toLowerCase()
          ? "lower"
          : bodyId === bodyId.toUpperCase()
            ? "upper"
            : "mixed",
    bodyVsResourceEqual:
      bodyId && resourceId ? bodyId === resourceId || bodyId.toLowerCase() === resourceId.toLowerCase() : null,
    // We do NOT store x-signature — cannot offline-verify v1 without logs
    signatureStored: false,
    liveMode: ev.liveMode,
    processingStatus: ev.processingStatus,
  };
});

// Manifest variants checklist (documentation alignment)
const manifestRules = {
  template: "id:[data.id];request-id:[x-request-id];ts:[ts];",
  dataIdSourceOfficial: "query param data.id (NOT body alone)",
  dataIdCase: "lowercase alphanumeric before HMAC",
  algo: "HMAC-SHA256 hex",
  omitMissingFields: "if data.id or x-request-id absent, remove that segment from manifest",
  ourCodeLowercases: true,
  ourCodePrefersQueryDataId: true,
  ourCodeFallbackBody: true,
  riskIfQueryMissingButSignedWithoutId: "SIGNATURE_MISMATCH if we include body id while MP omitted id segment",
  riskIfSecretWrong: "SIGNATURE_MISMATCH even with perfect manifest",
};

const localFp = fp(localSecret);
const report = {
  localWebhookSecret: localFp,
  vercelPreviewWebhookSecret: vercelSecretFp,
  secretsMatch:
    localFp.present &&
    vercelSecretFp?.present &&
    localFp.sha8 === vercelSecretFp.sha8 &&
    localFp.length === vercelSecretFp.length,
  vercelPullOk,
  recentSignatureMismatchEvents: inspected,
  manifestRules,
  classificationHint: !vercelPullOk
    ? "CANNOT_COMPARE_SECRETS"
    : !vercelSecretFp?.present
      ? "VERCEL_SECRET_MISSING"
      : localFp.present && localFp.sha8 !== vercelSecretFp.sha8
        ? "LOCAL_VERIFY_FILE_DIFFERS_FROM_VERCEL — update local OR confirm panel secret equals Vercel Preview"
        : "SECRETS_ALIGNED_LOCALLY_WITH_VERCEL — mismatch likely wrong secret vs MP panel OR data.id query/manifest segment",
};

console.log(JSON.stringify(report, null, 2));
await prisma.$disconnect();
