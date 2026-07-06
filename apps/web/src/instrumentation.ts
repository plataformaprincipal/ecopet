/**
 * Validação de ambiente no boot do servidor Next.js (Vercel/local).
 * Garante mensagens claras quando variáveis críticas estão ausentes.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { validateProductionEnv } = await import("@/lib/validate-production-env");
  validateProductionEnv();

  const { getResolvedDatabaseUrl } = await import("@ecopet/database/client");
  const { logDatabaseBootDiagnostics } = await import("@ecopet/database/diagnostics");
  logDatabaseBootDiagnostics(process.env.DATABASE_URL, getResolvedDatabaseUrl());
}
