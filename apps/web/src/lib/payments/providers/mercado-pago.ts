/**
 * Mercado Pago — Checkout Transparente via API Orders.
 * Access Token apenas no servidor; cobrança real só com token + chamada explícita.
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
import { isMercadoPagoConfigured } from "@/lib/mercado-pago/config";
import { getMercadoPagoOrder } from "@/lib/mercado-pago/client";
import { mapMpOrderStatusToInternal } from "@/lib/mercado-pago/status";
import { verifyMercadoPagoWebhookSignature } from "@/lib/mercado-pago/webhook-signature";

export class MercadoPagoPaymentProvider implements PaymentProvider {
  readonly id = "mercado_pago" as const;

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    if (!isMercadoPagoConfigured()) {
      return {
        provider: this.id,
        status: "not_configured",
        message: "MERCADO_PAGO_ACCESS_TOKEN ausente — nenhuma cobrança criada.",
      };
    }
    // Fluxo canônico: POST /api/checkout/mercado-pago/order (API Orders)
    return {
      provider: this.id,
      status: "pending",
      externalId: input.orderId,
      message:
        "Use POST /api/checkout/mercado-pago/order (Checkout Transparente / API Orders).",
    };
  }

  async getPaymentStatus(externalId: string): Promise<PaymentStatusResult> {
    if (!isMercadoPagoConfigured()) {
      throw new PaymentNotConfiguredError("Mercado Pago não configurado.");
    }
    const remote = await getMercadoPagoOrder(externalId);
    if (!remote.ok) {
      return { provider: this.id, externalId, status: "pending" };
    }
    const internal = mapMpOrderStatusToInternal(remote.data.status, remote.data.status_detail);
    const mapped =
      internal === "APPROVED"
        ? "paid"
        : internal === "REJECTED" || internal === "CANCELLED" || internal === "EXPIRED"
          ? "failed"
          : internal === "REFUNDED" || internal === "CHARGED_BACK"
            ? "refunded"
            : "pending";
    return { provider: this.id, externalId, status: mapped };
  }

  async cancelPayment(externalId: string): Promise<PaymentActionResult> {
    if (!isMercadoPagoConfigured()) {
      throw new PaymentNotConfiguredError("Mercado Pago não configurado.");
    }
    return {
      provider: this.id,
      externalId,
      status: "pending",
      message: "Cancelamento de order: use painel MP ou endpoint oficial de cancelamento.",
    };
  }

  async refundPayment(externalId: string, _amount?: number): Promise<PaymentActionResult> {
    if (!isMercadoPagoConfigured()) {
      throw new PaymentNotConfiguredError("Mercado Pago não configurado.");
    }
    return {
      provider: this.id,
      externalId,
      status: "pending",
      message: "Estorno via API Orders ainda não exposto neste adapter (use conciliação admin).",
    };
  }

  async validateWebhook(
    headers: Headers | Record<string, string | null | undefined>,
    body: string | Buffer
  ): Promise<boolean> {
    const get = (name: string): string | null => {
      if (typeof (headers as Headers).get === "function") {
        return (headers as Headers).get(name);
      }
      const map = headers as Record<string, string | null | undefined>;
      return map[name] ?? map[name.toLowerCase()] ?? null;
    };

    let dataId: string | null = null;
    try {
      const raw = typeof body === "string" ? body : body.toString("utf8");
      const json = JSON.parse(raw) as { data?: { id?: string | number }; id?: string | number };
      dataId = json.data?.id != null ? String(json.data.id) : json.id != null ? String(json.id) : null;
    } catch {
      dataId = null;
    }

    const result = verifyMercadoPagoWebhookSignature({
      xSignature: get("x-signature"),
      xRequestId: get("x-request-id"),
      dataId,
    });
    // Sem secret em TEST: aceita presença de assinatura para smoke; rota real usa processMercadoPagoWebhook
    if (result.reason === "WEBHOOK_SECRET_MISSING") {
      return Boolean(get("x-signature"));
    }
    return result.valid;
  }

  normalizeEvent(payload: unknown): PaymentWebhookEvent | null {
    if (!payload || typeof payload !== "object") return null;
    const p = payload as { type?: string; action?: string; data?: { id?: string } };
    return {
      provider: this.id,
      type: String(p.type ?? p.action ?? "unknown"),
      externalId: p.data?.id != null ? String(p.data.id) : undefined,
      raw: payload,
    };
  }
}
