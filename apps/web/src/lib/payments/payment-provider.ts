/**
 * PaymentProvider contract — all gateways implement this interface.
 * External providers must return NOT_CONFIGURED / pending when keys are missing
 * and must never report paid without a verified provider webhook.
 */

export type PaymentProviderId =
  | "manual"
  | "mercado_pago"
  | "stripe"
  | "pagarme"
  | "none";

/** Legacy uppercase ids used by Payment rows / gateway.ts */
export type LegacyPaymentProviderId = "MERCADO_PAGO" | "PAGARME" | "STRIPE" | "MANUAL" | "NONE";

export type PaymentIntentStatus =
  | "pending"
  | "manual"
  | "requires_action"
  | "not_configured"
  | "canceled"
  | "refunded"
  | "failed"
  | "paid";

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
  provider: PaymentProviderId;
  externalId?: string;
  status: PaymentIntentStatus;
  checkoutUrl?: string;
  message?: string;
};

export type PaymentStatusResult = {
  provider: PaymentProviderId;
  externalId: string;
  status: PaymentIntentStatus;
  raw?: unknown;
};

export type PaymentActionResult = {
  provider: PaymentProviderId;
  externalId: string;
  status: PaymentIntentStatus;
  message?: string;
};

export type PaymentWebhookEvent = {
  provider: PaymentProviderId;
  type: string;
  externalId?: string;
  status?: PaymentIntentStatus;
  raw: unknown;
};

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  getPaymentStatus(externalId: string): Promise<PaymentStatusResult>;
  cancelPayment(externalId: string): Promise<PaymentActionResult>;
  refundPayment(externalId: string, amount?: number): Promise<PaymentActionResult>;
  validateWebhook(
    headers: Headers | Record<string, string | null | undefined>,
    body: string | Buffer
  ): Promise<boolean>;
  normalizeEvent(payload: unknown): PaymentWebhookEvent | null;
}

export function toLegacyProviderId(id: PaymentProviderId): LegacyPaymentProviderId {
  switch (id) {
    case "mercado_pago":
      return "MERCADO_PAGO";
    case "stripe":
      return "STRIPE";
    case "pagarme":
      return "PAGARME";
    case "manual":
      return "MANUAL";
    case "none":
    default:
      return "NONE";
  }
}

export function fromLegacyProviderId(id: string): PaymentProviderId {
  switch (id.toUpperCase()) {
    case "MERCADO_PAGO":
      return "mercado_pago";
    case "STRIPE":
      return "stripe";
    case "PAGARME":
      return "pagarme";
    case "MANUAL":
      return "manual";
    default:
      return "none";
  }
}
