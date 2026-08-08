import { isLocalhostUrl, resolvePublicAppUrl } from "@/lib/app-url";
import {
  isCloudinaryConfigured,
  isEmailConfigured,
  isResendConfigured,
} from "@/lib/integrations/env-check";
import { usesOfficialCloudflareTestCredentials } from "@/lib/turnstile/cloudflare-test-keys";

export type ProductionEnvReport = {
  critical: string[];
  recommended: string[];
  warnings: string[];
};

function hasAuthSecret(env: NodeJS.ProcessEnv): boolean {
  return Boolean(env.AUTH_SECRET?.trim() || env.NEXTAUTH_SECRET?.trim());
}

/** Valida variáveis necessárias para apps/web em produção (Vercel). */
export function auditProductionEnv(env: NodeJS.ProcessEnv = process.env): ProductionEnvReport {
  const critical: string[] = [];
  const recommended: string[] = [];
  const warnings: string[] = [];

  if (!env.DATABASE_URL?.trim()) {
    critical.push("DATABASE_URL");
  }

  if (!hasAuthSecret(env)) {
    critical.push("AUTH_SECRET ou NEXTAUTH_SECRET");
  }

  const publicUrl = resolvePublicAppUrl();
  if (env.VERCEL === "1" && isLocalhostUrl(publicUrl)) {
    warnings.push(
      "NEXTAUTH_URL, APP_URL e NEXT_PUBLIC_APP_URL apontam para localhost — defina a URL HTTPS de produção na Vercel."
    );
  }

  if (!env.NEXT_PUBLIC_APP_URL?.trim() && env.VERCEL === "1") {
    recommended.push("NEXT_PUBLIC_APP_URL (mesma URL HTTPS de produção)");
  }

  if (!isEmailConfigured(env)) {
    recommended.push(
      "RESEND_API_KEY + EMAIL_FROM (ou SMTP_HOST, SMTP_USER, SMTP_PASS) — recuperação de senha e e-mails transacionais"
    );
  } else if (!isResendConfigured(env)) {
    warnings.push(
      "RESEND_API_KEY ausente — recuperação de senha por OTP usa Resend preferencialmente; SMTP configurado como fallback."
    );
  }

  if (!isCloudinaryConfigured(env)) {
    recommended.push("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET — upload de mídia");
  }

  if (!env.EMAIL_FROM?.trim() && isResendConfigured(env)) {
    recommended.push("EMAIL_FROM — remetente verificado no Resend");
  }

  const dangerous = [
    "FORCE_INSECURE_SESSION_COOKIE",
    "AUTH_RATE_LIMIT_DISABLED",
    "AUTH_TEST_EXPOSE_OTP",
    "ALLOW_TEST_RESEND",
    "TURNSTILE_DEV_BYPASS",
    "AUTH_TEST_RESET_RATE_LIMIT",
    "ALLOW_SIMULATED_PAYMENTS",
  ] as const;
  // Harness local (`npm run test:server:start`) only — never on Vercel.
  const localStableTestHarness =
    env.ECOPET_STABLE_TEST_SERVER === "1" && env.VERCEL !== "1" && !env.VERCEL_ENV;
  for (const key of dangerous) {
    if (env[key] === "1" || env[key]?.toLowerCase() === "true") {
      if (localStableTestHarness && key !== "FORCE_INSECURE_SESSION_COOKIE") {
        warnings.push(`${key} ativo apenas no harness local ECOPET_STABLE_TEST_SERVER`);
        continue;
      }
      critical.push(`${key} não permitido em produção`);
    }
  }

  // Preview Vercel tem NODE_ENV=production; a flag de teste Cloudflare é Preview-only.
  const allowCfTest =
    env.TURNSTILE_ALLOW_CLOUDFLARE_TEST_KEYS === "1" ||
    env.TURNSTILE_ALLOW_CLOUDFLARE_TEST_KEYS?.toLowerCase() === "true";
  if (allowCfTest && env.VERCEL_ENV === "production") {
    critical.push("TURNSTILE_ALLOW_CLOUDFLARE_TEST_KEYS não permitido em Production");
  }

  // E2E Preview auth (rate-limit IP sintético) — nunca em Production.
  const e2eMode =
    env.E2E_TEST_MODE === "1" || env.E2E_TEST_MODE?.toLowerCase() === "true";
  if (env.VERCEL_ENV === "production") {
    if (e2eMode) {
      critical.push("E2E_TEST_MODE não permitido em Production");
    }
    if (env.E2E_TEST_SECRET?.trim()) {
      critical.push("E2E_TEST_SECRET não permitido em Production");
    }
  }

  if (env.MERCADO_PAGO_ACCESS_TOKEN?.trim() && !env.MERCADO_PAGO_WEBHOOK_SECRET?.trim()) {
    critical.push("MERCADO_PAGO_WEBHOOK_SECRET (obrigatório quando access token está configurado)");
  }

  if (
    (env.TURNSTILE_ENABLED === "1" || env.TURNSTILE_ENABLED === "true" || !env.TURNSTILE_ENABLED) &&
    env.VERCEL === "1"
  ) {
    if (!env.TURNSTILE_SECRET_KEY?.trim() || !env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()) {
      recommended.push(
        "TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY — formulários públicos falham abertos sem Turnstile"
      );
    }
  }

  if (
    (env.VERCEL_ENV === "production" || (env.NODE_ENV === "production" && env.VERCEL_ENV !== "preview")) &&
    usesOfficialCloudflareTestCredentials(env)
  ) {
    critical.push(
      "TURNSTILE site/secret oficiais de teste Cloudflare não permitidos em Production"
    );
  }

  return { critical, recommended, warnings };
}

/**
 * Em produção na Vercel: falha com mensagem clara se variáveis críticas faltarem.
 * Recomendadas geram console.warn (não derrubam o deploy).
 */
export function validateProductionEnv(env: NodeJS.ProcessEnv = process.env): void {
  const isProd = env.NODE_ENV === "production";
  const isBuild =
    env.NEXT_PHASE === "phase-production-build" || env.NEXT_PHASE === "phase-export";

  if (!isProd || isBuild) return;

  const report = auditProductionEnv(env);

  for (const w of report.warnings) {
    console.warn(`[env] ${w}`);
  }

  for (const r of report.recommended) {
    console.warn(`[env] Recomendado em produção: ${r}`);
  }

  if (report.critical.length > 0) {
    throw new Error(
      `[env] Variáveis OBRIGATÓRIAS ausentes em produção: ${report.critical.join(", ")}. ` +
        "Configure-as em Vercel → Settings → Environment Variables. " +
        "Consulte .env.example na raiz do repositório."
    );
  }
}
