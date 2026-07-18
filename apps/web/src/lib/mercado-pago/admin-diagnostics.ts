import "server-only";

import { prisma } from "@/lib/prisma";
import {
  getMercadoPagoSanitizedStatus,
  isMercadoPagoTestMode,
} from "@/lib/mercado-pago/config";
import { getMercadoPagoOrder } from "@/lib/mercado-pago/client";

export type MercadoPagoAdminDiagnostics = {
  provider: "mercado_pago";
  status: ReturnType<typeof getMercadoPagoSanitizedStatus>["status"];
  environment: "test" | "production";
  testMode: boolean;
  api: "orders";
  publicKeyConfigured: boolean;
  accessTokenConfigured: boolean;
  webhookSecretConfigured: boolean;
  webhookPath: "/api/webhooks/mercado-pago";
  webhookFutureUrl: "https://eccopet.com/api/webhooks/mercado-pago";
  sanitizedMessage?: string;
  counts: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    cancelled: number;
    refunded: number;
  };
  lastWebhook?: {
    eventType: string;
    status: string;
    receivedAt: string;
    processedAt?: string | null;
    failureReason?: string | null;
  } | null;
  lastSuccessAt?: string | null;
  lastErrorSanitized?: string | null;
  latencyMs?: number | null;
  errorRate?: number | null;
  probe?: {
    ok: boolean;
    code: string;
    message: string;
    charged: false;
  };
};

/**
 * Diagnóstico ADMIN — sem cobrança, sem exposição de secrets.
 */
export async function getMercadoPagoAdminDiagnostics(options?: {
  probe?: boolean;
}): Promise<MercadoPagoAdminDiagnostics> {
  const base = getMercadoPagoSanitizedStatus();

  const [total, approved, pending, rejected, cancelled, refunded, lastWebhook, lastOk, lastErr] =
    await Promise.all([
      prisma.payment.count({ where: { provider: "mercado_pago" } }),
      prisma.payment.count({ where: { provider: "mercado_pago", status: "APPROVED" } }),
      prisma.payment.count({
        where: {
          provider: "mercado_pago",
          status: { in: ["PENDING", "CREATED", "PROCESSING", "ACTION_REQUIRED"] },
        },
      }),
      prisma.payment.count({ where: { provider: "mercado_pago", status: "REJECTED" } }),
      prisma.payment.count({
        where: { provider: "mercado_pago", status: { in: ["CANCELLED", "EXPIRED"] } },
      }),
      prisma.payment.count({
        where: {
          provider: "mercado_pago",
          status: { in: ["REFUNDED", "PARTIALLY_REFUNDED", "CHARGED_BACK"] },
        },
      }),
      prisma.webhookEvent.findFirst({
        where: { provider: "mercado_pago" },
        orderBy: { createdAt: "desc" },
        select: {
          eventType: true,
          status: true,
          createdAt: true,
          processedAt: true,
          failureReason: true,
          errorMessage: true,
        },
      }),
      prisma.paymentEvent.findFirst({
        where: { provider: "mercado_pago", status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.paymentEvent.findFirst({
        where: { provider: "mercado_pago", status: { in: ["ERROR", "REJECTED"] } },
        orderBy: { createdAt: "desc" },
        select: { message: true, errorCode: true, createdAt: true },
      }),
    ]);

  const terminal = approved + rejected + cancelled + refunded;
  const errorRate = terminal > 0 ? Number(((rejected + cancelled) / terminal).toFixed(4)) : null;

  let probe: MercadoPagoAdminDiagnostics["probe"];
  let latencyMs: number | null = null;

  if (options?.probe && base.accessTokenConfigured) {
    const started = Date.now();
    // GET em order inexistente — valida auth sem criar cobrança
    const result = await getMercadoPagoOrder("00000000-0000-0000-0000-000000000000");
    latencyMs = Date.now() - started;
    if (result.ok) {
      probe = {
        ok: true,
        code: "PROBE_OK",
        message: "Comunicação com API Orders OK (sem cobrança).",
        charged: false,
      };
    } else if (result.code === "MP_UNAUTHORIZED") {
      probe = {
        ok: false,
        code: "AUTH_ERROR",
        message: "Access Token rejeitado pela API.",
        charged: false,
      };
    } else if (result.status === 404 || result.code === "MP_VALIDATION" || result.code === "MP_ERROR") {
      // 404/validation em id fake = token aceito
      probe = {
        ok: true,
        code: "PROBE_AUTH_OK",
        message: "Token aceito pela API Orders (recurso inexistente esperado; sem cobrança).",
        charged: false,
      };
    } else {
      probe = {
        ok: false,
        code: result.code,
        message: result.message,
        charged: false,
      };
    }
  }

  let status = base.status;
  if (probe && !probe.ok && probe.code === "AUTH_ERROR") status = "AUTH_ERROR";
  if (lastWebhook?.status === "FAILED" && base.webhookSecretConfigured) {
    status = status === "ACTIVE" || status === "TEST_READY" ? "WEBHOOK_ERROR" : status;
  }

  return {
    provider: "mercado_pago",
    status,
    environment: base.environment,
    testMode: isMercadoPagoTestMode(),
    api: "orders",
    publicKeyConfigured: base.publicKeyConfigured,
    accessTokenConfigured: base.accessTokenConfigured,
    webhookSecretConfigured: base.webhookSecretConfigured,
    webhookPath: "/api/webhooks/mercado-pago",
    webhookFutureUrl: "https://eccopet.com/api/webhooks/mercado-pago",
    sanitizedMessage: base.sanitizedMessage,
    counts: { total, approved, pending, rejected, cancelled, refunded },
    lastWebhook: lastWebhook
      ? {
          eventType: lastWebhook.eventType,
          status: lastWebhook.status,
          receivedAt: lastWebhook.createdAt.toISOString(),
          processedAt: lastWebhook.processedAt?.toISOString() ?? null,
          failureReason: lastWebhook.failureReason ?? lastWebhook.errorMessage ?? null,
        }
      : null,
    lastSuccessAt: lastOk?.createdAt.toISOString() ?? null,
    lastErrorSanitized: lastErr?.message ?? lastErr?.errorCode ?? null,
    latencyMs,
    errorRate,
    probe,
  };
}
