/**
 * Verifica ambiente Preview de homologação sem exibir secrets.
 *
 * Uso:
 *   node scripts/check-preview-environment.mjs [path/.env.preview]
 *   PREVIEW_ENV_FILE=... PRODUCTION_ENV_FILE=... node scripts/check-preview-environment.mjs
 *
 * Também aceita variáveis já exportadas no process.env (sem arquivo).
 *
 * Exit 0 = OK para avançar (critérios mínimos).
 * Exit ≠ 0 = bloqueio.
 */
import fs from "fs";
import crypto from "crypto";
import path from "path";

const REQUIRED = [
  "DATABASE_URL",
  "DIRECT_URL",
  "MERCADO_PAGO_ACCESS_TOKEN",
  "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY",
  "MERCADO_PAGO_WEBHOOK_SECRET",
  "PAYMENT_PROVIDER",
  "FINANCIAL_LEDGER_ENABLED",
  "PAYOUTS_ENABLED",
  "MANUAL_PAYOUT_APPROVAL_REQUIRED",
  "RESERVE_ENABLED",
  "CHARGEBACKS_ENABLED",
  "DAILY_RECONCILIATION_ENABLED",
  "APP_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXTAUTH_URL",
  "WEB_URL",
];

const FINANCIAL_EXPECTED = {
  FINANCIAL_LEDGER_ENABLED: true,
  PAYOUTS_ENABLED: true,
  MANUAL_PAYOUT_APPROVAL_REQUIRED: true,
  RESERVE_ENABLED: true,
  CHARGEBACKS_ENABLED: true,
  DAILY_RECONCILIATION_ENABLED: false,
};

function parseEnvFile(file) {
  if (!file || !fs.existsSync(file)) return {};
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
    out[line.slice(0, i)] = v;
  }
  return out;
}

function loadPreviewEnv() {
  const fromArg = process.argv[2];
  const fromEnv = process.env.PREVIEW_ENV_FILE;
  const file = fromArg || fromEnv || "";
  if (file) {
    // Arquivo é a única fonte — evita falsos positivos/negativos do process.env local
    const fileVars = parseEnvFile(path.resolve(file));
    return { ...fileVars, __sourceFile: file, VERCEL_ENV: fileVars.VERCEL_ENV || "preview" };
  }
  return { ...process.env, __sourceFile: "(process.env)" };
}

function loadProductionEnv() {
  const file = process.env.PRODUCTION_ENV_FILE || "";
  return file ? parseEnvFile(path.resolve(file)) : {};
}

function present(v) {
  return typeof v === "string" && v.trim().length > 0 && v !== "[SENSITIVE]";
}

function envBool(v) {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return true;
  if (["0", "false", "no", "off"].includes(s)) return false;
  return null;
}

function fingerprint(value) {
  if (!present(value)) return "ausente";
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function safeHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return "(inválido)";
  }
}

function isLocalhostUrl(url) {
  if (!present(url)) return true;
  try {
    const u = new URL(url);
    return (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "0.0.0.0" ||
      u.hostname.endsWith(".local")
    );
  } catch {
    return true;
  }
}

function isTestMpCredential(value) {
  if (!present(value)) return false;
  // Mercado Pago sandbox: TEST-... (access token / public key)
  return value.startsWith("TEST-") || value.includes("-TEST-");
}

function line(ok, msg) {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
}

const preview = loadPreviewEnv();
const production = loadProductionEnv();
let blocked = false;
const blockers = [];

function fail(msg) {
  blocked = true;
  blockers.push(msg);
  line(false, msg);
}

function ok(msg) {
  line(true, msg);
}

console.log("=== check-preview-environment ===");
console.log(`Fonte Preview: ${preview.__sourceFile}`);
if (process.env.PRODUCTION_ENV_FILE) {
  console.log(`Fonte Production (comparação): ${process.env.PRODUCTION_ENV_FILE}`);
}
console.log("");

// Presença
for (const key of REQUIRED) {
  if (present(preview[key])) {
    ok(`${key}: presente`);
  } else {
    fail(`${key}: ausente ou redigido`);
  }
}

// Database fingerprints
const dbFp = fingerprint(preview.DATABASE_URL);
const directFp = fingerprint(preview.DIRECT_URL);
ok(`Database fingerprint: ${dbFp}...`);
ok(`Direct URL fingerprint: ${directFp}...`);
if (present(preview.DATABASE_URL)) {
  ok(`Database host (sanitizado): ${safeHost(preview.DATABASE_URL)}`);
}

if (present(production.DATABASE_URL) && present(preview.DATABASE_URL)) {
  const prodFp = fingerprint(production.DATABASE_URL);
  if (dbFp === prodFp) {
    fail(
      "DATABASE_URL Preview parece igual a Production (fingerprint idêntico) — isolamento bloqueado"
    );
  } else {
    ok(`Database Preview ≠ Production (fp prod ${prodFp}...)`);
  }
}
if (present(production.DIRECT_URL) && present(preview.DIRECT_URL)) {
  if (fingerprint(preview.DIRECT_URL) === fingerprint(production.DIRECT_URL)) {
    fail(
      "DIRECT_URL Preview parece igual a Production (fingerprint idêntico) — isolamento bloqueado"
    );
  } else {
    ok("DIRECT_URL Preview ≠ Production");
  }
}

// Mercado Pago
const mpTok = preview.MERCADO_PAGO_ACCESS_TOKEN || "";
const mpPub = preview.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";
if (isTestMpCredential(mpTok)) {
  ok("Mercado Pago token: TEST confirmado");
} else if (present(mpTok)) {
  fail("Mercado Pago token: não confirma prefixo TEST (bloqueio)");
} else {
  fail("Mercado Pago token: ausente");
}
if (isTestMpCredential(mpPub)) {
  ok("Mercado Pago public key: TEST confirmado");
} else if (present(mpPub)) {
  fail("Mercado Pago public key: não confirma prefixo TEST (bloqueio)");
} else {
  fail("Mercado Pago public key: ausente");
}

const allowSim = envBool(preview.ALLOW_SIMULATED_PAYMENTS);
if (allowSim === true) {
  fail("ALLOW_SIMULATED_PAYMENTS: true (deve ser false ou ausente)");
} else {
  ok(
    `ALLOW_SIMULATED_PAYMENTS: ${
      allowSim === false ? "false" : "ausente (ok)"
    }`
  );
}

const payProvider = (preview.PAYMENT_PROVIDER || "").toLowerCase();
if (payProvider === "mercado_pago" || payProvider === "mercadopago") {
  ok(`PAYMENT_PROVIDER: ${payProvider}`);
} else if (present(preview.PAYMENT_PROVIDER)) {
  fail(`PAYMENT_PROVIDER: valor inesperado (${payProvider || "vazio"})`);
} else {
  fail("PAYMENT_PROVIDER: ausente");
}

// Flags
for (const [key, expected] of Object.entries(FINANCIAL_EXPECTED)) {
  const actual = envBool(preview[key]);
  if (actual === expected) {
    ok(`${key}: ${expected ? "habilitado" : "desabilitado"}`);
  } else if (actual === null) {
    fail(`${key}: ausente (esperado ${expected})`);
  } else {
    fail(`${key}: ${actual} (esperado ${expected})`);
  }
}
if (envBool(preview.FINANCIAL_LEDGER_ENABLED) === true) {
  ok("Financial ledger: habilitado");
}

// URLs públicas
const urlKeys = ["APP_URL", "NEXT_PUBLIC_APP_URL", "NEXTAUTH_URL", "WEB_URL"];
for (const key of urlKeys) {
  const v = preview[key];
  if (!present(v)) {
    fail(`${key}: ausente`);
    continue;
  }
  if (isLocalhostUrl(v)) {
    fail(`${key}: aponta para localhost/inválido (${safeHost(v)})`);
  } else {
    ok(`${key}: host ${safeHost(v)} (não localhost)`);
  }
}

// Ambiente Preview (quando disponível)
const vercelEnv = preview.VERCEL_ENV || process.env.VERCEL_ENV || "";
if (vercelEnv) {
  if (vercelEnv === "preview" || vercelEnv === "development") {
    ok(`Ambiente: ${vercelEnv}`);
  } else if (vercelEnv === "production") {
    fail("Ambiente: production (este check é para Preview/homologação)");
  } else {
    ok(`Ambiente: ${vercelEnv}`);
  }
} else {
  ok("Ambiente: VERCEL_ENV não informado (validação por arquivo Preview)");
}

console.log("");
if (blocked) {
  console.log("RESULTADO: BLOQUEADO");
  console.log(`Motivos: ${blockers.length}`);
  process.exit(2);
}
console.log("RESULTADO: OK — critérios mínimos de Preview satisfeitos");
process.exit(0);
