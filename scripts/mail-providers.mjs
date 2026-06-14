/** Presets SMTP — espelha apps/web/src/lib/mail/config.ts */
export const MAIL_PROVIDER_PRESETS = {
  gmail: { host: "smtp.gmail.com", port: 587, label: "Gmail" },
  outlook: { host: "smtp.office365.com", port: 587, label: "Outlook" },
  hotmail: { host: "smtp.office365.com", port: 587, label: "Hotmail" },
  microsoft365: { host: "smtp.office365.com", port: 587, label: "Microsoft 365" },
  hostinger: { host: "smtp.hostinger.com", port: 465, label: "Hostinger" },
  zoho: { host: "smtp.zoho.com", port: 587, label: "Zoho" },
  custom: { host: "", port: 587, label: "SMTP customizado" },
};

export function resolveSecure(port) {
  if (port === 465) return true;
  if (port === 587) return false;
  return process.env.SMTP_SECURE === "true";
}

export function applyMailProvider(env) {
  const key = (env.MAIL_PROVIDER || "custom").toLowerCase();
  const preset = MAIL_PROVIDER_PRESETS[key] || MAIL_PROVIDER_PRESETS.custom;
  if (!env.SMTP_HOST?.trim() && preset.host) env.SMTP_HOST = preset.host;
  if (!env.SMTP_PORT?.trim() && preset.port) env.SMTP_PORT = String(preset.port);
  return preset;
}

export function detectSmtpProvider(host) {
  const h = (host || "").toLowerCase();
  if (h.includes("gmail")) return "Gmail";
  if (h.includes("office365") || h.includes("outlook") || h.includes("hotmail") || h.includes("live.com"))
    return "Outlook / Microsoft 365";
  if (h.includes("hostinger")) return "Hostinger";
  if (h.includes("zoho")) return "Zoho";
  return "SMTP customizado";
}

export function resolveSmtpFrom(env = process.env) {
  if (env.SMTP_FROM?.trim()) return env.SMTP_FROM.trim();
  const name = env.SMTP_FROM_NAME?.trim() || "EcoPet";
  const email = env.SMTP_FROM_EMAIL?.trim() || env.SMTP_USER?.trim();
  if (email) return `${name} <${email}>`;
  return null;
}

export function requiredSmtpVars(env = process.env) {
  applyMailProvider(env);
  const missing = [];
  for (const k of ["APP_URL", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"]) {
    if (!env[k]?.trim()) missing.push(k);
  }
  if (!resolveSmtpFrom(env)) missing.push("SMTP_FROM_EMAIL ou SMTP_USER");
  return missing;
}
