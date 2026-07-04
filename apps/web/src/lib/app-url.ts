/**
 * URL pública do app — evita usar localhost em produção/Vercel quando
 * variáveis foram copiadas do .env de desenvolvimento.
 */
function trimUrl(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v.replace(/\/$/, "") : undefined;
}

export function isLocalhostUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/** URL pública preferida (HTTPS em Vercel). */
export function resolvePublicAppUrl(): string {
  const vercelProduction = trimUrl(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined
  );
  const vercelPreview = trimUrl(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  );

  const candidates = [
    trimUrl(process.env.NEXTAUTH_URL),
    trimUrl(process.env.NEXT_PUBLIC_APP_URL),
    trimUrl(process.env.APP_URL),
    vercelProduction,
    vercelPreview,
  ].filter(Boolean) as string[];

  if (process.env.VERCEL) {
    const nonLocal = candidates.find((u) => !isLocalhostUrl(u));
    if (nonLocal) return nonLocal;
  }

  return candidates[0] ?? "http://localhost:3000";
}

/** HTTPS na borda (Vercel) ou URL pública explícita https:// */
export function isProductionHttps(): boolean {
  if (process.env.VERCEL === "1") return true;
  return resolvePublicAppUrl().toLowerCase().startsWith("https://");
}
