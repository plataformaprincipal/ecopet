/**
 * Configuração centralizada de e-mail (Resend).
 * Nunca hardcodear chaves ou expor segredos.
 */

function env(key: string, source: NodeJS.ProcessEnv = process.env): string | undefined {
  const value = source[key]?.trim();
  return value || undefined;
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.toLowerCase();
  return (
    v.includes("xxxxxxxxx") ||
    v.includes("your_") ||
    v.includes("changeme") ||
    v === "re_xxx" ||
    v.startsWith("re_xxxx")
  );
}

export type EmailProviderName = "resend" | "smtp" | "none";

export function getEmailProvider(source: NodeJS.ProcessEnv = process.env): EmailProviderName {
  const raw = (env("EMAIL_PROVIDER", source) || "resend").toLowerCase();
  if (raw === "smtp") return "smtp";
  if (raw === "none" || raw === "off") return "none";
  return "resend";
}

/** API key Resend — apenas server-side. Nunca logar o valor. */
export function getResendApiKey(source: NodeJS.ProcessEnv = process.env): string | undefined {
  const key = env("RESEND_API_KEY", source);
  if (!key || isPlaceholder(key)) return undefined;
  return key;
}

export function getEmailFromName(source: NodeJS.ProcessEnv = process.env): string {
  return env("EMAIL_FROM_NAME", source) || env("SMTP_FROM_NAME", source) || "EcoPet";
}

/**
 * Remetente — variáveis apenas (sem hardcode de domínio de produção).
 * Fallback seguro para sandbox Resend quando EMAIL_FROM ausente.
 */
export function getEmailFromAddress(source: NodeJS.ProcessEnv = process.env): string {
  const from =
    env("EMAIL_FROM", source) ||
    env("RESEND_FROM_EMAIL", source) ||
    env("RESEND_FROM", source) ||
    env("SMTP_FROM_EMAIL", source);

  if (from && !isPlaceholder(from)) {
    if (from.includes("<")) return from;
    const name = getEmailFromName(source);
    return `${name} <${from}>`;
  }

  return `${getEmailFromName(source)} <onboarding@resend.dev>`;
}

export function getEmailFromRaw(source: NodeJS.ProcessEnv = process.env): string {
  return (
    env("EMAIL_FROM", source) ||
    env("RESEND_FROM_EMAIL", source) ||
    env("RESEND_FROM", source) ||
    "onboarding@resend.dev"
  );
}

export function getEmailReplyTo(source: NodeJS.ProcessEnv = process.env): string | undefined {
  return env("EMAIL_REPLY_TO", source) || env("EMAIL_SUPPORT", source);
}

export function getEmailSupportAddress(source: NodeJS.ProcessEnv = process.env): string {
  return env("EMAIL_SUPPORT", source) || env("EMAIL_REPLY_TO", source) || "suporte@ecopet.com";
}

/** Domínio customizado marcado como verificado no Resend (DNS propagado). */
export function isEmailDomainVerified(source: NodeJS.ProcessEnv = process.env): boolean {
  const flag = env("EMAIL_DOMAIN_VERIFIED", source)?.toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export function isResendSandboxFrom(from: string): boolean {
  const lower = from.toLowerCase();
  return lower.includes("@resend.dev") || lower.includes("onboarding@resend.dev");
}

export function isResendConfigured(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(getResendApiKey(source));
}
