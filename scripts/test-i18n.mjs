/**
 * Testes i18n — pt-BR, en, es + paridade de chaves
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

const localeFiles = ["pt-BR.json", "en.json", "es.json"];
const flats = {};

for (const file of localeFiles) {
  const full = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));
  flats[file] = flatten(data);
  console.log(`→ ${file}`);
  for (const key of REQUIRED_KEYS) {
    if (flats[file][key]) {
      console.log(`  ✓ ${key}`);
    } else {
      console.error(`  ✗ ${key} ausente`);
      failed++;
    }
  }
}

// Paridade de chaves entre locales
const ptKeys = new Set(Object.keys(flats["pt-BR.json"]));
const enKeys = new Set(Object.keys(flats["en.json"]));
const esKeys = new Set(Object.keys(flats["es.json"]));

function diffKeys(source, target, label) {
  const missing = [...source].filter((k) => !target.has(k));
  if (missing.length) {
    console.error(`\n✗ ${label}: ${missing.length} chaves ausentes (ex.: ${missing.slice(0, 5).join(", ")})`);
    failed += missing.length;
  } else {
    console.log(`\n✓ ${label}: paridade OK (${source.size} chaves)`);
  }
}

diffKeys(ptKeys, enKeys, "en vs pt-BR");
diffKeys(ptKeys, esKeys, "es vs pt-BR");

console.log(
  failed
    ? `\n❌ ${failed} problemas i18n`
    : `\n✅ i18n pt-BR / en / es OK (${ptKeys.size} chaves alinhadas)`
);
process.exit(failed > 0 ? 1 : 0);
