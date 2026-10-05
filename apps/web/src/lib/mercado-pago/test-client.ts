import "server-only";

import { getMercadoPagoTestServerConfig } from "@/lib/mercado-pago/test-credentials";
import type {
  CreateMpOrderRequest,
  MpApiErrorBody,
  MpClientResult,
  MpOrderResponse,
} from "@/lib/mercado-pago/types";

function sanitizeMessage(raw: string): string {
  return raw
    .replace(/APP_USR-[A-Za-z0-9_-]+/g, "APP_USR-***")
    .replace(/TEST-[A-Za-z0-9_-]+/g, "TEST-***")
    .replace(/Bearer\s+\S+/gi, "Bearer ***")
    .slice(0, 280);
}

function mapHttpError(status: number, body: MpApiErrorBody | null): MpClientResult<never> {
  const errors = Array.isArray((body as { errors?: Array<{ code?: string; message?: string }> } | null)?.errors)
    ? (body as { errors: Array<{ code?: string; message?: string }> }).errors
    : [];
  const firstErr = errors[0];
  const raw =
    (firstErr?.code && firstErr?.message
      ? `${firstErr.code}: ${firstErr.message}`
      : firstErr?.message || firstErr?.code || body?.message || body?.error || `HTTP ${status}`) ||
    `HTTP ${status}`;
  const message = sanitizeMessage(String(raw));
  if (status === 401) {
    return { ok: false, status, code: "MP_UNAUTHORIZED", message: "Credenciais de teste Mercado Pago inválidas.", retryable: false };
  }
  if (status === 403) {
    return { ok: false, status, code: "MP_FORBIDDEN", message: "Operação não autorizada no Mercado Pago TEST.", retryable: false };
  }
  if (status === 402) {
    return {
      ok: false,
      status,
      code: "MP_PAYMENT_REQUIRED",
      message: message || "Conta Mercado Pago TEST sem permissão de cobrança (HTTP 402).",
      retryable: false,
    };
  }
  if (status === 422 || status === 400) {
    return {
      ok: false,
      status,
      code: firstErr?.code ? `MP_VALIDATION:${firstErr.code}` : "MP_VALIDATION",
      message,
      retryable: false,
    };
  }
  if (status === 429) {
    return { ok: false, status, code: "MP_RATE_LIMIT", message: "Limite de requisições do Mercado Pago.", retryable: true };
  }
  if (status >= 500) {
    return { ok: false, status, code: "MP_UNAVAILABLE", message: "Mercado Pago temporariamente indisponível.", retryable: true };
  }
  return { ok: false, status, code: "MP_ERROR", message, retryable: false };
}

async function testMpFetch<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; idempotencyKey?: string }
): Promise<MpClientResult<T>> {
  const config = getMercadoPagoTestServerConfig();
  if (!config) {
    return {
      ok: false,
      status: 503,
      code: "MP_TEST_NOT_CONFIGURED",
      message: "Credenciais de teste Mercado Pago ausentes.",
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
        message: "Timeout ao contactar Mercado Pago TEST.",
        retryable: true,
      };
    }
    return {
      ok: false,
      status: 502,
      code: "MP_NETWORK",
      message: "Falha de rede ao contactar Mercado Pago TEST.",
      retryable: true,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function createTestMercadoPagoOrder(
  body: CreateMpOrderRequest,
  idempotencyKey: string
): Promise<MpClientResult<MpOrderResponse>> {
  return testMpFetch<MpOrderResponse>("/v1/orders", {
    method: "POST",
    body,
    idempotencyKey,
  });
}

export async function getTestMercadoPagoOrder(
  providerOrderId: string
): Promise<MpClientResult<MpOrderResponse>> {
  const id = encodeURIComponent(providerOrderId);
  return testMpFetch<MpOrderResponse>(`/v1/orders/${id}`, { method: "GET" });
}

export async function getTestMercadoPagoPaymentMethods(): Promise<
  MpClientResult<Array<Record<string, unknown>>>
> {
  return testMpFetch<Array<Record<string, unknown>>>("/v1/payment_methods", { method: "GET" });
}

export async function getTestMercadoPagoInstallments(params: {
  amount: number;
  bin?: string;
  paymentMethodId?: string;
}): Promise<MpClientResult<unknown>> {
  const q = new URLSearchParams();
  q.set("amount", params.amount.toFixed(2));
  if (params.bin) q.set("bin", params.bin.slice(0, 8));
  if (params.paymentMethodId) q.set("payment_method_id", params.paymentMethodId);
  return testMpFetch<unknown>(`/v1/payment_methods/installments?${q.toString()}`, {
    method: "GET",
  });
}
