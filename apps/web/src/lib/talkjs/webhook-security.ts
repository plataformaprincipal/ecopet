import { createHmac, timingSafeEqual, createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { getTalkJsPrivateConfig, isMessagingFlagEnabled } from "./config";

/**
 * Verifica assinatura TalkJS:
 * HMAC-SHA256(timestamp + '.' + rawBody) em hex MAIÚSCULO.
 * Secret: TALKJS_WEBHOOK_SECRET (preferido) ou TALKJS_SECRET_KEY (test).
 */
export function verifyTalkJsWebhookSignature(input: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
}): { ok: boolean; reason?: string } {
  const priv = getTalkJsPrivateConfig();
  const secret = priv.webhookSecret ?? priv.secretKey;
  if (!secret) return { ok: false, reason: "secret_missing" };

  if (!isMessagingFlagEnabled("webhooks")) {
    return { ok: false, reason: "webhooks_disabled" };
  }

  if (priv.environment === "production" && !priv.webhookSecret) {
    return { ok: false, reason: "webhook_secret_required_in_production" };
  }

  const strict =
    process.env.TALKJS_WEBHOOK_VERIFY === "1" ||
    Boolean(priv.webhookSecret) ||
    priv.environment === "production";

  if (!strict) {
    return { ok: true, reason: "dev_unverified" };
  }

  if (!input.signature || !input.timestamp) {
    return { ok: false, reason: "signature_or_timestamp_missing" };
  }

  const tsRaw = Number(input.timestamp);
  if (!Number.isFinite(tsRaw)) {
    return { ok: false, reason: "timestamp_invalid" };
  }
  const tsMs = tsRaw < 1e12 ? tsRaw * 1000 : tsRaw;
  if (Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
    return { ok: false, reason: "timestamp_out_of_window" };
  }

  const payload = `${input.timestamp}.${input.rawBody}`;
  const expected = createHmac("sha256", secret).update(payload, "utf8").digest("hex").toUpperCase();
  const received = input.signature.trim().toUpperCase();

  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(received);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "signature_mismatch" };
    }
  } catch {
    return { ok: false, reason: "signature_compare_failed" };
  }

  return { ok: true };
}

export function hashWebhookPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

export function buildWebhookIdempotencyKey(externalId: string | null, payloadHash: string): string {
  return `talkjs:${externalId ?? "noext"}:${payloadHash}`;
}

export type SanitizedWebhookPayload = Prisma.InputJsonValue;
