/**
 * Load DATABASE_URL/DIRECT_URL from apps/web/.env.preview.verify into process.env
 * without printing secrets. Used by E2E runner only.
 */
import fs from "fs";
import path from "path";

const file = path.resolve("apps/web/.env.preview.verify");
if (!fs.existsSync(file)) {
  console.error("apps/web/.env.preview.verify ausente");
  process.exit(2);
}
for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (
    [
      "DATABASE_URL",
      "DIRECT_URL",
      "MERCADO_PAGO_WEBHOOK_SECRET",
      "MERCADO_PAGO_ACCESS_TOKEN",
      "MERCADO_PAGO_ENVIRONMENT",
    ].includes(k)
  ) {
    process.env[k] = v;
  }
}
console.log("preview-db-env: loaded (values not printed)");
