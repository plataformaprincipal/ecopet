/**
 * Stripe provider — structure ready; returns not_configured without secret key.
 * Never calls Stripe APIs when STRIPE_SECRET_KEY is missing.
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

function hasSecretKey(env = process.env): boolean {
  return Boolean(env.STRIPE_SECRET_KEY?.trim());
}

export class StripePaymentProvider implements PaymentProvider {
  readonly id = "stripe" as const;

  async createPaymentIntent(_input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    if (!hasSecretKey()) {
      return {
        provider: this.id,
        status: "not_configured",
        message: "STRIPE_SECRET_KEY ausente — nenhuma cobrança criada.",
      };
    }
    // SDK wiring deferred — do not call external APIs or mark paid yet
    return {
      provider: this.id,
      status: "pending",
      message: "Stripe key presente, mas createPaymentIntent ainda não está ligado ao SDK.",
    };
  }

  async getPaymentStatus(externalId: string): Promise<PaymentStatusResult> {
    if (!hasSecretKey()) {
      throw new PaymentNotConfiguredError("Stripe não configurado.");
    }
    return { provider: this.id, externalId, status: "pending" };
  }

  async cancelPayment(externalId: string): Promise<PaymentActionResult> {
    if (!hasSecretKey()) {
      throw new PaymentNotConfiguredError("Stripe não configurado.");
    }
    return {
      provider: this.id,
      externalId,
      status: "pending",
      message: "Cancelamento Stripe ainda não implementado via SDK.",
    };
  }

  async refundPayment(externalId: string, _amount?: number): Promise<PaymentActionResult> {
    if (!hasSecretKey()) {
      throw new PaymentNotConfiguredError("Stripe não configurado.");
    }
    return {
      provider: this.id,
      externalId,
      status: "pending",
      message: "Reembolso Stripe ainda não implementado via SDK.",
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
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });
  }

  normalizeEvent(payload: unknown): PaymentWebhookEvent | null {
    if (!payload || typeof payload !== "object") return null;
    return stubNormalizeWebhookEvent(this.id, payload);
  }
}
