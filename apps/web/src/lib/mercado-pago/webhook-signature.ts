import { createHmac, timingSafeEqual } from "crypto";
import { getMercadoPagoServerConfig } from "@/lib/mercado-pago/config";

const MAX_SKEW_MS = 5 * 60 * 1000;

/**
 * Valida assinatura oficial de webhooks Mercado Pago (x-signature + x-request-id + data.id).
 * Manifest: id:[data.id];request-id:[x-request-id];ts:[ts];
 */
export function verifyMercadoPagoWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  /** Secret opcional — usa env se omitido */
  secret?: string | null;
  nowMs?: number;
}): { valid: boolean; reason?: string; ts?: number } {
  const secret =
    params.secret?.trim() || getMercadoPagoServerConfig()?.webhookSecret || "";

  if (!secret) {
    // Em teste sem secret: não rejeita automaticamente — caller decide (WEBHOOK_PENDING)
    return { valid: false, reason: "WEBHOOK_SECRET_MISSING" };
  }

  if (!params.xSignature || !params.xRequestId || !params.dataId) {
    return { valid: false, reason: "MISSING_HEADERS" };
  }

  const parts = params.xSignature.split(",");
  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of parts) {
    const [k, v] = part.split("=").map((s) => s.trim());
    if (k === "ts") ts = v;
    if (k === "v1") v1 = v;
  }
  if (!ts || !v1) {
    return { valid: false, reason: "INVALID_SIGNATURE_FORMAT" };
  }

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) {
    return { valid: false, reason: "INVALID_TIMESTAMP" };
  }

  const now = params.nowMs ?? Date.now();
  if (Math.abs(now - tsNum) > MAX_SKEW_MS) {
    return { valid: false, reason: "TIMESTAMP_SKEW", ts: tsNum };
  }

  const dataId = params.dataId.toLowerCase();
  const manifest = `id:${dataId};request-id:${params.xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(v1, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { valid: false, reason: "SIGNATURE_MISMATCH", ts: tsNum };
    }
  } catch {
    return { valid: false, reason: "SIGNATURE_MISMATCH", ts: tsNum };
  }

  return { valid: true, ts: tsNum };
}
