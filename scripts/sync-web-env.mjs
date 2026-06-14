/**
 * Sincroniza variáveis ausentes em apps/web/.env a partir de .env.example e da raiz .env.
 * Não sobrescreve chaves já presentes no arquivo (mesmo vazias).
 * Só copia valores não vazios de .env.example ou da raiz.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mergeSmtpIntoWebEnv } from "./merge-smtp-into-web-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const webEnv = path.join(root, "apps", "web", ".env");
const webExample = path.join(root, "apps", "web", ".env.example");
const rootEnv = path.join(root, ".env");

const SYNC_KEYS = [
  "APP_URL",
  "DATABASE_URL",
  "AUTH_SECRET",
  "NODE_ENV",
  "MAIL_PROVIDER",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SMTP_FROM_NAME",
  "SMTP_FROM_EMAIL",
  "TEST_EMAIL",
];

function parseEnv(content) {
  const map = new Map();
  const keysInFile = new Set();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    map.set(key, val);
    keysInFile.add(key);
  }
  return { map, keysInFile };
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return { map: new Map(), keysInFile: new Set() };
  return parseEnv(fs.readFileSync(filePath, "utf8"));
}

function pickValue(key, fromRoot, fromExample) {
  const rootVal = fromRoot.map.get(key);
  if (rootVal?.trim()) return rootVal;
  const exampleVal = fromExample.map.get(key);
  if (exampleVal?.trim()) return exampleVal;
  return undefined;
}

function main() {
  if (!fs.existsSync(webEnv) && fs.existsSync(webExample)) {
    fs.copyFileSync(webExample, webEnv);
    console.log("✓ Criado apps/web/.env a partir de .env.example");
  }

  const current = readEnvFile(webEnv);
  const fromExample = readEnvFile(webExample);
  const fromRoot = readEnvFile(rootEnv);

  const lines = fs.existsSync(webEnv) ? fs.readFileSync(webEnv, "utf8").split(/\r?\n/) : [];
  const added = [];

  for (const key of SYNC_KEYS) {
    if (current.keysInFile.has(key)) continue;
    const val = pickValue(key, fromRoot, fromExample);
    if (val === undefined) continue;
    lines.push(`${key}=${val}`);
    added.push(key);
  }

  if (added.length > 0) {
    const body = lines.join("\n").replace(/\n?$/, "\n");
    fs.writeFileSync(webEnv, body, "utf8");
    console.log("✓ Variáveis adicionadas em apps/web/.env:", added.join(", "));
  }

  mergeSmtpIntoWebEnv({ silent: false, force: Boolean(process.env.SMTP_MERGE_FORCE) });
}

main();
