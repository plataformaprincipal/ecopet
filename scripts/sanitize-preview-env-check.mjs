/**
 * Lê .env.preview.local e imprime apenas metadados seguros (sem secrets).
 */
import fs from "fs";
import path from "path";

const file = process.argv[2] || path.join("apps/web", ".env.preview.local");
if (!fs.existsSync(file)) {
  console.error("FILE_MISSING", file);
  process.exit(2);
}
const t = fs.readFileSync(file, "utf8");
function get(k) {
  const re = new RegExp(`^${k}=(.*)$`, "m");
  const m = t.match(re);
  if (!m) return "";
  return m[1].replace(/^"|"$/g, "").trim();
}
function host(u) {
  try {
    return new URL(u).host;
  } catch {
    return "(invalid/empty)";
  }
}
const mp = get("MERCADO_PAGO_ACCESS_TOKEN");
const db = get("DATABASE_URL");
console.log(
  JSON.stringify(
    {
      MP_TOKEN_PREFIX: mp ? `${mp.slice(0, 8)}…(len=${mp.length})` : "MISSING",
      MP_IS_TEST: Boolean(mp && (mp.startsWith("TEST-") || mp.includes("TEST"))),
      MERCADO_PAGO_ENVIRONMENT: get("MERCADO_PAGO_ENVIRONMENT") || "(empty)",
      PAYMENT_PROVIDER: get("PAYMENT_PROVIDER") || "(empty)",
      ALLOW_SIMULATED_PAYMENTS: get("ALLOW_SIMULATED_PAYMENTS") || "(absent)",
      DATABASE_HOST: host(db),
      APP_URL_HOST: host(get("APP_URL")),
      NEXTAUTH_URL_HOST: host(get("NEXTAUTH_URL")),
      WEB_URL_HOST: host(get("WEB_URL")),
      NEXT_PUBLIC_APP_URL_HOST: host(get("NEXT_PUBLIC_APP_URL")),
      WEBHOOK_SECRET_SET: Boolean(get("MERCADO_PAGO_WEBHOOK_SECRET")),
    },
    null,
    2
  )
);
