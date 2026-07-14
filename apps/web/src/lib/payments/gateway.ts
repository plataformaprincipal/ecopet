/**
 * Payment gateway façade — keeps checkout-compatible exports while delegating
 * to the Phase 11 payment architecture (payment-service + providers).
 *
 * Never marks payments as paid without a verified provider webhook.
 */

import { prisma } from "@/lib/prisma";
import { resolveActivePaymentProvider } from "@/lib/integrations/env-check";
import { INTEGRATION_ERROR_CODES, IntegrationNotConfiguredError } from "@/lib/integrations/errors";
import { writeIntegrationLog } from "@/lib/integrations/log";
import {
  createPaymentIntent as createPaymentIntentViaService,
  isManualOrNonePaymentMode,
  resolvePaymentProvider,
} from "@/lib/payments/payment-service";
import type { CreatePaymentIntentInput as ServiceCreateInput } from "@/lib/payments/payment-provider";
import { toLegacyProviderId } from "@/lib/payments/payment-provider";

/** Legacy uppercase provider ids stored on Payment rows */
export type PaymentProvider = "MERCADO_PAGO" | "PAGARME" | "STRIPE" | "MANUAL";

export type CreatePaymentIntentInput = {
  orderId: string;
  orderNumber: number;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName: string;
  metadata?: Record<string, string>;
};

export type PaymentIntentResult = {
  provider: PaymentProvider;
  externalId?: string;
  status: "NOT_CONFIGURED" | "PENDING" | "REQUIRES_ACTION" | "MANUAL";
  checkoutUrl?: string;
  message?: string;
};

export interface PaymentGateway {
  readonly provider: PaymentProvider;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
}

function mapServiceStatus(
  status: import("@/lib/payments/payment-provider").PaymentIntentStatus
): PaymentIntentResult["status"] {
  switch (status) {
    case "not_configured":
      return "NOT_CONFIGURED";
    case "requires_action":
      return "REQUIRES_ACTION";
    case "manual":
      return "MANUAL";
    default:
      return "PENDING";
  }
}

function mapServiceResult(
  result: import("@/lib/payments/payment-provider").PaymentIntentResult
): PaymentIntentResult {
  const legacy = toLegacyProviderId(result.provider);
  return {
    provider: legacy === "NONE" ? "MANUAL" : (legacy as PaymentProvider),
    externalId: result.externalId,
    status: mapServiceStatus(result.status),
    checkoutUrl: result.checkoutUrl,
    message: result.message,
  };
}

async function recordPaymentEvent(params: {
  orderId: string;
  provider: string;
  eventType: string;
  status: string;
  errorCode?: string;
  message?: string;
  paymentId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.paymentEvent.create({
      data: {
        orderId: params.orderId,
        paymentId: params.paymentId,
        provider: params.provider,
        eventType: params.eventType,
        status: params.status,
        errorCode: params.errorCode,
        message: params.message,
        metadata: params.metadata as object | undefined,
      },
    });
  } catch {
    /* não quebrar fluxo */
  }
}

/** True when a real external gateway has credentials (not manual/none). */
export function isPaymentGatewayConfigured(env = process.env): boolean {
  if (isManualOrNonePaymentMode(env)) return false;
  return Boolean(resolveActivePaymentProvider(env));
}

export function getConfiguredPaymentProvider(env = process.env): PaymentProvider | null {
  if (isManualOrNonePaymentMode(env)) return null;
  const active = resolveActivePaymentProvider(env);
  return (active as PaymentProvider | null) ?? null;
}

/**
 * Creates a payment intent safely for checkout.
 * - PAYMENT_PROVIDER=none|manual|missing keys → MANUAL/PENDING, never paid, no external APIs
 * - Configured external provider → delegates to architecture (still never marks paid here)
 */
export async function createPaymentIntentSafe(
  input: CreatePaymentIntentInput
): Promise<PaymentIntentResult | null> {
  const serviceInput: ServiceCreateInput = { ...input };
  const mapped = mapServiceResult(await createPaymentIntentViaService(serviceInput));
  const legacyProvider = mapped.provider;

  const dbStatus =
    mapped.status === "NOT_CONFIGURED"
      ? "NOT_CONFIGURED"
      : mapped.status === "MANUAL"
        ? "PENDING"
        : "PENDING";

  try {
    const payment = await prisma.payment.create({
      data: {
        orderId: input.orderId,
        provider: legacyProvider,
        amount: input.amount,
        currency: input.currency ?? "BRL",
        // Never SUCCEEDED/PAID from create intent alone
        status: "PENDING",
        externalId: mapped.externalId,
        metadata: {
          customerEmail: input.customerEmail,
          intentStatus: mapped.status,
          note: mapped.message,
        },
      },
    });

    await recordPaymentEvent({
      orderId: input.orderId,
      paymentId: payment.id,
      provider: legacyProvider,
      eventType: "CREATE_INTENT",
      status: dbStatus,
      errorCode:
        mapped.status === "NOT_CONFIGURED"
          ? INTEGRATION_ERROR_CODES.PAYMENT_GATEWAY_NOT_CONFIGURED
          : undefined,
      message:
        mapped.message ??
        "Intenção registrada — nunca marcada como paga sem webhook do provedor.",
    });

    await writeIntegrationLog({
      integrationName: "payment_gateway",
      provider: legacyProvider,
      action: "create_intent",
      status: dbStatus,
      errorCode:
        mapped.status === "NOT_CONFIGURED"
          ? INTEGRATION_ERROR_CODES.PAYMENT_GATEWAY_NOT_CONFIGURED
          : undefined,
      message: mapped.message,
      metadata: { orderId: input.orderId, paymentId: payment.id },
    });
  } catch {
    await recordPaymentEvent({
      orderId: input.orderId,
      provider: legacyProvider,
      eventType: "CREATE_INTENT",
      status: dbStatus,
      message: mapped.message,
    });
  }

  return mapped;
}

export async function assertPaymentGatewayConfigured(): Promise<PaymentProvider> {
  const provider = getConfiguredPaymentProvider();
  if (!provider) {
    throw new IntegrationNotConfiguredError(
      INTEGRATION_ERROR_CODES.PAYMENT_GATEWAY_NOT_CONFIGURED,
      "Gateway de pagamento não configurado."
    );
  }
  return provider;
}

/** Expose architecture provider for advanced callers */
export { resolvePaymentProvider };
