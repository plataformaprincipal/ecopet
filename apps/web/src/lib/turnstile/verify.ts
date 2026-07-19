import "server-only";

import { apiFailure } from "@/lib/api-response";
import type { NextResponse } from "next/server";
import { clientIp } from "@/lib/rate-limit";
import { TURNSTILE_SITEVERIFY_URL } from "./constants";
import {
  getTurnstileServerConfig,
  isTurnstileConfigured,
  isTurnstileServerEnabled,
} from "./server-config";
import { mapCloudflareErrorCodes, turnstilePublicMessage } from "./errors";
import {
  detectTurnstileEnvironment,
  extractRequestHostname,
  isHostnameAllowed,
} from "./hostname";
import { claimTurnstileTokenHash, recordTurnstileMetric } from "./metrics";
import { cloudflareSiteverifySchema, turnstileTokenSchema } from "./schemas";
import type { TurnstileAction } from "./actions";
import type { TurnstileErrorCode, TurnstileVerifyInput, TurnstileVerifyResult } from "./types";

function fail(
  code: TurnstileErrorCode,
  extra?: Partial<TurnstileVerifyResult>
): TurnstileVerifyResult {
  return {
    success: false,
    code,
    sanitizedMessage: turnstilePublicMessage(code),
    ...extra,
  };
}

function logMetric(
  input: TurnstileVerifyInput,
  result: TurnstileVerifyResult,
  token?: string | null
): void {
  void recordTurnstileMetric({
    action: input.expectedAction,
    flow: input.flow,
    result,
    userId: input.userId,
    correlationId: input.correlationId,
    remoteIp: input.remoteIp,
    token: token ?? null,
  });
}

/**
 * Valida token no endpoint oficial Cloudflare siteverify.
 * Nunca retorna secret nem resposta bruta ao cliente.
 *
 * Política:
 * - Produção + configurado + habilitado → fail-closed (exige token válido).
 * - Produção sem configuração → fail-open de deploy (não bloqueia; documentado).
 * - TURNSTILE_ENABLED=false → skip explícito (todos ambientes).
 * - TURNSTILE_DEV_BYPASS=1 → somente development; proibido em production.
 */
export async function verifyTurnstileToken(
  input: TurnstileVerifyInput
): Promise<TurnstileVerifyResult> {
  const environment = detectTurnstileEnvironment();

  if (process.env.TURNSTILE_DEV_BYPASS === "1") {
    if (environment === "production") {
      const result = fail("BYPASS_FORBIDDEN");
      logMetric(input, result);
      return result;
    }
    if (environment === "development") {
      return { success: true, code: "OK", sanitizedMessage: "dev_bypass" };
    }
  }

  if (!isTurnstileServerEnabled()) {
    // Desabilitado explicitamente OU sem par Site+Secret → não exige desafio.
    return { success: true, code: "OK", sanitizedMessage: "turnstile_skipped" };
  }

  if (!isTurnstileConfigured()) {
    return { success: true, code: "OK", sanitizedMessage: "not_configured_skip" };
  }

  const config = getTurnstileServerConfig();
  if (!config) {
    return { success: true, code: "OK", sanitizedMessage: "not_configured_skip" };
  }

  const rawToken = typeof input.token === "string" ? input.token.trim() : "";
  if (!rawToken) {
    const result = fail("TOKEN_MISSING");
    logMetric(input, result);
    return result;
  }

  const tokenParsed = turnstileTokenSchema.safeParse(rawToken);
  if (!tokenParsed.success) {
    const result = fail("TOKEN_MALFORMED");
    logMetric(input, result);
    return result;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const body = new URLSearchParams();
    body.set("secret", config.secretKey);
    body.set("response", rawToken);
    if (input.remoteIp && input.remoteIp !== "unknown") {
      body.set("remoteip", input.remoteIp);
    }

    const res = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      const result = fail("CLOUDFLARE_UNAVAILABLE");
      logMetric(input, result);
      return result;
    }

    const json: unknown = await res.json();
    const parsed = cloudflareSiteverifySchema.safeParse(json);
    if (!parsed.success) {
      const result = fail("INVALID_RESPONSE");
      logMetric(input, result);
      return result;
    }

    const data = parsed.data;
    if (!data.success) {
      const code = mapCloudflareErrorCodes(data["error-codes"]);
      const result = fail(code, {
        action: data.action,
        hostname: data.hostname,
        challengeTimestamp: data.challenge_ts ? new Date(data.challenge_ts) : undefined,
      });
      logMetric(input, result);
      return result;
    }

    if (data.action !== input.expectedAction) {
      // Exige action explícita e correspondente (widget deve enviar action).
      const result = fail("ACTION_MISMATCH", {
        action: data.action,
        hostname: data.hostname,
      });
      logMetric(input, result);
      return result;
    }

    const hostname = data.hostname?.toLowerCase();
    if (!isHostnameAllowed(hostname, config.allowedHostnames)) {
      const result = fail("HOSTNAME_MISMATCH", {
        action: data.action,
        hostname: data.hostname,
      });
      logMetric(input, result);
      return result;
    }

    if (data.challenge_ts) {
      const challengeAt = new Date(data.challenge_ts).getTime();
      if (Number.isFinite(challengeAt)) {
        const ageMs = Date.now() - challengeAt;
        if (ageMs > 10 * 60 * 1000 || ageMs < -60_000) {
          const result = fail("TOKEN_EXPIRED", {
            action: data.action,
            hostname: data.hostname,
            challengeTimestamp: new Date(data.challenge_ts),
          });
          logMetric(input, result);
          return result;
        }
      }
    }

    const claim = await claimTurnstileTokenHash(rawToken, input.expectedAction);
    if (!claim.claimed) {
      const result = fail("TOKEN_REUSED", {
        action: data.action,
        hostname: data.hostname,
      });
      logMetric(input, result);
      return result;
    }

    const result: TurnstileVerifyResult = {
      success: true,
      code: "OK",
      action: data.action,
      hostname: data.hostname,
      challengeTimestamp: data.challenge_ts ? new Date(data.challenge_ts) : undefined,
    };
    logMetric(input, result, null);
    return result;
  } catch (err: unknown) {
    const name =
      err && typeof err === "object" && "name" in err
        ? String((err as { name: unknown }).name)
        : "";
    const code: TurnstileErrorCode =
      name === "AbortError" ? "TIMEOUT" : "CLOUDFLARE_UNAVAILABLE";
    const result = fail(code);
    logMetric(input, result);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

export type RequireTurnstileOptions = {
  token: string | null | undefined;
  expectedAction: TurnstileAction;
  request: Request;
  remoteIp?: string;
  flow?: string;
  correlationId?: string;
  userId?: string | null;
};

/**
 * Helper para Route Handlers: retorna NextResponse de erro ou null se OK.
 * Quando Turnstile está habilitado, a ação só segue após verificação válida.
 */
export async function requireTurnstile(
  options: RequireTurnstileOptions
): Promise<NextResponse | null> {
  if (!isTurnstileServerEnabled()) {
    return null;
  }

  const result = await verifyTurnstileToken({
    token: options.token,
    expectedAction: options.expectedAction,
    requestHostname: extractRequestHostname(options.request),
    remoteIp: options.remoteIp ?? clientIp(options.request),
    flow: options.flow,
    correlationId: options.correlationId,
    userId: options.userId,
  });

  if (result.success) return null;

  const http =
    result.code === "TOKEN_MISSING"
      ? 400
      : result.code === "CLOUDFLARE_UNAVAILABLE" || result.code === "TIMEOUT"
        ? 503
        : 400;

  return apiFailure(
    result.code === "TOKEN_MISSING" ? "TURNSTILE_REQUIRED" : "TURNSTILE_FAILED",
    turnstilePublicMessage(result.code as TurnstileErrorCode),
    http
  );
}
