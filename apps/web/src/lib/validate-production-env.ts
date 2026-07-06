import { isLocalhostUrl, resolvePublicAppUrl } from "@/lib/app-url";
import {
  isCloudinaryConfigured,
  isEmailConfigured,
  isResendConfigured,
} from "@/lib/integrations/env-check";

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
