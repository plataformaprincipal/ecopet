import { createHash, createHmac, timingSafeEqual } from "crypto";
import { getMercadoPagoServerConfig } from "@/lib/mercado-pago/config";

const MAX_SKEW_MS = 5 * 60 * 1000;

export type MercadoPagoSignatureCandidate =
  | "QUERY_DATA_DOT_ID"
  | "QUERY_DATA_UNDERSCORE_ID"
  | "BODY_DATA_ID"
  | "OMITTED"
  | "SDK_ORIGINAL"
  | "DOCS_LOWERCASE"
  | "CASE_UPPER"
  | "NONE";

export type MercadoPagoSignatureDiagnostics = {
  secretLen: number;
  secretSha8: string | null;
  ts: string | null;
  v1Present: boolean;
  v1Len: number;
  requestIdPresent: boolean;
  requestIdLen: number;
  dataIdPresent: boolean;
  dataIdLen: number;
  dataIdCase: "lower" | "upper" | "mixed" | "numeric" | "empty";
  dataIdSource: MercadoPagoSignatureCandidate;
  dataIdSanitized: string | null;
  xRequestIdSha8: string | null;
  receivedV1Sha8: string | null;
  manifestSha8Primary: string | null;
  expectedHmacSha8Primary: string | null;
  receivedHmacSha8: string | null;
  candidateUsed: MercadoPagoSignatureCandidate;
  candidatesTried: number;
};

export type MercadoPagoSignatureResult = {
  valid: boolean;
  reason?: string;
  ts?: number;
  diagnostics?: MercadoPagoSignatureDiagnostics;
};

/**
 * Mercado Pago envia `ts` em segundos Unix (SDK 3.3.0).
 * Docs Orders às vezes exemplificam milissegundos.
 * Normaliza só para a janela de skew; o manifest HMAC usa o `ts` literal do header.
 */
export function mercadoPagoTsToMs(tsNum: number): number {
  return tsNum < 1e12 ? tsNum * 1000 : tsNum;
}

/**
 * Manifest oficial (SDK mercadopago@3.3.0 WebhookSignatureValidator):
 * - pares ausentes são omitidos
 * - `data.id` com case original (SDK 3.3.0+ não força lowercase)
 * - termina com `;`
 */
export function buildMercadoPagoWebhookManifest(params: {
  dataId?: string | null;
  requestId?: string | null;
  ts: string;
}): string {
  const parts: string[] = [];
  const dataId = params.dataId?.trim();
  const requestId = params.requestId?.trim();
  if (dataId) parts.push(`id:${dataId}`);
  if (requestId) parts.push(`request-id:${requestId}`);
  parts.push(`ts:${params.ts}`);
  return `${parts.join(";")};`;
}

function sha8(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 8);
}

function sanitizeId(id: string | null | undefined): string | null {
  if (id == null || id === "") return null;
  const s = String(id);
  return s.length <= 12 ? s : `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function classifyDataIdCase(id: string | null): MercadoPagoSignatureDiagnostics["dataIdCase"] {
  if (!id) return "empty";
  if (/^\d+$/.test(id)) return "numeric";
  if (id === id.toLowerCase()) return "lower";
  if (id === id.toUpperCase()) return "upper";
  return "mixed";
}

/** Trim + decodeURIComponent só se houver %XX — sem alterar case. */
export function normalizeMercadoPagoDataId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  try {
    if (/%[0-9a-fA-F]{2}/.test(s)) {
      s = decodeURIComponent(s);
    }
  } catch {
    /* keep raw trimmed */
  }
  return s.trim() || null;
}

function resolveSecret(explicit?: string | null): string {
  if (explicit !== undefined && explicit !== null) {
    return String(explicit).trim();
  }
  return (
    getMercadoPagoServerConfig()?.webhookSecret ||
    process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() ||
    ""
  );
}

/**
 * Valida assinatura oficial (alinhado a WebhookSignatureValidator SDK 3.3.0).
 * Primário: case original do data.id da query.
 * Secundário (docs Orders legadas): lowercase alfanumérico — não inventa outros manifests.
 */
export function verifyMercadoPagoWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  dataIdSource?: MercadoPagoSignatureCandidate;
  /** Secret opcional — usa env se omitido */
  secret?: string | null;
  nowMs?: number;
}): MercadoPagoSignatureResult {
  const secret = resolveSecret(params.secret);
  const dataIdSource = params.dataIdSource ?? (params.dataId ? "SDK_ORIGINAL" : "OMITTED");

  const emptyDiag = (): MercadoPagoSignatureDiagnostics => {
    const dataIdRaw = normalizeMercadoPagoDataId(params.dataId);
    const req = params.xRequestId?.trim() || null;
    return {
      secretLen: secret.length,
      secretSha8: secret ? sha8(secret) : null,
      ts: null,
      v1Present: false,
      v1Len: 0,
      requestIdPresent: Boolean(req),
      requestIdLen: req?.length ?? 0,
      dataIdPresent: Boolean(dataIdRaw),
      dataIdLen: dataIdRaw?.length ?? 0,
      dataIdCase: classifyDataIdCase(dataIdRaw),
      dataIdSource,
      dataIdSanitized: sanitizeId(dataIdRaw),
      xRequestIdSha8: req ? sha8(req) : null,
      receivedV1Sha8: null,
      manifestSha8Primary: null,
      expectedHmacSha8Primary: null,
      receivedHmacSha8: null,
      candidateUsed: "NONE",
      candidatesTried: 0,
    };
  };

  if (!secret) {
    return { valid: false, reason: "WEBHOOK_SECRET_MISSING", diagnostics: emptyDiag() };
  }

  if (!params.xSignature) {
    return { valid: false, reason: "MISSING_HEADERS", diagnostics: emptyDiag() };
  }

  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of params.xSignature.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim().toLowerCase();
    const v = part.slice(eq + 1).trim();
    if (k === "ts") ts = v;
    if (k === "v1") v1 = v;
  }
  if (!ts || !v1) {
    return {
      valid: false,
      reason: "INVALID_SIGNATURE_FORMAT",
      diagnostics: { ...emptyDiag(), ts: ts ?? null, v1Present: Boolean(v1), v1Len: v1?.length ?? 0 },
    };
  }

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) {
    return {
      valid: false,
      reason: "INVALID_TIMESTAMP",
      diagnostics: { ...emptyDiag(), ts, v1Present: true, v1Len: v1.length },
    };
  }

  const now = params.nowMs ?? Date.now();
  const tsMs = mercadoPagoTsToMs(tsNum);
  if (Math.abs(now - tsMs) > MAX_SKEW_MS) {
    return {
      valid: false,
      reason: "TIMESTAMP_SKEW",
      ts: tsNum,
      diagnostics: { ...emptyDiag(), ts, v1Present: true, v1Len: v1.length },
    };
  }

  const requestId = params.xRequestId?.trim() || null;
  const dataIdRaw = normalizeMercadoPagoDataId(params.dataId);

  // SDK 3.3.0: um manifest com case original. Docs Orders (legado): lowercase.
  const attempts: Array<{ label: MercadoPagoSignatureCandidate; dataId: string | null }> = [
    { label: dataIdRaw ? "SDK_ORIGINAL" : "OMITTED", dataId: dataIdRaw },
  ];
  if (dataIdRaw && /[A-Za-z]/.test(dataIdRaw) && dataIdRaw !== dataIdRaw.toLowerCase()) {
    attempts.push({ label: "DOCS_LOWERCASE", dataId: dataIdRaw.toLowerCase() });
  }

  const uniqueAttempts: typeof attempts = [];
  const seenManifest = new Set<string>();
  for (const a of attempts) {
    const manifest = buildMercadoPagoWebhookManifest({
      dataId: a.dataId,
      requestId,
      ts,
    });
    if (seenManifest.has(manifest)) continue;
    seenManifest.add(manifest);
    uniqueAttempts.push(a);
  }

  const primaryManifest = buildMercadoPagoWebhookManifest({
    dataId: dataIdRaw,
    requestId,
    ts,
  });
  const expectedPrimary = createHmac("sha256", secret).update(primaryManifest).digest("hex");

  const diagnostics: MercadoPagoSignatureDiagnostics = {
    secretLen: secret.length,
    secretSha8: sha8(secret),
    ts,
    v1Present: true,
    v1Len: v1.length,
    requestIdPresent: Boolean(requestId),
    requestIdLen: requestId?.length ?? 0,
    dataIdPresent: Boolean(dataIdRaw),
    dataIdLen: dataIdRaw?.length ?? 0,
    dataIdCase: classifyDataIdCase(dataIdRaw),
    dataIdSource,
    dataIdSanitized: sanitizeId(dataIdRaw),
    xRequestIdSha8: requestId ? sha8(requestId) : null,
    receivedV1Sha8: sha8(v1),
    manifestSha8Primary: sha8(primaryManifest),
    expectedHmacSha8Primary: sha8(expectedPrimary),
    receivedHmacSha8: sha8(v1),
    candidateUsed: "NONE",
    candidatesTried: uniqueAttempts.length,
  };

  try {
    const provided = Buffer.from(v1, "utf8");
    for (const a of uniqueAttempts) {
      const manifest = buildMercadoPagoWebhookManifest({
        dataId: a.dataId,
        requestId,
        ts,
      });
      const expected = createHmac("sha256", secret).update(manifest).digest("hex");
      const buf = Buffer.from(expected, "utf8");
      if (buf.length === provided.length && timingSafeEqual(buf, provided)) {
        return {
          valid: true,
          ts: tsNum,
          diagnostics: {
            ...diagnostics,
            candidateUsed: a.label,
            manifestSha8Primary: sha8(manifest),
            expectedHmacSha8Primary: sha8(expected),
          },
        };
      }
    }
  } catch {
    return { valid: false, reason: "SIGNATURE_MISMATCH", ts: tsNum, diagnostics };
  }

  if (!requestId && !dataIdRaw) {
    return { valid: false, reason: "MISSING_HEADERS", ts: tsNum, diagnostics };
  }

  return { valid: false, reason: "SIGNATURE_MISMATCH", ts: tsNum, diagnostics };
}

/** Formata diagnostics para log/DB — sem secret e sem HMAC completo. */
export function formatSignatureDiagnostics(
  d: MercadoPagoSignatureDiagnostics | undefined
): string {
  if (!d) return "diag=none";
  return [
    `secretLen=${d.secretLen}`,
    `secretSha8=${d.secretSha8 ?? "none"}`,
    `ts=${d.ts ?? "none"}`,
    `v1=${d.v1Present ? 1 : 0}`,
    `v1Len=${d.v1Len}`,
    `reqId=${d.requestIdPresent ? 1 : 0}`,
    `reqLen=${d.requestIdLen}`,
    `reqSha8=${d.xRequestIdSha8 ?? "none"}`,
    `dataIdPresent=${d.dataIdPresent ? 1 : 0}`,
    `dataIdLen=${d.dataIdLen}`,
    `dataIdCase=${d.dataIdCase}`,
    `dataIdSrc=${d.dataIdSource}`,
    `dataId=${d.dataIdSanitized ?? "none"}`,
    `recvV1Sha8=${d.receivedV1Sha8 ?? "none"}`,
    `manifestSha8=${d.manifestSha8Primary ?? "none"}`,
    `expHmacSha8=${d.expectedHmacSha8Primary ?? "none"}`,
    `recvHmacSha8=${d.receivedHmacSha8 ?? "none"}`,
    `candidate=${d.candidateUsed}`,
    `candidates=${d.candidatesTried}`,
  ].join(" ");
}
