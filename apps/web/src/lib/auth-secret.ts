/**
 * Resolução única do segredo JWT de sessão (server + Edge).
 * Aceita AUTH_SECRET ou NEXTAUTH_SECRET — comum em deploys Vercel/NextAuth.
 * Sem Prisma, sem side-effects além de ler process.env.
 */
const IS_PROD = process.env.NODE_ENV === "production";
const IS_BUILD =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

const DEV_FALLBACK = "ecopet-dev-auth-secret-change-me";

/** Segredo HS256 para ecopet-session (middleware Edge + API routes). */
export function resolveAuthSecret(): string {
  const auth = process.env.AUTH_SECRET?.trim();
  if (auth) return auth;

  const nextAuth = process.env.NEXTAUTH_SECRET?.trim();
  if (nextAuth) return nextAuth;

  if (IS_PROD && !IS_BUILD) {
    throw new Error(
      "[env] Segredo de sessão ausente em produção: defina AUTH_SECRET ou NEXTAUTH_SECRET"
    );
  }

  return DEV_FALLBACK;
}
