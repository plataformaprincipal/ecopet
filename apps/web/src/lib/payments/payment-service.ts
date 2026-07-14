/**
 * Payment service — resolves active provider and orchestrates intents.
 * PAYMENT_PROVIDER=none|manual|missing keys → ManualPaymentProvider (never marks paid).
 */

import {
  isMercadoPagoConfigured,
  isPagarmeConfigured,
  isStripeConfigured,
} from "@/lib/integrations/env-check";
import type {
  CreatePaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
  PaymentProviderId,
} from "@/lib/payments/payment-provider";
import { ManualPaymentProvider } from "@/lib/payments/providers/manual";
import { MercadoPagoPaymentProvider } from "@/lib/payments/providers/mercado-pago";
import { StripePaymentProvider } from "@/lib/payments/providers/stripe";

function envPreferred(source: NodeJS.ProcessEnv = process.env): string | undefined {
  const v = source.PAYMENT_PROVIDER;
  return typeof v === "string" && v.trim() ? v.trim().toLowerCase() : undefined;
}

/** True when env asks for no external gateway. */
export function isManualOrNonePaymentMode(env: NodeJS.ProcessEnv = process.env): boolean {
  const preferred = envPreferred(env);
  return !preferred || preferred === "none" || preferred === "manual";
}

/**
 * Resolves which provider implementation to use.
 * Missing keys / none / manual → ManualPaymentProvider (pending/manual, no external calls).
 */
export function resolvePaymentProvider(env: NodeJS.ProcessEnv = process.env): PaymentProvider {
  const preferred = envPreferred(env);

  if (!preferred || preferred === "none" || preferred === "manual") {
    return new ManualPaymentProvider();
  }

  if (preferred === "mercado_pago" || preferred === "mercadopago") {
    if (isMercadoPagoConfigured(env)) return new MercadoPagoPaymentProvider();
    return new ManualPaymentProvider();
  }

  if (preferred === "stripe") {
    if (isStripeConfigured(env)) return new StripePaymentProvider();
    return new ManualPaymentProvider();
  }

  if (preferred === "pagarme") {
    // Pagarme adapter not fully wired — fall back to manual rather than fake paid
    if (isPagarmeConfigured(env)) return new ManualPaymentProvider();
    return new ManualPaymentProvider();
  }

  // Auto-detect configured gateway; otherwise manual
  if (isMercadoPagoConfigured(env)) return new MercadoPagoPaymentProvider();
  if (isStripeConfigured(env)) return new StripePaymentProvider();
  return new ManualPaymentProvider();
}

export function getActivePaymentProviderId(env: NodeJS.ProcessEnv = process.env): PaymentProviderId {
  return resolvePaymentProvider(env).id;
}

/**
 * Creates a payment intent via the resolved provider.
 * Guarantees: never returns status "paid"; never calls external APIs in manual/none mode.
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
  env: NodeJS.ProcessEnv = process.env
): Promise<PaymentIntentResult> {
  const provider = resolvePaymentProvider(env);
  const result = await provider.createPaymentIntent(input);

  // Hard guard: architecture must never report paid from createPaymentIntent alone
  if (result.status === "paid") {
    return {
      ...result,
      status: "pending",
      message: result.message ?? "Status paid bloqueado em createPaymentIntent — aguardar webhook.",
    };
  }

  return result;
}

export function getPaymentProvider(env: NodeJS.ProcessEnv = process.env): PaymentProvider {
  return resolvePaymentProvider(env);
}
