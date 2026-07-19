import "server-only";

import {
  getMercadoPagoServerConfig,
  type MercadoPagoServerConfig,
} from "@/lib/mercado-pago/config";
import { hashPayload, newIdempotencyKey } from "@/lib/mercado-pago/crypto-utils";

export { hashPayload, newIdempotencyKey };
import type {
  CreateMpOrderRequest,
  MpApiErrorBody,
  MpClientResult,
  MpOrderResponse,
} from "@/lib/mercado-pago/types";

let cachedConfig: MercadoPagoServerConfig | null | undefined;

function resolveConfig(): MercadoPagoServerConfig | null {
  if (cachedConfig !== undefined) return cachedConfig;
  cachedConfig = getMercadoPagoServerConfig();
  return cachedConfig;
}

/** Reset cache — testes apenas. */
export function __resetMercadoPagoClientForTests(): void {
  cachedConfig = undefined;
}

function sanitizeMessage(raw: string): string {
  return raw
    .replace(/APP_USR-[A-Za-z0-9_-]+/g, "APP_USR-***")
    .replace(/TEST-[A-Za-z0-9_-]+/g, "TEST-***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***")
    .slice(0, 280);
}

function mapHttpError(status: number, body: MpApiErrorBody | null): MpClientResult<never> {
  const raw = body?.message || body?.error || `HTTP ${status}`;
  const message = sanitizeMessage(raw);
  if (status === 401) {
    return { ok: false, status, code: "MP_UNAUTHORIZED", message: "Credenciais Mercado Pago inválidas.", retryable: false };
  }
  if (status === 403) {
    return { ok: false, status, code: "MP_FORBIDDEN", message: "Operação não autorizada no Mercado Pago.", retryable: false };
  }
  if (status === 422 || status === 400) {
    return { ok: false, status, code: "MP_VALIDATION", message, retryable: false };
  }
  if (status === 429) {
    return { ok: false, status, code: "MP_RATE_LIMIT", message: "Limite de requisições do Mercado Pago.", retryable: true };
  }
  if (status >= 500) {
    return { ok: false, status, code: "MP_UNAVAILABLE", message: "Mercado Pago temporariamente indisponível.", retryable: true };
  }
  return { ok: false, status, code: "MP_ERROR", message, retryable: false };
}

async function mpFetch<T>(
  path: string,
  init: {
    method: "GET" | "POST" | "PUT";
    body?: unknown;
    idempotencyKey?: string;
  }
): Promise<MpClientResult<T>> {
  const config = resolveConfig();
  if (!config) {
    return {
      ok: false,
      status: 503,
      code: "MP_NOT_CONFIGURED",
      message: "Mercado Pago não configurado.",
      retryable: false,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (init.idempotencyKey) {
      headers["X-Idempotency-Key"] = init.idempotencyKey.slice(0, 64);
    }

    const res = await fetch(`${config.apiBaseUrl}${path}`, {
      method: init.method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      return mapHttpError(res.status, (json as MpApiErrorBody) || { message: text.slice(0, 200) });
    }

    return { ok: true, data: json as T, status: res.status };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "AbortError") {
      return {
        ok: false,
        status: 504,
        code: "MP_TIMEOUT",
        message: "Timeout ao contactar Mercado Pago.",
        retryable: true,
      };
    }
    return {
      ok: false,
      status: 502,
      code: "MP_NETWORK",
      message: "Falha de rede ao contactar Mercado Pago.",
      retryable: true,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** POST /v1/orders — Checkout Transparente (API Orders). */
export async function createMercadoPagoOrder(
  body: CreateMpOrderRequest,
  idempotencyKey: string
): Promise<MpClientResult<MpOrderResponse>> {
  return mpFetch<MpOrderResponse>("/v1/orders", {
    method: "POST",
    body,
    idempotencyKey,
  });
}

/** GET /v1/orders/{id} */
export async function getMercadoPagoOrder(
  providerOrderId: string
): Promise<MpClientResult<MpOrderResponse>> {
  const id = encodeURIComponent(providerOrderId);
  return mpFetch<MpOrderResponse>(`/v1/orders/${id}`, { method: "GET" });
}

/** GET /v1/payments/{id} — Payments API legada (compatibilidade webhook). */
export async function getMercadoPagoLegacyPayment(
  paymentId: string
): Promise<MpClientResult<Record<string, unknown>>> {
  const id = encodeURIComponent(paymentId);
  return mpFetch<Record<string, unknown>>(`/v1/payments/${id}`, { method: "GET" });
}

/** GET /v1/claims/{id} */
export async function getMercadoPagoClaim(
  claimId: string
): Promise<MpClientResult<Record<string, unknown>>> {
  const id = encodeURIComponent(claimId);
  return mpFetch<Record<string, unknown>>(`/v1/claims/${id}`, { method: "GET" });
}

/** GET /v1/chargebacks/{id} */
export async function getMercadoPagoChargeback(
  chargebackId: string
): Promise<MpClientResult<Record<string, unknown>>> {
  const id = encodeURIComponent(chargebackId);
  return mpFetch<Record<string, unknown>>(`/v1/chargebacks/${id}`, { method: "GET" });
}

/** GET /merchant_orders/{id} — pedidos comerciais (Checkout Pro / QR). */
export async function getMercadoPagoMerchantOrder(
  merchantOrderId: string
): Promise<MpClientResult<Record<string, unknown>>> {
  const id = encodeURIComponent(merchantOrderId);
  return mpFetch<Record<string, unknown>>(`/merchant_orders/${id}`, { method: "GET" });
}

/** POST /v1/payments/{id}/refunds — estorno total (body vazio) ou parcial `{ amount }`. */
export async function refundMercadoPagoLegacyPayment(
  paymentId: string,
  idempotencyKey: string,
  amount?: number
): Promise<MpClientResult<Record<string, unknown>>> {
  const id = encodeURIComponent(paymentId);
  const body =
    amount !== undefined && Number.isFinite(amount)
      ? { amount: Number(amount.toFixed(2)) }
      : {};
  return mpFetch<Record<string, unknown>>(`/v1/payments/${id}/refunds`, {
    method: "POST",
    body,
    idempotencyKey,
  });
}

/** GET /v1/payments/{id}/refunds — lista estornos do pagamento. */
export async function listMercadoPagoPaymentRefunds(
  paymentId: string
): Promise<MpClientResult<unknown>> {
  const id = encodeURIComponent(paymentId);
  return mpFetch<unknown>(`/v1/payments/${id}/refunds`, { method: "GET" });
}

/**
 * Cancela pagamento pendente (Payments API).
 * PUT /v1/payments/{id} com status cancelled — só para não capturados/pendentes.
 */
export async function cancelMercadoPagoLegacyPayment(
  paymentId: string,
  idempotencyKey: string
): Promise<MpClientResult<Record<string, unknown>>> {
  const id = encodeURIComponent(paymentId);
  return mpFetch<Record<string, unknown>>(`/v1/payments/${id}`, {
    method: "PUT",
    body: { status: "cancelled" },
    idempotencyKey,
  });
}

/** GET /v1/payment_methods — meios disponíveis na conta. */
export async function getMercadoPagoPaymentMethods(): Promise<
  MpClientResult<Array<Record<string, unknown>>>
> {
  return mpFetch<Array<Record<string, unknown>>>("/v1/payment_methods", { method: "GET" });
}

/** GET /v1/payment_methods/installments — opções oficiais de parcelamento. */
export async function getMercadoPagoInstallments(params: {
  amount: number;
  bin?: string;
  paymentMethodId?: string;
}): Promise<MpClientResult<unknown>> {
  const q = new URLSearchParams();
  q.set("amount", params.amount.toFixed(2));
  if (params.bin) q.set("bin", params.bin.slice(0, 8));
  if (params.paymentMethodId) q.set("payment_method_id", params.paymentMethodId);
  return mpFetch<unknown>(`/v1/payment_methods/installments?${q.toString()}`, {
    method: "GET",
  });
}
