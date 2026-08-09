/**
 * Auditoria sanitizada application_id / live_mode / user_id
 * Simulador × Natural × contexto de credenciais. Sem secrets.
 */
import { createRequire } from "module";
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
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
  return s.length <= 14 ? s : `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function sha8(v) {
  return createHash("sha256").update(String(v), "utf8").digest("hex").slice(0, 8);
}

function prefix(v, n = 10) {
  if (!v) return null;
  return String(v).slice(0, n);
}

const e2e = loadEnvFile(path.join(process.cwd(), "apps/web/.env.e2e.local"));
const verify = loadEnvFile(path.join(process.cwd(), "apps/web/.env.preview.verify"));
for (const [k, v] of Object.entries({ ...verify, ...e2e })) {
  if (!process.env[k]) process.env[k] = v;
}
for (const k of ["DATABASE_URL", "DIRECT_URL"]) if (e2e[k]) process.env[k] = e2e[k];
if (process.env.DIRECT_URL?.startsWith("postgres")) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const prisma = new PrismaClient();

try {
  // NATURAL: Order da última prova
  const naturalOrderId = "ORDTST01KZJJ1W6BXHNN3X9EFMR1A1MH";
  const naturalEvents = await prisma.mpWebhookEvent.findMany({
    where: { resourceId: naturalOrderId },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  // SIMULATOR: eventos com resourceId 123456 ou payload data.id 123456
  const simEvents = await prisma.mpWebhookEvent.findMany({
    where: {
      OR: [
        { resourceId: "123456" },
        { failureReason: { contains: "source=SIMULATOR" } },
        { failureReason: { contains: "queryDataDotId=123456" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Logs SIGNATURE_OK / SIGNATURE_MISMATCH recentes
  const logs = await prisma.platformIntegrationLog.findMany({
    where: {
      provider: "mercado_pago",
      action: "webhook:signature",
      createdAt: { gte: new Date("2026-08-09T05:59:00.000Z") },
    },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { createdAt: true, status: true, message: true },
  });

  // Payment/Order local da natural
  const payment = await prisma.payment.findFirst({
    where: { providerOrderId: naturalOrderId },
    select: {
      id: true,
      providerOrderId: true,
      providerPaymentId: true,
      externalReference: true,
      environment: true,
      amount: true,
      status: true,
      createdAt: true,
      metadata: true,
    },
  });

  // Credenciais locais (só metadados)
  const access = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
  const pub =
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
    process.env.MERCADO_PAGO_PUBLIC_KEY ||
    "";
  const envName = process.env.MERCADO_PAGO_ENVIRONMENT || null;
  const whPresent = Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET);
  const whSha8 = whPresent
    ? sha8(String(process.env.MERCADO_PAGO_WEBHOOK_SECRET).trim())
    : null;

  // Tentar extrair application_id de snapshots / sanitizedPayload
  function pickApp(ev) {
    const p = ev?.sanitizedPayload;
    if (!p || typeof p !== "object") return { applicationId: ev?.applicationId ?? null, userId: ev?.mpUserId ?? null, liveMode: ev?.liveMode ?? null, type: ev?.eventType ?? null, apiVersion: p?.api_version ?? null, action: ev?.action ?? null };
    return {
      applicationId: ev?.applicationId ?? p.application_id ?? null,
      userId: ev?.mpUserId ?? p.user_id ?? null,
      liveMode: ev?.liveMode ?? p.live_mode ?? null,
      type: ev?.eventType ?? p.type ?? null,
      apiVersion: p.api_version ?? null,
      action: ev?.action ?? p.action ?? null,
      dataId: p?.data?.id ?? ev?.resourceId ?? null,
    };
  }

  // Snapshots MP se existirem
  const snapshots = await prisma.mpResourceSnapshot
    .findMany({
      where: { resourceId: naturalOrderId },
      orderBy: { fetchedAt: "desc" },
      take: 3,
      select: { resourceId: true, source: true, sanitizedBody: true, fetchedAt: true },
    })
    .catch(() => []);

  const simLatest =
    simEvents.find((e) => String(e.resourceId) === "123456") || simEvents[0] || null;
  const natLatest = naturalEvents[0] || null;

  const sim = simLatest ? pickApp(simLatest) : null;
  const nat = natLatest ? pickApp(natLatest) : null;

  // Se simulador não tem evento DB recente, tentar do log não tem application_id —
  // buscar qualquer evento 123456 mais antigo com payload
  let simFromDb = sim;
  if (!simFromDb?.applicationId) {
    const older = await prisma.mpWebhookEvent.findFirst({
      where: { resourceId: "123456" },
      orderBy: { createdAt: "desc" },
    });
    if (older) simFromDb = pickApp(older);
  }

  const out = {
    credentialContext: {
      mercadoPagoEnvironment: envName,
      accessTokenPrefix: access ? prefix(access, 12) : null,
      accessTokenKind: access.startsWith("TEST-")
        ? "TEST"
        : access.startsWith("APP_USR-")
          ? "APP_USR"
          : access
            ? "OTHER"
            : "MISSING",
      publicKeyPrefix: pub ? prefix(pub, 10) : null,
      webhookSecretPresent: whPresent,
      webhookSecretSha8: whSha8,
      note: "Valores locais de .env.e2e.local / .env.preview.verify — runtime Preview deve espelhar Preview env",
    },
    simulator: simFromDb
      ? {
          eventId: sanitizeId(simLatest?.id || null),
          createdAt: simLatest?.createdAt || null,
          application_id: simFromDb.applicationId,
          user_id: simFromDb.userId,
          live_mode: simFromDb.liveMode,
          type: simFromDb.type,
          api_version: simFromDb.apiVersion,
          action: simFromDb.action,
          data_id: sanitizeId(simFromDb.dataId || "123456"),
          signatureValid: simLatest?.signatureValid ?? null,
          failureCode: simLatest?.failureCode ?? null,
        }
      : { note: "sem MpWebhookEvent 123456; ver logs SIGNATURE_OK" },
    natural: nat
      ? {
          eventId: sanitizeId(natLatest.id),
          createdAt: natLatest.createdAt,
          application_id: nat.applicationId,
          user_id: nat.userId,
          live_mode: nat.liveMode,
          type: nat.type,
          api_version: nat.apiVersion,
          action: nat.action,
          data_id: sanitizeId(nat.dataId || naturalOrderId),
          signatureValid: natLatest.signatureValid,
          failureCode: natLatest.failureCode,
          requestId: sanitizeId(natLatest.requestId),
          failureReason: natLatest.failureReason,
          sigDiag: natLatest.sanitizedPayload?._sigDiag || null,
        }
      : { note: "natural event missing" },
    paymentLocal: payment
      ? {
          paymentId: sanitizeId(payment.id),
          providerOrderId: sanitizeId(payment.providerOrderId),
          providerPaymentId: sanitizeId(payment.providerPaymentId),
          externalReference: payment.externalReference,
          environment: payment.environment,
          amount: payment.amount,
          status: payment.status,
          metadataKeys:
            payment.metadata && typeof payment.metadata === "object"
              ? Object.keys(payment.metadata)
              : [],
          metadataAppId:
            payment.metadata && typeof payment.metadata === "object"
              ? payment.metadata.application_id ||
                payment.metadata.applicationId ||
                payment.metadata.collector_id ||
                null
              : null,
        }
      : null,
    snapshots: snapshots.map((s) => ({
      source: s.source,
      fetchedAt: s.fetchedAt,
      appId:
        s.sanitizedBody && typeof s.sanitizedBody === "object"
          ? s.sanitizedBody.application_id ||
            s.sanitizedBody.applicationId ||
            null
          : null,
      userId:
        s.sanitizedBody && typeof s.sanitizedBody === "object"
          ? s.sanitizedBody.user_id || s.sanitizedBody.collector_id || null
          : null,
      liveMode:
        s.sanitizedBody && typeof s.sanitizedBody === "object"
          ? s.sanitizedBody.live_mode ?? null
          : null,
    })),
    recentSignatureLogs: logs.map((l) => ({
      createdAt: l.createdAt,
      status: l.status,
      message: l.message,
    })),
    allNaturalEvents: naturalEvents.map((e) => ({
      createdAt: e.createdAt,
      applicationId: e.applicationId,
      mpUserId: e.mpUserId,
      liveMode: e.liveMode,
      signatureValid: e.signatureValid,
      failureCode: e.failureCode,
      action: e.action,
      api_version:
        e.sanitizedPayload && typeof e.sanitizedPayload === "object"
          ? e.sanitizedPayload.api_version ?? null
          : null,
    })),
    allSimEventsSample: simEvents.slice(0, 5).map((e) => ({
      createdAt: e.createdAt,
      resourceId: sanitizeId(e.resourceId),
      applicationId: e.applicationId,
      mpUserId: e.mpUserId,
      liveMode: e.liveMode,
      signatureValid: e.signatureValid,
      failureCode: e.failureCode,
      action: e.action,
      api_version:
        e.sanitizedPayload && typeof e.sanitizedPayload === "object"
          ? e.sanitizedPayload.api_version ?? null
          : null,
    })),
  };

  const outPath = path.join(process.cwd(), "scripts/_tmp-app-id-audit-result.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
} finally {
  await prisma.$disconnect();
}
