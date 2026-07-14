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
const WEAK_SECRET_RE = /change-me|changeme|placeholder|your_|replace-me|xxx|ecopet-dev-auth/i;

export function isWeakAuthSecret(value: string | null | undefined): boolean {
  const v = value?.trim() ?? "";
  if (v.length < 32) return true;
  return WEAK_SECRET_RE.test(v);
}

function pickConfiguredSecret(): string | null {
  const auth = process.env.AUTH_SECRET?.trim();
  if (auth && !isWeakAuthSecret(auth)) return auth;

  const nextAuth = process.env.NEXTAUTH_SECRET?.trim();
  if (nextAuth && !isWeakAuthSecret(nextAuth)) return nextAuth;

  // Em não-produção ainda aceita o valor configurado (mesmo fraco) para não
  // quebrar sessões locais antigas — mas preferimos o fallback explícito.
  if (auth) return auth;
  if (nextAuth) return nextAuth;
  return null;
}

/** Segredo HS256 para ecopet-session (middleware Edge + API routes). */
export function resolveAuthSecret(): string {
  const configured = pickConfiguredSecret();
  if (configured) {
    if (IS_PROD && !IS_BUILD && isWeakAuthSecret(configured)) {
      throw new Error(
        "[env] AUTH_SECRET/NEXTAUTH_SECRET é placeholder ou curto demais — gere com: openssl rand -base64 32"
      );
    }
    return configured;
  }

  if (IS_PROD && !IS_BUILD) {
    throw new Error(
      "[env] Segredo de sessão ausente em produção: defina AUTH_SECRET ou NEXTAUTH_SECRET"
    );
  }

  return DEV_FALLBACK;
}
