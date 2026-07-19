import type { TurnstileEnvironment } from "./types";

const DEFAULT_PRODUCTION_HOSTNAMES = [
  "eccopet.com",
  "www.eccopet.com",
  "ecopet.com",
  "www.ecopet.com",
] as const;

function env(key: string, source: NodeJS.ProcessEnv = process.env): string | undefined {
  const v = source[key]?.trim();
  return v || undefined;
}

export function detectTurnstileEnvironment(
  source: NodeJS.ProcessEnv = process.env
): TurnstileEnvironment {
  const vercelEnv = env("VERCEL_ENV", source)?.toLowerCase();
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  if (source.NODE_ENV === "production" && vercelEnv !== "preview") return "production";
  if (vercelEnv === "development") return "development";
  return source.NODE_ENV === "production" ? "production" : "development";
}

/**
 * Hostnames permitidos para validação do campo `hostname` do siteverify.
 * Produção: lista explícita (nunca localhost).
 * Preview: hostnames da lista + VERCEL_URL + sufixo vercel.app se configurado.
 * Desenvolvimento: localhost + 127.0.0.1 + lista.
 */
export function getTurnstileAllowedHostnames(
  source: NodeJS.ProcessEnv = process.env
): string[] {
  const envList = env("TURNSTILE_ALLOWED_HOSTNAMES", source);
  const fromEnv = envList
    ? envList
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const environment = detectTurnstileEnvironment(source);
  const appUrlHost = hostnameFromUrl(env("NEXT_PUBLIC_APP_URL", source) || env("APP_URL", source));
  const vercelUrl = env("VERCEL_URL", source)?.toLowerCase().replace(/^https?:\/\//, "");

  const base = new Set<string>([
    ...DEFAULT_PRODUCTION_HOSTNAMES,
    ...fromEnv,
    ...(appUrlHost ? [appUrlHost] : []),
  ]);

  if (environment === "development") {
    base.add("localhost");
    base.add("127.0.0.1");
  }

  if (environment === "preview") {
    if (vercelUrl) base.add(vercelUrl);
    // Previews autorizadas via lista explícita; não aceitar *.vercel.app em produção.
    const previewAllow = env("TURNSTILE_PREVIEW_HOSTNAMES", source);
    if (previewAllow) {
      for (const h of previewAllow.split(",")) {
        const t = h.trim().toLowerCase();
        if (t) base.add(t);
      }
    }
  }

  return [...base];
}

export function hostnameFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function extractRequestHostname(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim().toLowerCase();
    if (first) return first.replace(/:\d+$/, "");
  }
  const host = request.headers.get("host");
  if (host) return host.trim().toLowerCase().replace(/:\d+$/, "");
  return null;
}

export function isHostnameAllowed(
  hostname: string | undefined | null,
  allowed: string[]
): boolean {
  if (!hostname) return false;
  const h = hostname.toLowerCase().replace(/:\d+$/, "");
  return allowed.some((a) => a === h || (a.startsWith("*.") && h.endsWith(a.slice(1))));
}
