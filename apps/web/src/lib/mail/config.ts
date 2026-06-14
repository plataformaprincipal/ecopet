export type MailProviderPreset =
  | "gmail"
  | "outlook"
  | "hotmail"
  | "microsoft365"
  | "hostinger"
  | "zoho"
  | "custom";

export const MAIL_PROVIDER_PRESETS: Record<
  MailProviderPreset,
  { host: string; port: number; label: string }
> = {
  gmail: { host: "smtp.gmail.com", port: 587, label: "Gmail" },
  outlook: { host: "smtp.office365.com", port: 587, label: "Outlook" },
  hotmail: { host: "smtp.office365.com", port: 587, label: "Hotmail" },
  microsoft365: { host: "smtp.office365.com", port: 587, label: "Microsoft 365" },
  hostinger: { host: "smtp.hostinger.com", port: 465, label: "Hostinger" },
  zoho: { host: "smtp.zoho.com", port: 587, label: "Zoho" },
  custom: { host: "", port: 587, label: "SMTP customizado" },
};

export type ResolvedMailConfig = {
  provider: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  fromName: string;
  fromEmail: string;
  appUrl: string;
};

export class MailConfigurationError extends Error {
  readonly code = "MAIL_CONFIG";
  readonly missing: string[];

  constructor(message: string, missing: string[] = []) {
    super(message);
    this.name = "MailConfigurationError";
    this.missing = missing;
  }
}

function env(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

/** secure=true somente na porta 465; porta 587 sempre false. */
export function resolveSecure(port: number): boolean {
  if (port === 465) return true;
  if (port === 587) return false;
  return env("SMTP_SECURE") === "true";
}

export function detectProviderFromHost(host: string): string {
  const h = host.toLowerCase();
  if (h.includes("gmail")) return "Gmail";
  if (h.includes("office365") || h.includes("outlook") || h.includes("hotmail") || h.includes("live.com"))
    return "Outlook / Microsoft 365";
  if (h.includes("hostinger")) return "Hostinger";
  if (h.includes("zoho")) return "Zoho";
  return "SMTP customizado";
}

export function resolveFromAddress(): { from: string; fromName: string; fromEmail: string } {
  const legacyFrom = env("SMTP_FROM");
  const fromName = env("SMTP_FROM_NAME") || "EcoPet";
  const fromEmail = env("SMTP_FROM_EMAIL") || env("SMTP_USER") || "";

  if (legacyFrom?.includes("<")) {
    const match = legacyFrom.match(/^(.+?)\s*<([^>]+)>$/);
    if (match) {
      return { from: legacyFrom, fromName: match[1].trim(), fromEmail: match[2].trim() };
    }
  }

  if (legacyFrom?.includes("@")) {
    return { from: legacyFrom, fromName, fromEmail: legacyFrom };
  }

  if (!fromEmail) {
    return { from: fromName, fromName, fromEmail: "" };
  }

  return { from: `${fromName} <${fromEmail}>`, fromName, fromEmail };
}

export function getAppUrl(): string {
  return (env("APP_URL") || env("NEXTAUTH_URL") || "http://localhost:3000").replace(/\/$/, "");
}

export function missingSmtpEnvVars(): string[] {
  const missing: string[] = [];
  const providerKey = (env("MAIL_PROVIDER")?.toLowerCase() || "custom") as MailProviderPreset;
  const preset = MAIL_PROVIDER_PRESETS[providerKey] ?? MAIL_PROVIDER_PRESETS.custom;

  if (!env("SMTP_HOST") && !preset.host) missing.push("SMTP_HOST");
  if (!env("SMTP_PORT") && providerKey === "custom") missing.push("SMTP_PORT");
  if (!env("SMTP_USER")) missing.push("SMTP_USER");
  if (!env("SMTP_PASS")) missing.push("SMTP_PASS");

  const { fromEmail } = resolveFromAddress();
  if (!fromEmail) missing.push("SMTP_FROM_EMAIL ou SMTP_USER");

  if (!env("APP_URL") && !env("NEXTAUTH_URL")) missing.push("APP_URL");

  return missing;
}

export function isSmtpFullyConfigured(): boolean {
  return missingSmtpEnvVars().length === 0;
}

export function resolveMailConfig(): ResolvedMailConfig {
  const missing = missingSmtpEnvVars();
  if (missing.length > 0) {
    throw new MailConfigurationError(`Configuração SMTP incompleta: ${missing.join(", ")}`, missing);
  }

  const providerKey = (env("MAIL_PROVIDER")?.toLowerCase() || "custom") as MailProviderPreset;
  const preset = MAIL_PROVIDER_PRESETS[providerKey] ?? MAIL_PROVIDER_PRESETS.custom;

  const host = env("SMTP_HOST") || preset.host;
  if (!host) {
    throw new MailConfigurationError(`SMTP_HOST obrigatório para provedor ${providerKey}.`);
  }

  const port = Number(env("SMTP_PORT") || String(preset.port));
  if (!Number.isFinite(port) || port <= 0) {
    throw new MailConfigurationError("SMTP_PORT inválida.");
  }

  const { from, fromName, fromEmail } = resolveFromAddress();

  return {
    provider: preset.label !== "SMTP customizado" ? preset.label : detectProviderFromHost(host),
    host,
    port,
    secure: resolveSecure(port),
    user: env("SMTP_USER")!,
    pass: env("SMTP_PASS")!,
    from,
    fromName,
    fromEmail,
    appUrl: getAppUrl(),
  };
}

export function logSmtpError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const safe = message.replace(/pass(word)?[:=]\S+/gi, "pass=***");
  console.error(`[${context}] ${safe}`);
  if (error && typeof error === "object") {
    const smtpErr = error as { code?: string; command?: string; response?: string; responseCode?: number };
    console.error(`[${context}:smtp]`, {
      code: smtpErr.code,
      command: smtpErr.command,
      responseCode: smtpErr.responseCode,
      response: smtpErr.response,
      message: safe,
    });
  }
}

/** Alias para compatibilidade com código legado. */
export const missingSmtpVars = missingSmtpEnvVars;
export const isSmtpConfigured = isSmtpFullyConfigured;
export const resolveSmtpConfig = resolveMailConfig;
