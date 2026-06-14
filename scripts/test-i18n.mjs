/**
 * Testes i18n — pt-BR, en, es
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const localesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "apps",
  "web",
  "src",
  "i18n",
  "locales"
);

const REQUIRED_KEYS = [
  "errors.unauthorized",
  "errors.forbidden",
  "nav.home",
  "nav.profile",
  "nav.adminPanel",
  "dashboard.title",
  "auth.login.title",
  "empty.notifications.description",
  "empty.messages.description",
  "empty.orders.description",
  "gestor.title",
  "gestor.accessDenied.title",
];

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

let failed = 0;

console.log("=== EcoPet — test:i18n ===\n");

for (const file of ["pt-BR.json", "en.json", "es.json"]) {
  const full = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));
  const flat = flatten(data);
  console.log(`→ ${file}`);
  for (const key of REQUIRED_KEYS) {
    if (flat[key]) {
      console.log(`  ✓ ${key}`);
    } else {
      console.error(`  ✗ ${key} ausente`);
      failed++;
    }
  }
}

console.log(failed ? `\n❌ ${failed} chaves ausentes` : "\n✅ i18n pt-BR / en / es OK");
process.exit(failed > 0 ? 1 : 0);
