/**
 * Presence/host audit of a pulled Production env file.
 * Never prints values. Isolated from local .env.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const fromEnv = process.argv.includes("--from-env");
const fileArg = process.argv.find((a, i) => i >= 2 && !a.startsWith("--"));
const file = fileArg
  ? path.resolve(fileArg)
  : path.join(root, ".ecopet", "vercel-production.env");

const env = {};
if (fromEnv) {
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === "string") env[k] = v;
  }
} else {
  if (!fs.existsSync(file)) {
    console.error("ENV_FILE_MISSING");
    process.exit(1);
  }
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = v;
  }
}

function present(key) {
  const v = env[key];
  return Boolean(typeof v === "string" && v.trim());
}

function hostOf(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || (u.protocol === "https:" ? "443" : u.protocol === "postgresql:" || u.protocol === "postgres:" ? "5432" : "")}`;
  } catch {
    return "(invalid-or-empty)";
  }
}

function sanitizeRef(url) {
  try {
    const host = new URL(url).hostname;
    const m =
      host.match(/postgres\.([a-z0-9]+)\./i) ||
      host.match(/^db\.([a-z0-9]+)\./i) ||
      host.match(/^([a-z0-9]{8,})\./i);
    if (!m) return host.replace(/^(.{6}).+(.{6})$/, "$1…$2");
    const ref = m[1];
    return `${ref.slice(0, 4)}…${ref.slice(-4)}`;
  } catch {
    return "(invalid)";
  }
}

const keys = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "OPENAI_API_KEY",
  "OPENAI_SEND_PROJECT",
  "OPENAI_PROJECT_ID",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "NEXT_PUBLIC_TALKJS_APP_ID",
  "TALKJS_SECRET_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "SMS_PROVIDER",
  "MERCADO_PAGO_ACCESS_TOKEN",
  "MERCADO_PAGO_WEBHOOK_SECRET",
  "MERCADO_PAGO_CLIENT_ID",
  "MERCADO_PAGO_CLIENT_SECRET",
  "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY",
  "PAYMENT_PROVIDER",
  "DATABASE_URL",
  "DIRECT_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "AUTH_RATE_LIMIT_RELAXED",
  "ECOPET_STABLE_TEST_SERVER",
  "PRICING_MEMORY_FALLBACK",
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  "NEXT_PUBLIC_GTM_ID",
  "FACEBOOK_CLIENT_ID",
  "FACEBOOK_CLIENT_SECRET",
  "APPLE_CLIENT_ID",
  "APPLE_CLIENT_SECRET",
];

console.log("=== production presence ===");
for (const k of keys) {
  const v = env[k];
  const redacted = v === "[SENSITIVE]" || (typeof v === "string" && v.includes("SENSITIVE"));
  console.log(`${k}:${present(k) ? (redacted ? "present-redacted" : "present") : "missing"}`);
}

console.log("=== production db hosts ===");
console.log("DATABASE_URL host", hostOf(env.DATABASE_URL || ""));
console.log("DATABASE_URL ref", sanitizeRef(env.DATABASE_URL || ""));
console.log("DIRECT_URL host", hostOf(env.DIRECT_URL || ""));
console.log("DIRECT_URL ref", sanitizeRef(env.DIRECT_URL || ""));

const pub = Object.keys(env).filter((k) => k.startsWith("NEXT_PUBLIC_"));
const suspicious = pub.filter(
  (k) =>
    /SECRET|PRIVATE_KEY|PASSWORD|SERVICE_ROLE|ACCESS_TOKEN|REFRESH_TOKEN/i.test(k) &&
    !/PUBLIC_KEY|MEASUREMENT|VAPID_PUBLIC|TALKJS_APP_ID|MAPS_API_KEY|FIREBASE|GTM|GA_/i.test(
      k,
    ),
);
console.log("NEXT_PUBLIC count", pub.length);
console.log("NEXT_PUBLIC names", pub.sort().join(","));
console.log("NEXT_PUBLIC suspicious", suspicious.join(",") || "none");
console.log("key count", Object.keys(env).length);
