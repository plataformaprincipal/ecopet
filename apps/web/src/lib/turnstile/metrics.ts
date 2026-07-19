import "server-only";

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { TURNSTILE_PROVIDER, TURNSTILE_TOKEN_HASH_RETENTION_HOURS } from "./constants";
import { detectTurnstileEnvironment } from "./hostname";
import type { TurnstileErrorCode, TurnstileVerifyResult } from "./types";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function hashIp(ip: string | null | undefined): string | null {
  if (!ip || ip === "unknown") return null;
  return createHash("sha256").update(`ecopet-ip:${ip}`).digest("hex").slice(0, 32);
}

export async function recordTurnstileMetric(input: {
  action: string;
  flow?: string;
  result: TurnstileVerifyResult;
  userId?: string | null;
  correlationId?: string;
  remoteIp?: string | null;
  token?: string | null;
}): Promise<void> {
  try {
    const environment = detectTurnstileEnvironment();
    await prisma.securityVerificationEvent.create({
      data: {
        provider: TURNSTILE_PROVIDER,
        action: input.action,
        flow: input.flow ?? input.action,
        success: input.result.success,
        errorCode: input.result.success ? null : String(input.result.code),
        hostname: input.result.hostname ?? null,
        environment,
        userId: input.userId ?? null,
        requestCorrelationId: input.correlationId ?? null,
        ipHash: hashIp(input.remoteIp),
        tokenHash:
          input.result.success && input.token ? hashToken(input.token) : null,
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[turnstile:metrics]", err instanceof Error ? err.message : "error");
    }
  }
}

/**
 * Registra uso do token (hash) para anti-replay interno.
 * Retorna false se o hash já existir (reutilização).
 */
export async function claimTurnstileTokenHash(
  token: string,
  action: string
): Promise<{ claimed: boolean }> {
  const tokenHash = hashToken(token);
  try {
    await prisma.securityVerificationEvent.create({
      data: {
        provider: TURNSTILE_PROVIDER,
        action,
        flow: "token_claim",
        success: true,
        errorCode: null,
        hostname: null,
        environment: detectTurnstileEnvironment(),
        tokenHash,
      },
    });
    return { claimed: true };
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "";
    if (code === "P2002") {
      return { claimed: false };
    }
    // Se unique ainda não existir / DB indisponível, não bloquear por claim local
    // (Cloudflare já garante uso único na maioria dos casos).
    return { claimed: true };
  }
}

export async function purgeExpiredTurnstileTokenHashes(): Promise<number> {
  const cutoff = new Date(
    Date.now() - TURNSTILE_TOKEN_HASH_RETENTION_HOURS * 60 * 60 * 1000
  );
  try {
    const result = await prisma.securityVerificationEvent.deleteMany({
      where: {
        provider: TURNSTILE_PROVIDER,
        tokenHash: { not: null },
        createdAt: { lt: cutoff },
      },
    });
    return result.count;
  } catch {
    return 0;
  }
}

export async function getTurnstileMetricsSummary(hours = 24): Promise<{
  total: number;
  approved: number;
  rejected: number;
  hostnameFailures: number;
  actionFailures: number;
  expired: number;
  configErrors: number;
  unavailable: number;
  successRate: number;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorCode: string | null;
}> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  try {
    const rows = await prisma.securityVerificationEvent.findMany({
      where: {
        provider: TURNSTILE_PROVIDER,
        createdAt: { gte: since },
        NOT: { flow: "token_claim" },
      },
      select: {
        success: true,
        errorCode: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const total = rows.length;
    const approved = rows.filter((r) => r.success).length;
    const rejected = total - approved;
    const hostnameFailures = rows.filter((r) => r.errorCode === "HOSTNAME_MISMATCH").length;
    const actionFailures = rows.filter((r) => r.errorCode === "ACTION_MISMATCH").length;
    const expired = rows.filter(
      (r) => r.errorCode === "TOKEN_EXPIRED" || r.errorCode === "TOKEN_REUSED"
    ).length;
    const configErrors = rows.filter(
      (r) =>
        r.errorCode === "NOT_CONFIGURED" ||
        r.errorCode === "DISABLED" ||
        r.errorCode === "INVALID_SECRET"
    ).length;
    const unavailable = rows.filter(
      (r) =>
        r.errorCode === "CLOUDFLARE_UNAVAILABLE" ||
        r.errorCode === "TIMEOUT" ||
        r.errorCode === "INVALID_RESPONSE"
    ).length;

    const lastSuccess = rows.find((r) => r.success);
    const lastError = rows.find((r) => !r.success);

    return {
      total,
      approved,
      rejected,
      hostnameFailures,
      actionFailures,
      expired,
      configErrors,
      unavailable,
      successRate: total === 0 ? 0 : Math.round((approved / total) * 1000) / 10,
      lastSuccessAt: lastSuccess?.createdAt.toISOString() ?? null,
      lastErrorAt: lastError?.createdAt.toISOString() ?? null,
      lastErrorCode: (lastError?.errorCode as TurnstileErrorCode | null) ?? null,
    };
  } catch {
    return {
      total: 0,
      approved: 0,
      rejected: 0,
      hostnameFailures: 0,
      actionFailures: 0,
      expired: 0,
      configErrors: 0,
      unavailable: 0,
      successRate: 0,
      lastSuccessAt: null,
      lastErrorAt: null,
      lastErrorCode: null,
    };
  }
}
