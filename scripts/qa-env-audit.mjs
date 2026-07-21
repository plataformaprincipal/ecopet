/**
 * Relata presença de env de integração SEM imprimir valores secretos.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [".env", "apps/web/.env", "apps/web/.env.local"];

const keys = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "OPENAI_API_KEY",
  "AI_ENABLED",
  "TALKJS_APP_ID",
  "TALKJS_SECRET_KEY",
  "TALKJS_MODE",
  "MERCADO_PAGO_ACCESS_TOKEN",
  "PAYMENT_PROVIDER",
  "MP_ENVIRONMENT",
  "BETTERSTACK_SOURCE_TOKEN",
  "LOGTAIL_SOURCE_TOKEN",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "FIREBASE_PROJECT_ID",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "RESEND_API_KEY",
  "SMTP_HOST",
  "GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  "NEXT_PUBLIC_GTM_ID",
  "TURNSTILE_SECRET_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "AUTH_RATE_LIMIT_RELAXED",
  "NEXT_PUBLIC_APP_URL",
  "NEXTAUTH_URL",
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^['"]|['"]$/g, "").trim();
  }
  return out;
}

const env = {};
for (const f of files) {
  Object.assign(env, loadEnvFile(path.join(root, f)));
}

function status(v) {
  if (!v) return "MISSING";
  const lower = v.toLowerCase();
  if (lower.includes("your_") || lower === "changeme" || lower === "xxx") return "PLACEHOLDER";
  if (["false", "0", "none", "disabled", "off"].includes(lower)) return `SET(${v})`;
  return "SET";
}

const report = Object.fromEntries(keys.map((k) => [k, status(env[k])]));
console.log(JSON.stringify({ filesChecked: files, report }, null, 2));
