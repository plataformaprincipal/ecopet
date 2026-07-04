/**
 * Validação centralizada de variáveis de ambiente.
 * Falha em runtime de produção quando segredos obrigatórios estão ausentes.
 */
import { resolveAuthSecret } from "@/lib/auth-secret";
import { isLocalhostUrl, resolvePublicAppUrl } from "@/lib/app-url";

const IS_PROD = process.env.NODE_ENV === "production";
const IS_BUILD =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== undefined) return fallback;
  if (IS_PROD && !IS_BUILD) {
    throw new Error(`[env] Variável obrigatória ausente em produção: ${name}`);
  }
  return "";
}

function resolveNextAuthSecret(): string {
  const next = process.env.NEXTAUTH_SECRET?.trim();
  if (next) return next;
  const auth = process.env.AUTH_SECRET?.trim();
  if (auth) return auth;
  if (IS_PROD && !IS_BUILD) {
    throw new Error(
      "[env] Segredo NextAuth ausente em produção: defina NEXTAUTH_SECRET ou AUTH_SECRET"
    );
  }
  return "ecopet-dev-nextauth-secret";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: IS_PROD,
  isDev: !IS_PROD,

  databaseUrl: requireEnv("DATABASE_URL"),
  authSecret: resolveAuthSecret(),
  nextAuthSecret: resolveNextAuthSecret(),
  nextAuthUrl: requireEnv("NEXTAUTH_URL", resolvePublicAppUrl()),
  appUrl: requireEnv("APP_URL", resolvePublicAppUrl()),

  apiInternalUrl: process.env.API_INTERNAL_URL?.trim() ?? "",
  nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL?.trim() ?? "",
  nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "",

  smtpHost: process.env.SMTP_HOST?.trim() ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER?.trim() ?? "",
  smtpPass: process.env.SMTP_PASS?.trim() ?? "",
} as const;

if (IS_PROD && !IS_BUILD && process.env.VERCEL === "1") {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      "[env] DATABASE_URL ausente na Vercel — login/cadastro não funcionam sem o banco Supabase."
    );
  }
  const publicUrl = resolvePublicAppUrl();
  if (isLocalhostUrl(publicUrl)) {
    console.warn(
      "[env] NEXTAUTH_URL/APP_URL apontam para localhost na Vercel. Defina a URL HTTPS de produção."
    );
  }
}
