/**
 * Compara env Preview vs Production sem imprimir secrets.
 * Uso: node scripts/compare-preview-production-env.mjs apps/web/.env.preview.pull apps/web/.env.production.pull
 */
import fs from "fs";
import crypto from "crypto";

function parseEnv(file) {
  const t = fs.readFileSync(file, "utf8");
  const out = {};
  for (const line of t.split(/\r?\n/)) {
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

function host(u) {
  try {
    return new URL(u).host;
  } catch {
    return "(invalid)";
  }
}

function fp(s) {
  if (!s) return "MISSING";
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 12);
}

function prefix(s, n = 8) {
  if (!s) return "MISSING";
  return `${s.slice(0, n)}…(len=${s.length})`;
}

const prevPath = process.argv[2] || "apps/web/.env.preview.pull";
const prodPath = process.argv[3] || "apps/web/.env.production.pull";
const prev = parseEnv(prevPath);
const prod = parseEnv(prodPath);

const mpTokP = prev.MERCADO_PAGO_ACCESS_TOKEN || "";
const mpTokR = prod.MERCADO_PAGO_ACCESS_TOKEN || "";
const mpPubP = prev.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";
const mpPubR = prod.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";

const report = {
  project: "ecopet-web",
  databaseUrlSamePreviewProduction: Boolean(
    prev.DATABASE_URL && prod.DATABASE_URL && prev.DATABASE_URL === prod.DATABASE_URL
  ),
  directUrlSamePreviewProduction: Boolean(
    prev.DIRECT_URL && prod.DIRECT_URL && prev.DIRECT_URL === prod.DIRECT_URL
  ),
  databaseHostPreview: host(prev.DATABASE_URL || ""),
  databaseHostProduction: host(prod.DATABASE_URL || ""),
  databaseHostEqual: host(prev.DATABASE_URL || "") === host(prod.DATABASE_URL || ""),
  databaseFpPreview: fp(prev.DATABASE_URL || ""),
  databaseFpProduction: fp(prod.DATABASE_URL || ""),
  directHostPreview: host(prev.DIRECT_URL || ""),
  directHostProduction: host(prod.DIRECT_URL || ""),
  mpAccessPreviewPrefix: prefix(mpTokP),
  mpAccessProductionPrefix: prefix(mpTokR),
  mpAccessSame: Boolean(mpTokP && mpTokR && mpTokP === mpTokR),
  mpIsTestPreview: Boolean(mpTokP && (mpTokP.startsWith("TEST-") || mpTokP.includes("TEST"))),
  mpIsTestProduction: Boolean(mpTokR && (mpTokR.startsWith("TEST-") || mpTokR.includes("TEST"))),
  mpPublicPreviewPrefix: prefix(mpPubP),
  mpPublicProductionPrefix: prefix(mpPubR),
  mpPublicIsTestPreview: Boolean(mpPubP && (mpPubP.startsWith("TEST-") || mpPubP.includes("TEST"))),
  mpPublicIsTestProduction: Boolean(mpPubR && (mpPubR.startsWith("TEST-") || mpPubR.includes("TEST"))),
  mpPublicSame: Boolean(mpPubP && mpPubR && mpPubP === mpPubR),
  allowSimulatedPreview: prev.ALLOW_SIMULATED_PAYMENTS ?? "(absent)",
  allowSimulatedProduction: prod.ALLOW_SIMULATED_PAYMENTS ?? "(absent)",
  paymentProviderPreview: prev.PAYMENT_PROVIDER || "(absent)",
  paymentProviderProduction: prod.PAYMENT_PROVIDER || "(absent)",
  mpEnvironmentPreview: prev.MERCADO_PAGO_ENVIRONMENT || "(absent)",
  mpEnvironmentProduction: prod.MERCADO_PAGO_ENVIRONMENT || "(absent)",
  webhookSecretPreviewSet: Boolean(prev.MERCADO_PAGO_WEBHOOK_SECRET),
  webhookSecretProductionSet: Boolean(prod.MERCADO_PAGO_WEBHOOK_SECRET),
  webhookSecretSame: Boolean(
    prev.MERCADO_PAGO_WEBHOOK_SECRET &&
      prod.MERCADO_PAGO_WEBHOOK_SECRET &&
      prev.MERCADO_PAGO_WEBHOOK_SECRET === prod.MERCADO_PAGO_WEBHOOK_SECRET
  ),
  financialFlagsPreview: {
    FINANCIAL_LEDGER_ENABLED: prev.FINANCIAL_LEDGER_ENABLED ?? "(absent)",
    PAYOUTS_ENABLED: prev.PAYOUTS_ENABLED ?? "(absent)",
    MANUAL_PAYOUT_APPROVAL_REQUIRED: prev.MANUAL_PAYOUT_APPROVAL_REQUIRED ?? "(absent)",
    RESERVE_ENABLED: prev.RESERVE_ENABLED ?? "(absent)",
    CHARGEBACKS_ENABLED: prev.CHARGEBACKS_ENABLED ?? "(absent)",
    DAILY_RECONCILIATION_ENABLED: prev.DAILY_RECONCILIATION_ENABLED ?? "(absent)",
  },
  appUrlSame: prev.APP_URL === prod.APP_URL,
  webUrlSame: prev.WEB_URL === prod.WEB_URL,
  nextauthUrlSame: prev.NEXTAUTH_URL === prod.NEXTAUTH_URL,
  cloudinarySame:
    Boolean(prev.CLOUDINARY_CLOUD_NAME) &&
    prev.CLOUDINARY_CLOUD_NAME === prod.CLOUDINARY_CLOUD_NAME,
  resendSame: Boolean(prev.RESEND_API_KEY) && prev.RESEND_API_KEY === prod.RESEND_API_KEY,
  authSecretSame: Boolean(prev.AUTH_SECRET) && prev.AUTH_SECRET === prod.AUTH_SECRET,
};

const isolatedDb = !report.databaseUrlSamePreviewProduction && !report.directUrlSamePreviewProduction;
report.verdict = isolatedDb
  ? "DATABASE_ISOLATION_OK"
  : "DATABASE_ISOLATION_FAILED_SHARED_OR_IDENTICAL";

console.log(JSON.stringify(report, null, 2));
process.exit(isolatedDb ? 0 : 3);
