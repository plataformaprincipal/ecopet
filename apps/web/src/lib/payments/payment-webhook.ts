/**
 * Webhook signature validation stubs — real verification lands with each provider SDK.
 * Never mark a payment as paid from an unverified webhook.
 */

import type { PaymentProviderId, PaymentWebhookEvent } from "@/lib/payments/payment-provider";
import { PAYMENT_ERROR_CODES, PaymentError } from "@/lib/payments/payment-errors";

export type WebhookValidationInput = {
  provider: PaymentProviderId;
  headers: Headers | Record<string, string | null | undefined>;
  body: string | Buffer;
  /** Provider-specific secret when configured */
  secret?: string | null;
};

/**
 * Stub: returns false unless a secret is present and a signature header exists.
 * Does not call external APIs. Callers must reject events when this returns false.
 */
export async function validatePaymentWebhookSignature(
  input: WebhookValidationInput
): Promise<boolean> {
  if (!input.secret?.trim()) {
    return false;
  }

  const headers = input.headers;
  const get = (name: string): string | null => {
    if (typeof (headers as Headers).get === "function") {
      return (headers as Headers).get(name);
    }
    const map = headers as Record<string, string | null | undefined>;
    return map[name] ?? map[name.toLowerCase()] ?? null;
  };

  switch (input.provider) {
    case "stripe": {
      // Stripe-Signature header required — crypto verify deferred to SDK wiring
      return Boolean(get("stripe-signature") || get("Stripe-Signature"));
    }
    case "mercado_pago": {
      return Boolean(get("x-signature") || get("X-Signature"));
    }
    case "pagarme": {
      return Boolean(get("x-hub-signature") || get("X-Hub-Signature"));
    }
    case "manual":
    case "none":
    default:
      return false;
  }
}

export function assertWebhookValid(valid: boolean): void {
  if (!valid) {
    throw new PaymentError(
      PAYMENT_ERROR_CODES.INVALID_WEBHOOK,
      "Assinatura de webhook de pagamento inválida ou ausente.",
      401
    );
  }
}

/** Minimal normalize stub — providers override with real mapping. */
export function stubNormalizeWebhookEvent(
  provider: PaymentProviderId,
  payload: unknown
): PaymentWebhookEvent {
  return {
    provider,
    type: "unknown",
    raw: payload,
  };
}
