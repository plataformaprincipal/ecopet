import { prisma } from "@/lib/prisma";
import { resolveActivePaymentProvider } from "@/lib/integrations/env-check";
import { INTEGRATION_ERROR_CODES, IntegrationNotConfiguredError } from "@/lib/integrations/errors";
import { writeIntegrationLog } from "@/lib/integrations/log";

export type PaymentProvider = "MERCADO_PAGO" | "PAGARME" | "STRIPE";

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
  status: "NOT_CONFIGURED" | "PENDING" | "REQUIRES_ACTION";
  checkoutUrl?: string;
};

export interface PaymentGateway {
  readonly provider: PaymentProvider;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
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

export function isPaymentGatewayConfigured(env = process.env): boolean {
  return Boolean(resolveActivePaymentProvider(env));
}

export function getConfiguredPaymentProvider(env = process.env): PaymentProvider | null {
  return resolveActivePaymentProvider(env) as PaymentProvider | null;
}

/** Não cria PIX/cartão falso — apenas registra intenção quando provedor real existir */
export async function createPaymentIntentSafe(
  input: CreatePaymentIntentInput
): Promise<PaymentIntentResult | null> {
  const provider = getConfiguredPaymentProvider();
  if (!provider) {
    await writeIntegrationLog({
      integrationName: "payment_gateway",
      provider: "none",
      action: "create_intent",
      status: "NOT_CONFIGURED",
      errorCode: INTEGRATION_ERROR_CODES.PAYMENT_GATEWAY_NOT_CONFIGURED,
      message: `Pedido #${input.orderNumber} — gateway ausente.`,
      metadata: { orderId: input.orderId },
    });
    await recordPaymentEvent({
      orderId: input.orderId,
      provider: "none",
      eventType: "CREATE_INTENT",
      status: "NOT_CONFIGURED",
      errorCode: INTEGRATION_ERROR_CODES.PAYMENT_GATEWAY_NOT_CONFIGURED,
      message: "Gateway de pagamento não configurado.",
    });
    return null;
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: input.orderId,
      provider,
      amount: input.amount,
      currency: input.currency ?? "BRL",
      status: "PENDING",
      metadata: { customerEmail: input.customerEmail },
    },
  });

  await recordPaymentEvent({
    orderId: input.orderId,
    paymentId: payment.id,
    provider,
    eventType: "CREATE_INTENT",
    status: "PENDING",
    message: "Intenção registrada — aguardando implementação Etapa 9B.",
  });

  await writeIntegrationLog({
    integrationName: "payment_gateway",
    provider,
    action: "create_intent",
    status: "PENDING",
    metadata: { orderId: input.orderId, paymentId: payment.id },
  });

  return {
    provider,
    status: "PENDING",
    externalId: undefined,
  };
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
