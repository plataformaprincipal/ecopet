/**
 * Validação centralizada de variáveis de ambiente.
 * Falha em runtime de produção quando segredos obrigatórios estão ausentes.
 */

const IS_PROD = process.env.NODE_ENV === "production";
const IS_BUILD =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback) return fallback;
  if (IS_PROD && !IS_BUILD) {
    throw new Error(`[env] Variável obrigatória ausente em produção: ${name}`);
  }
  return fallback ?? "";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: IS_PROD,
  isDev: !IS_PROD,

  databaseUrl: process.env.DATABASE_URL?.trim() ?? "",
  authSecret: requireEnv("AUTH_SECRET", "ecopet-dev-auth-secret-change-me"),
  nextAuthSecret: requireEnv("NEXTAUTH_SECRET", "ecopet-dev-nextauth-secret"),
  nextAuthUrl: requireEnv("NEXTAUTH_URL", "http://localhost:3000"),
  appUrl: requireEnv("APP_URL", process.env.NEXTAUTH_URL ?? "http://localhost:3000"),

  apiInternalUrl: process.env.API_INTERNAL_URL?.trim() ?? "",
  nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL?.trim() ?? "",
  nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "",

  smtpHost: process.env.SMTP_HOST?.trim() ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER?.trim() ?? "",
  smtpPass: process.env.SMTP_PASS?.trim() ?? "",
} as const;
