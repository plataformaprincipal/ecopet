/**
 * Manual / pending provider — used when PAYMENT_PROVIDER=none|manual or keys missing.
 * Never marks paid; never calls external APIs.
 */

import type {
  CreatePaymentIntentInput,
  PaymentActionResult,
  PaymentIntentResult,
  PaymentProvider,
  PaymentStatusResult,
  PaymentWebhookEvent,
} from "@/lib/payments/payment-provider";
import { stubNormalizeWebhookEvent } from "@/lib/payments/payment-webhook";

export class ManualPaymentProvider implements PaymentProvider {
  readonly id = "manual" as const;

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      provider: this.id,
      status: "manual",
      externalId: `manual_${input.orderId}`,
      message: `Pedido #${input.orderNumber} — pagamento manual/pendente (sem gateway externo).`,
    };
  }

  async getPaymentStatus(externalId: string): Promise<PaymentStatusResult> {
    return {
      provider: this.id,
      externalId,
      status: "pending",
    };
  }

  async cancelPayment(externalId: string): Promise<PaymentActionResult> {
    return {
      provider: this.id,
      externalId,
      status: "canceled",
      message: "Pagamento manual cancelado localmente.",
    };
  }

  async refundPayment(externalId: string, _amount?: number): Promise<PaymentActionResult> {
    return {
      provider: this.id,
      externalId,
      status: "pending",
      message: "Reembolso manual exige operação administrativa — não marcado como pago/reembolsado automaticamente.",
    };
  }

  async validateWebhook(
    _headers: Headers | Record<string, string | null | undefined>,
    _body: string | Buffer
  ): Promise<boolean> {
    return false;
  }

  normalizeEvent(payload: unknown): PaymentWebhookEvent | null {
    return stubNormalizeWebhookEvent(this.id, payload);
  }
}
