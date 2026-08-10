/**
 * FASE 4.3 — Production environment gate (sem revelar secrets).
 *
 * Uso:
 *   node scripts/check-production-environment.mjs
 *   node scripts/check-production-environment.mjs --env-file apps/web/.env.production.pull
 *   PRODUCTION_ENV_FILE=... node scripts/check-production-environment.mjs
 *
 * Exit 0 → PRODUCTION_ENVIRONMENT_READY
 * Exit 1 → PRODUCTION_ENVIRONMENT_BLOCKED
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const PLACEHOLDER_RE =
  /^(?:change-me|changeme|todo|fix|xxx|your[_-]?|<.*>|\[SENSITIVE\]|placeholder|example)/i;

const FORBIDDEN_URL_FRAGMENTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "homolog.eccopet.com",
  ".vercel.app", // Production deve usar domínio canônico, não deployment URL
];

const REQUIRED = [
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "APP_URL",
  "NEXT_PUBLIC_APP_URL",
  "WEB_URL",
  "PAYMENT_PROVIDER",
];

/** Só obrigatórias quando PAYMENT_PROVIDER=mercado_pago (Live). COD/manual: omitir tokens TEST. */
const REQUIRED_IF_MERCADO_PAGO = [
  "MERCADO_PAGO_ACCESS_TOKEN",
  "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY",
  "MERCADO_PAGO_WEBHOOK_SECRET",
  "MERCADO_PAGO_ENVIRONMENT",
];

const FORBIDDEN_PRESENT = [
  "E2E_TEST_MODE",
  "E2E_TEST_SECRET",
  "TURNSTILE_ALLOW_CLOUDFLARE_TEST_KEYS",
  "TURNSTILE_DEV_BYPASS",
  "AUTH_RATE_LIMIT_DISABLED",
  "AUTH_TEST_EXPOSE_OTP",
  "ALLOW_TEST_RESEND",
  "FORCE_INSECURE_SESSION_COOKIE",
  "ECOPET_STABLE_TEST_SERVER",
];

const FORBIDDEN_TRUE = [
  "ALLOW_SIMULATED_PAYMENTS",
  "AUTH_RATE_LIMIT_DISABLED",
  "TURNSTILE_DEV_BYPASS",
  "UPLOAD_DEV_FALLBACK",
];

function parseEnvFile(file) {
  if (!file || !fs.existsSync(file)) return null;
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, i).trim()] = v;
  }
  return out;
}

function resolveEnvFile() {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--env-file");
  if (idx >= 0) return args[idx + 1];
  const positional = args.find((a) => !a.startsWith("--"));
  return positional || process.env.PRODUCTION_ENV_FILE || "";
}

function truthy(v) {
  if (v == null || v === "") return false;
  return v === "1" || String(v).toLowerCase() === "true" || String(v).toLowerCase() === "yes";
}

function fp(v) {
  if (!v) return null;
  return crypto.createHash("sha256").update(String(v), "utf8").digest("hex").slice(0, 8);
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function looksLikeTestMpToken(token) {
  if (!token) return false;
  const t = String(token);
  if (t === "[SENSITIVE]") return null; // unknown
  if (/^TEST-/i.test(t)) return true;
  if (/TEST/i.test(t) && !/^APP_USR-/i.test(t)) return true;
  return false;
}

function looksLikeSandboxEnv(envName) {
  const v = String(envName || "").toLowerCase();
  return v === "test" || v === "sandbox" || v === "dev" || v === "development";
}

function loadEnv() {
  const file = resolveEnvFile();
  if (file) {
    const parsed = parseEnvFile(path.resolve(file));
    if (!parsed) {
      console.error(JSON.stringify({ ok: false, error: "ENV_FILE_MISSING", file }, null, 2));
      process.exit(1);
    }
    return { env: parsed, source: file };
  }
  return { env: { ...process.env }, source: "(process.env)" };
}

const { env, source } = loadEnv();
const blockers = [];
const warnings = [];
const meta = {
  source,
  checks: {},
  fingerprints: {},
};

for (const key of REQUIRED) {
  const v = env[key]?.trim?.() || env[key];
  const present = Boolean(v && String(v).trim());
  meta.checks[`required:${key}`] = present ? "PRESENT" : "MISSING";
  if (!present) blockers.push(`MISSING:${key}`);
  else if (PLACEHOLDER_RE.test(String(v).trim())) blockers.push(`PLACEHOLDER:${key}`);
  else if (key.includes("SECRET") || key.includes("TOKEN") || key.includes("URL") || key === "DATABASE_URL" || key === "DIRECT_URL") {
    meta.fingerprints[key] = {
      len: String(v).length,
      sha8: fp(String(v).trim()),
    };
  }
}

const paymentProvider = String(env.PAYMENT_PROVIDER || "")
  .trim()
  .toLowerCase();
const mpOnline =
  paymentProvider === "mercado_pago" || paymentProvider === "mercadopago";
meta.checks.paymentMode = mpOnline ? "MERCADO_PAGO" : paymentProvider || "UNSET";

if (mpOnline) {
  for (const key of REQUIRED_IF_MERCADO_PAGO) {
    const v = env[key]?.trim?.() || env[key];
    const present = Boolean(v && String(v).trim());
    meta.checks[`requiredIfMp:${key}`] = present ? "PRESENT" : "MISSING";
    if (!present) blockers.push(`MISSING:${key}`);
    else if (PLACEHOLDER_RE.test(String(v).trim())) blockers.push(`PLACEHOLDER:${key}`);
  }
} else {
  for (const key of REQUIRED_IF_MERCADO_PAGO) {
    meta.checks[`requiredIfMp:${key}`] = "SKIPPED_COD_MANUAL";
  }
  // Tokens TEST/sandbox em Production com COD são risco de UI residual — bloquear.
  const mpTok = env.MERCADO_PAGO_ACCESS_TOKEN;
  const testTok = looksLikeTestMpToken(mpTok);
  if (testTok === true) blockers.push("MP_TEST_TOKEN_PRESENT_WITH_COD_MODE");
  const mpPub = env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || env.MERCADO_PAGO_PUBLIC_KEY;
  if (mpPub && /^TEST-/i.test(String(mpPub))) {
    blockers.push("MP_TEST_PUBLIC_KEY_PRESENT_WITH_COD_MODE");
  }
}

for (const key of FORBIDDEN_PRESENT) {
  if (env[key] != null && String(env[key]).trim() !== "") {
    blockers.push(`FORBIDDEN_PRESENT:${key}`);
    meta.checks[`forbidden:${key}`] = "PRESENT";
  } else {
    meta.checks[`forbidden:${key}`] = "ABSENT_OK";
  }
}

for (const key of FORBIDDEN_TRUE) {
  if (truthy(env[key])) {
    blockers.push(`FORBIDDEN_TRUE:${key}`);
    meta.checks[`forbiddenTrue:${key}`] = "TRUE";
  } else {
    meta.checks[`forbiddenTrue:${key}`] = "FALSE_OR_ABSENT_OK";
  }
}

const urlKeys = ["NEXTAUTH_URL", "APP_URL", "NEXT_PUBLIC_APP_URL", "WEB_URL"];
for (const key of urlKeys) {
  const v = env[key];
  if (!v) continue;
  const lower = String(v).toLowerCase();
  for (const frag of FORBIDDEN_URL_FRAGMENTS) {
    if (lower.includes(frag.toLowerCase())) {
      blockers.push(`FORBIDDEN_URL:${key}:${frag}`);
    }
  }
  if (!/^https:\/\//i.test(String(v))) {
    blockers.push(`URL_NOT_HTTPS:${key}`);
  }
  const host = hostOf(v);
  meta.checks[`urlHost:${key}`] = host || "INVALID";
  if (host && !/(^|\.)eccopet\.com$/i.test(host) && host !== "www.eccopet.com") {
    warnings.push(`URL_HOST_UNEXPECTED:${key}:${host}`);
  }
}

if (mpOnline) {
  const mpEnv = env.MERCADO_PAGO_ENVIRONMENT;
  if (mpEnv && looksLikeSandboxEnv(mpEnv)) {
    blockers.push("MP_ENVIRONMENT_NOT_PRODUCTION");
  }
  if (mpEnv && String(mpEnv).toLowerCase() !== "production") {
    blockers.push(`MP_ENVIRONMENT_VALUE:${String(mpEnv)}`);
  }

  const mpTok = env.MERCADO_PAGO_ACCESS_TOKEN;
  const testTok = looksLikeTestMpToken(mpTok);
  if (testTok === true) blockers.push("MP_ACCESS_TOKEN_LOOKS_TEST");
  if (testTok === null) warnings.push("MP_ACCESS_TOKEN_REDACTED_CANNOT_CLASSIFY");

  const mpPub = env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || env.MERCADO_PAGO_PUBLIC_KEY;
  if (mpPub && /^TEST-/i.test(String(mpPub))) {
    blockers.push("MP_PUBLIC_KEY_LOOKS_TEST");
  }
}

const dbHost = hostOf(env.DATABASE_URL || "");
const directHost = hostOf(env.DIRECT_URL || "");
meta.checks.databaseHost = dbHost || "INVALID";
meta.checks.directHost = directHost || "INVALID";
if (dbHost && /homolog|preview|localhost/i.test(dbHost)) {
  blockers.push("DATABASE_HOST_LOOKS_NON_PRODUCTION");
}
if (
  env.DATABASE_URL &&
  env.DIRECT_URL &&
  env.DATABASE_URL.trim() === env.DIRECT_URL.trim()
) {
  warnings.push("DATABASE_URL_EQUALS_DIRECT_URL");
}

// Flags financeiras — Production deve ser explícita e conservadora
const flagExpectations = {
  FINANCIAL_LEDGER_ENABLED: true,
  PAYOUTS_ENABLED: false,
  MANUAL_PAYOUT_APPROVAL_REQUIRED: true,
  RESERVE_ENABLED: true,
  CHARGEBACKS_ENABLED: true,
  DAILY_RECONCILIATION_ENABLED: true,
};
for (const [k, expected] of Object.entries(flagExpectations)) {
  const raw = env[k];
  if (raw == null || String(raw).trim() === "") {
    warnings.push(`FINANCIAL_FLAG_UNSET:${k}:default_may_be_off_on_vercel_production`);
    meta.checks[`flag:${k}`] = "UNSET";
    continue;
  }
  const val = truthy(raw);
  meta.checks[`flag:${k}`] = val ? "true" : "false";
  if (val !== expected) {
    if (k === "PAYOUTS_ENABLED" && val === true) {
      blockers.push("PAYOUTS_ENABLED_TRUE_NOT_CONSERVATIVE");
    } else {
      warnings.push(`FINANCIAL_FLAG_UNEXPECTED:${k}:got=${val}:expected=${expected}`);
    }
  }
}

if (paymentProvider && !mpOnline && !/^(none|manual)$/i.test(paymentProvider)) {
  warnings.push(`PAYMENT_PROVIDER:${env.PAYMENT_PROVIDER}`);
}
if (paymentProvider === "none" || paymentProvider === "manual") {
  warnings.push("PAYMENT_MODE_COD_MANUAL_ONLINE_DISABLED");
}

const ready = blockers.length === 0;
const verdict = ready
  ? "PRODUCTION_ENVIRONMENT_READY"
  : "PRODUCTION_ENVIRONMENT_BLOCKED";

const report = {
  verdict,
  ready,
  source,
  blockerCount: blockers.length,
  warningCount: warnings.length,
  blockers,
  warnings,
  meta,
  note: "Nenhum secret impresso. Use --env-file com pull Production (Sensitive pode vir como [SENSITIVE]).",
};

console.log(JSON.stringify(report, null, 2));
process.exit(ready ? 0 : 1);
