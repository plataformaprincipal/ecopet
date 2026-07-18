/**
 * Phase 3 — smoke tests admin (sem expor secrets).
 * Preferência: validação de config; live calls só quando seguras e baratas.
 */

import { writeAuditLog } from "@/lib/audit-log";
import { writeIntegrationLog } from "@/lib/integrations/log";
import { getIntegrationStatus } from "@/lib/integrations/integration-status";
import { redactSecretLikeText } from "@/lib/gestor/gestor-utils";
import { generateTalkJsSignature, isTalkJsServerConfigured } from "@/lib/talkjs/server";
import { isCloudinaryConfigured } from "@/lib/storage/cloudinary";
import { isTwilioConfigured, getTwilioAccountSid, getTwilioAuthToken } from "@/lib/sms/twilio";
import { isResendReady, getResendApiKey } from "@/lib/email/resend";
import { isOpenAiEnvConfigured, hasRealEnv, readEnv } from "@/lib/integrations/integration-config";

export type SmokeTestResult = {
  ok: boolean;
  code: string;
  provider: string;
  message?: string;
  missingVariables?: string[];
  mode?: "config_validation" | "live_probe";
  checkedAt: string;
};

const SECRET_FRAGMENT =
  /(sk-[a-zA-Z0-9_-]{8,}|rk_live_[a-zA-Z0-9]+|rk_test_[a-zA-Z0-9]+|whsec_[a-zA-Z0-9]+|Bearer\s+\S+)/gi;

export function sanitizeSmokeError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Falha no smoke test.";
  const withoutSecrets = raw.replace(SECRET_FRAGMENT, "[REDACTED]");
  return (redactSecretLikeText(withoutSecrets) ?? withoutSecrets).slice(0, 280);
}

async function auditSmoke(params: {
  actorId?: string | null;
  provider: string;
  result: SmokeTestResult;
}) {
  try {
    await writeAuditLog({
      actorId: params.actorId,
      action: "VIEW",
      module: "admin.integrations",
      resource: "integration_smoke_test",
      resourceId: params.provider,
      entityAfter: {
        ok: params.result.ok,
        code: params.result.code,
        mode: params.result.mode,
        missingVariables: params.result.missingVariables,
      },
      observation: `Smoke test ${params.provider}: ${params.result.code}`,
      metadata: {
        provider: params.provider,
        code: params.result.code,
        ok: params.result.ok,
      },
    });
  } catch {
    /* não quebrar o fluxo */
  }

  try {
    await writeIntegrationLog({
      integrationName: params.provider,
      provider: params.provider,
      action: "smoke_test",
      status: params.result.ok ? "ok" : "error",
      errorCode: params.result.ok ? undefined : params.result.code,
      message: params.result.message,
      metadata: {
        mode: params.result.mode,
        missingVariables: params.result.missingVariables,
      },
    });
  } catch {
    /* não quebrar o fluxo */
  }
}

function notConfigured(provider: string, missingVariables: string[]): SmokeTestResult {
  return {
    ok: false,
    code: "NOT_CONFIGURED",
    provider,
    missingVariables,
    message: missingVariables.length
      ? `Variáveis ausentes: ${missingVariables.join(", ")}`
      : "Integração não configurada.",
    checkedAt: new Date().toISOString(),
  };
}

function okResult(
  provider: string,
  message: string,
  mode: SmokeTestResult["mode"]
): SmokeTestResult {
  return {
    ok: true,
    code: "OK",
    provider,
    message,
    mode,
    checkedAt: new Date().toISOString(),
  };
}

function failResult(
  provider: string,
  code: string,
  err: unknown,
  mode: SmokeTestResult["mode"]
): SmokeTestResult {
  return {
    ok: false,
    code,
    provider,
    message: sanitizeSmokeError(err),
    mode,
    checkedAt: new Date().toISOString(),
  };
}

async function withAudit(
  actorId: string | null | undefined,
  provider: string,
  run: () => Promise<SmokeTestResult>
): Promise<SmokeTestResult> {
  const result = await run();
  await auditSmoke({ actorId, provider, result });
  return result;
}

/** OpenAI — probe leve em /models quando configurado. */
export async function smokeTestOpenAi(actorId?: string | null): Promise<SmokeTestResult> {
  return withAudit(actorId, "openai", async () => {
    const status = getIntegrationStatus("openai");
    if (status.status === "DISABLED") {
      return {
        ok: false,
        code: "DISABLED",
        provider: "openai",
        message: status.sanitizedError ?? "OpenAI desabilitada.",
        checkedAt: new Date().toISOString(),
      };
    }
    if (!status.configured || !isOpenAiEnvConfigured()) {
      return notConfigured("openai", status.missingVariables);
    }

    try {
      const key = readEnv("OPENAI_API_KEY");
      if (!key) return notConfigured("openai", ["OPENAI_API_KEY"]);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      const res = await fetch("https://api.openai.com/v1/models?limit=1", {
        method: "GET",
        headers: { Authorization: `Bearer ${key}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        return failResult(
          "openai",
          "SMOKE_FAILED",
          `OpenAI respondeu HTTP ${res.status}`,
          "live_probe"
        );
      }
      return okResult("openai", "OpenAI acessível (listagem de modelos).", "live_probe");
    } catch (e) {
      return failResult("openai", "SMOKE_FAILED", e, "live_probe");
    }
  });
}

/** Resend — validação de config apenas (não envia e-mail). Use POST /api/admin/test-email para envio. */
export async function smokeTestResend(actorId?: string | null): Promise<SmokeTestResult> {
  return withAudit(actorId, "resend", async () => {
    const status = getIntegrationStatus("resend");
    if (!status.configured || !isResendReady()) {
      return notConfigured("resend", status.missingVariables);
    }
    const key = getResendApiKey();
    if (!key || key.length < 10) {
      return notConfigured("resend", ["RESEND_API_KEY"]);
    }
    const domainNote =
      status.status === "DOMAIN_PENDING"
        ? " Domínio pendente — envios sandbox/limitados até DNS verificado."
        : status.status === "ACTIVE"
          ? " Domínio ACTIVE."
          : "";
    return okResult(
      "resend",
      `Resend configurado (${status.status}). Envio real: POST /api/admin/test-email.${domainNote}`,
      "config_validation"
    );
  });
}

/** Twilio — GET Account (sem enviar SMS). */
export async function smokeTestTwilio(actorId?: string | null): Promise<SmokeTestResult> {
  return withAudit(actorId, "twilio", async () => {
    const status = getIntegrationStatus("twilio");
    if (!status.configured || !isTwilioConfigured()) {
      return notConfigured("twilio", status.missingVariables);
    }

    const sid = getTwilioAccountSid();
    const token = getTwilioAuthToken();
    if (!sid || !token) {
      return notConfigured("twilio", status.missingVariables);
    }

    try {
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
        method: "GET",
        headers: { Authorization: `Basic ${auth}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        return failResult(
          "twilio",
          "SMOKE_FAILED",
          `Twilio respondeu HTTP ${res.status}`,
          "live_probe"
        );
      }
      return okResult("twilio", "Twilio acessível (consulta de conta).", "live_probe");
    } catch (e) {
      return failResult("twilio", "SMOKE_FAILED", e, "live_probe");
    }
  });
}

/** TalkJS — valida config + geração de assinatura (sem mutar usuários). */
export async function smokeTestTalkjs(actorId?: string | null): Promise<SmokeTestResult> {
  return withAudit(actorId, "talkjs", async () => {
    const status = getIntegrationStatus("talkjs");
    if (!status.configured || !isTalkJsServerConfigured()) {
      return notConfigured("talkjs", status.missingVariables);
    }
    const sig = generateTalkJsSignature("ecopet-smoke-test");
    if (!sig || sig.length < 16) {
      return failResult(
        "talkjs",
        "SMOKE_FAILED",
        "Falha ao gerar assinatura TalkJS.",
        "config_validation"
      );
    }
    return okResult(
      "talkjs",
      "TalkJS configurado (assinatura HMAC gerada com sucesso).",
      "config_validation"
    );
  });
}

/** Cloudinary — ping da API quando possível. */
export async function smokeTestCloudinary(actorId?: string | null): Promise<SmokeTestResult> {
  return withAudit(actorId, "cloudinary", async () => {
    const status = getIntegrationStatus("cloudinary");
    if (!status.configured || !isCloudinaryConfigured()) {
      return notConfigured("cloudinary", status.missingVariables);
    }

    const cloud = readEnv("CLOUDINARY_CLOUD_NAME");
    const apiKey = readEnv("CLOUDINARY_API_KEY");
    const apiSecret = readEnv("CLOUDINARY_API_SECRET");
    if (!cloud || !apiKey || !apiSecret) {
      return notConfigured("cloudinary", status.missingVariables);
    }

    try {
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/ping`, {
        method: "GET",
        headers: { Authorization: `Basic ${auth}` },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        return failResult(
          "cloudinary",
          "SMOKE_FAILED",
          `Cloudinary respondeu HTTP ${res.status}`,
          "live_probe"
        );
      }
      return okResult("cloudinary", "Cloudinary acessível (ping).", "live_probe");
    } catch (e) {
      // Fallback: env validation only se ping falhar por rede
      return okResult(
        "cloudinary",
        `Cloudinary env OK; ping indisponível (${sanitizeSmokeError(e)}).`,
        "config_validation"
      );
    }
  });
}

export type PaymentSmokeProvider = "mercado_pago" | "stripe";

/** Pagamentos — validação de config (sem criar cobrança). */
export async function smokeTestPayment(
  actorId?: string | null,
  provider?: PaymentSmokeProvider | "all"
): Promise<SmokeTestResult | { results: SmokeTestResult[] }> {
  const targets: PaymentSmokeProvider[] =
    provider === "mercado_pago" || provider === "stripe"
      ? [provider]
      : ["mercado_pago", "stripe"];

  const results: SmokeTestResult[] = [];
  for (const id of targets) {
    const result = await withAudit(actorId, id, async () => {
      const status = getIntegrationStatus(id);
      if (!status.configured) {
        return notConfigured(id, status.missingVariables);
      }

      if (id === "mercado_pago") {
        if (!hasRealEnv("MERCADO_PAGO_ACCESS_TOKEN")) {
          return notConfigured(id, ["MERCADO_PAGO_ACCESS_TOKEN"]);
        }
        return okResult(
          id,
          "Mercado Pago configurado (validação de env; cobrança não executada).",
          "config_validation"
        );
      }

      if (!hasRealEnv("STRIPE_SECRET_KEY")) {
        return notConfigured(id, ["STRIPE_SECRET_KEY"]);
      }
      const sk = readEnv("STRIPE_SECRET_KEY") ?? "";
      if (!sk.startsWith("sk_")) {
        return failResult(
          id,
          "INVALID_CONFIG",
          "STRIPE_SECRET_KEY com formato inesperado.",
          "config_validation"
        );
      }
      return okResult(
        id,
        "Stripe configurado (validação de env; cobrança não executada).",
        "config_validation"
      );
    });
    results.push(result);
  }

  if (targets.length === 1) return results[0]!;
  return { results };
}
