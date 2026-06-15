/**
 * Sincroniza variáveis entre .env (raiz) e apps/web/.env.
 * - SYNC_KEYS: adiciona chaves ausentes no web .env
 * - ALIGN_KEYS: alinha valores críticos da raiz para o web .env (sem logar valores)
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
const databaseEnv = path.join(root, "packages", "database", ".env");

const SYNC_KEYS = [
  "APP_URL",
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "JWT_SECRET",
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
  "UPLOAD_DEV_FALLBACK",
];

const ALIGN_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "JWT_SECRET",
  "NEXTAUTH_URL",
  "APP_URL",
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

function formatEnvLine(key, value) {
  if (/[\s#"'=]/.test(value)) {
    return `${key}="${value}"`;
  }
  return `${key}=${value}`;
}

function upsertEnvLine(lines, key, value) {
  const formatted = formatEnvLine(key, value);
  let found = false;
  const next = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) return line;
    const lineKey = trimmed.slice(0, eq).trim();
    if (lineKey === key) {
      found = true;
      return formatted;
    }
    return line;
  });
  if (!found) next.push(formatted);
  return next;
}

function main() {
  if (!fs.existsSync(webEnv) && fs.existsSync(webExample)) {
    fs.copyFileSync(webExample, webEnv);
    console.log("✓ Criado apps/web/.env a partir de .env.example");
  }

  const current = readEnvFile(webEnv);
  const fromExample = readEnvFile(webExample);
  const fromRoot = readEnvFile(rootEnv);

  let lines = fs.existsSync(webEnv) ? fs.readFileSync(webEnv, "utf8").split(/\r?\n/) : [];
  const added = [];
  const aligned = [];

  for (const key of SYNC_KEYS) {
    if (current.keysInFile.has(key)) continue;
    const val = pickValue(key, fromRoot, fromExample);
    if (val === undefined) continue;
    lines.push(formatEnvLine(key, val));
    added.push(key);
  }

  for (const key of ALIGN_KEYS) {
    const rootVal = fromRoot.map.get(key);
    if (!rootVal?.trim()) continue;
    const webVal = current.map.get(key);
    if (webVal === rootVal) continue;
    lines = upsertEnvLine(lines, key, rootVal);
    aligned.push(key);
  }

  if (added.length > 0 || aligned.length > 0) {
    const body = lines.join("\n").replace(/\n?$/, "\n");
    fs.writeFileSync(webEnv, body, "utf8");
    if (added.length) console.log("✓ Variáveis adicionadas em apps/web/.env:", added.join(", "));
    if (aligned.length) console.log("✓ Variáveis alinhadas com a raiz:", aligned.join(", "));
  } else {
    console.log("✓ apps/web/.env já está sincronizado.");
  }

  mergeSmtpIntoWebEnv({ silent: false, force: Boolean(process.env.SMTP_MERGE_FORCE) });

  const web = readEnvFile(webEnv);
  const databaseUrl = web.map.get("DATABASE_URL") ?? fromRoot.map.get("DATABASE_URL");
  let directUrl = web.map.get("DIRECT_URL") ?? fromRoot.map.get("DIRECT_URL");
  if (databaseUrl?.trim() && !directUrl?.trim()) {
    directUrl = databaseUrl;
  }

  if (databaseUrl?.trim()) {
    const dbLines = [
      "# Gerado por npm run sync:env — não editar manualmente",
      formatEnvLine("DATABASE_URL", databaseUrl),
      formatEnvLine("DIRECT_URL", directUrl ?? databaseUrl),
      "",
    ];
    fs.writeFileSync(databaseEnv, dbLines.join("\n"), "utf8");
    console.log("✓ packages/database/.env sincronizado (DATABASE_URL, DIRECT_URL)");
  }

  if (fs.existsSync(rootEnv) && databaseUrl?.trim()) {
    let rootLines = fs.readFileSync(rootEnv, "utf8").split(/\r?\n/);
    const rootParsed = parseEnv(fs.readFileSync(rootEnv, "utf8"));
    if (!rootParsed.map.get("DIRECT_URL")?.trim()) {
      rootLines = upsertEnvLine(rootLines, "DIRECT_URL", directUrl ?? databaseUrl);
      fs.writeFileSync(rootEnv, rootLines.join("\n").replace(/\n?$/, "\n"), "utf8");
      console.log("✓ DIRECT_URL adicionado em .env raiz");
    }
  }
}

main();
