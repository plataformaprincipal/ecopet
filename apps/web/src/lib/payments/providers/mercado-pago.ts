/**
 * Mercado Pago provider — structure ready; returns not_configured without token.
 * Never calls Mercado Pago APIs when MERCADO_PAGO_ACCESS_TOKEN is missing.
 */

import type {
  CreatePaymentIntentInput,
  PaymentActionResult,
  PaymentIntentResult,
  PaymentProvider,
  PaymentStatusResult,
  PaymentWebhookEvent,
} from "@/lib/payments/payment-provider";
import { PaymentNotConfiguredError } from "@/lib/payments/payment-errors";
import {
  stubNormalizeWebhookEvent,
  validatePaymentWebhookSignature,
} from "@/lib/payments/payment-webhook";

function hasAccessToken(env = process.env): boolean {
  return Boolean(env.MERCADO_PAGO_ACCESS_TOKEN?.trim());
}

export class MercadoPagoPaymentProvider implements PaymentProvider {
  readonly id = "mercado_pago" as const;

  async createPaymentIntent(_input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    if (!hasAccessToken()) {
      return {
        provider: this.id,
        status: "not_configured",
        message: "MERCADO_PAGO_ACCESS_TOKEN ausente — nenhuma cobrança criada.",
      };
    }
    // SDK wiring deferred — do not call external APIs or mark paid yet
    return {
      provider: this.id,
      status: "pending",
      message: "Mercado Pago token presente, mas createPaymentIntent ainda não está ligado ao SDK.",
    };
  }

  async getPaymentStatus(externalId: string): Promise<PaymentStatusResult> {
    if (!hasAccessToken()) {
      throw new PaymentNotConfiguredError("Mercado Pago não configurado.");
    }
    return { provider: this.id, externalId, status: "pending" };
  }

  async cancelPayment(externalId: string): Promise<PaymentActionResult> {
    if (!hasAccessToken()) {
      throw new PaymentNotConfiguredError("Mercado Pago não configurado.");
    }
    return {
      provider: this.id,
      externalId,
      status: "pending",
      message: "Cancelamento Mercado Pago ainda não implementado via SDK.",
    };
  }

  async refundPayment(externalId: string, _amount?: number): Promise<PaymentActionResult> {
    if (!hasAccessToken()) {
      throw new PaymentNotConfiguredError("Mercado Pago não configurado.");
    }
    return {
      provider: this.id,
      externalId,
      status: "pending",
      message: "Reembolso Mercado Pago ainda não implementado via SDK.",
    };
  }

  async validateWebhook(
    headers: Headers | Record<string, string | null | undefined>,
    body: string | Buffer
  ): Promise<boolean> {
    return validatePaymentWebhookSignature({
      provider: this.id,
      headers,
      body,
      secret: process.env.MERCADO_PAGO_WEBHOOK_SECRET,
    });
  }

  normalizeEvent(payload: unknown): PaymentWebhookEvent | null {
    if (!payload || typeof payload !== "object") return null;
    return stubNormalizeWebhookEvent(this.id, payload);
  }
}
