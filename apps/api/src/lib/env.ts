/**
 * Validação de variáveis de ambiente — API Express.
 */
const IS_PROD = process.env.NODE_ENV === "production";

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback) return fallback;
  return fallback ?? "";
}

export const apiEnv = {
  isProd: IS_PROD,
  jwtSecret: requireEnv("JWT_SECRET", "ecopet-dev-secret"),
  databaseUrl: process.env.DATABASE_URL?.trim() ?? "",
  webUrl: process.env.WEB_URL?.trim() ?? "http://localhost:3000",
  apiPort: Number(process.env.API_PORT || process.env.PORT || 4000),
} as const;

/** Valida segredos obrigatórios — chamar na inicialização do servidor */
export function validateApiProductionEnv(): void {
  if (!IS_PROD) return;
  if (!process.env.JWT_SECRET?.trim()) {
    throw new Error("[env] JWT_SECRET obrigatório em produção");
  }
}
