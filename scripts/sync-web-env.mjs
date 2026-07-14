/**
 * Sincroniza variáveis entre .env (raiz) e apps/web/.env.
 * - SYNC_KEYS: adiciona chaves ausentes no web .env
 * - ALIGN_KEYS: alinha valores da raiz para o web .env (somente se fonte não-vazia)
 * - Nunca sobrescreve valor preenchido com valor vazio
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

/** Integrações — sync + align (só se source tiver valor) */
export const INTEGRATION_KEYS = [
  // OpenAI
  "AI_ENABLED",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OPENAI_EMBEDDING_MODEL",
  "OPENAI_MODERATION_MODEL",
  "OPENAI_MAX_OUTPUT_TOKENS",
  "OPENAI_REQUEST_TIMEOUT_MS",
  "OPENAI_DAILY_USER_LIMIT",
  "OPENAI_MONTHLY_BUDGET_CENTS",
  // Resend / e-mail
  "EMAIL_PROVIDER",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
  // Twilio / SMS
  "SMS_PROVIDER",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  // TalkJS
  "NEXT_PUBLIC_TALKJS_APP_ID",
  "TALKJS_SECRET_KEY",
  // Cloudinary
  "UPLOAD_PROVIDER",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "UPLOAD_DEV_FALLBACK",
  // Mercado Pago
  "PAYMENT_PROVIDER",
  "MERCADO_PAGO_ACCESS_TOKEN",
  "MERCADO_PAGO_PUBLIC_KEY",
  "MERCADO_PAGO_WEBHOOK_SECRET",
  // Stripe
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  // Push (VAPID)
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  // Build
  "NODE_OPTIONS",
];

const BASE_SYNC_KEYS = [
  "APP_URL",
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
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
  "EMAIL_FROM_NAME",
];

const BASE_ALIGN_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "JWT_SECRET",
  "NEXTAUTH_URL",
  "APP_URL",
  "NEXT_PUBLIC_APP_URL",
];

function uniqueKeys(...lists) {
  return [...new Set(lists.flat())];
}

export const SYNC_KEYS = uniqueKeys(BASE_SYNC_KEYS, INTEGRATION_KEYS);
export const ALIGN_KEYS = uniqueKeys(BASE_ALIGN_KEYS, INTEGRATION_KEYS);

/** Chaves que podem ser copiadas de apps/web/.env → .env raiz (só se raiz vazia/ausente) */
export const COPY_WEB_TO_ROOT_KEYS = [...INTEGRATION_KEYS];

export function isNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Regra crítica: nunca sobrescrever preenchido com vazio.
 * Retorna true se devemos alinhar target com source.
 */
export function shouldAlignValue(sourceVal, targetVal) {
  if (!isNonEmpty(sourceVal)) return false;
  return sourceVal !== targetVal;
}

/**
 * Copia source → target somente se source tem valor e target está ausente/vazio.
 */
export function shouldCopyIfTargetEmpty(sourceVal, targetVal) {
  if (!isNonEmpty(sourceVal)) return false;
  return !isNonEmpty(targetVal);
}

/**
 * Adiciona chave ausente: só se source (ou fallback) tiver valor não-vazio.
 */
export function shouldAddMissingKey(keyPresent, sourceVal) {
  if (keyPresent) return false;
  return isNonEmpty(sourceVal);
}

export function parseEnv(content) {
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

export function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return { map: new Map(), keysInFile: new Set() };
  return parseEnv(fs.readFileSync(filePath, "utf8"));
}

export function pickValue(key, fromRoot, fromExample) {
  const rootVal = fromRoot.map.get(key);
  if (isNonEmpty(rootVal)) return rootVal;
  const exampleVal = fromExample.map.get(key);
  if (isNonEmpty(exampleVal)) return exampleVal;
  return undefined;
}

export function formatEnvLine(key, value) {
  if (/[\s#"'=]/.test(value)) {
    return `${key}="${value}"`;
  }
  return `${key}=${value}`;
}

export function upsertEnvLine(lines, key, value) {
  // Nunca gravar vazio por cima de existente via esta função de sync
  if (!isNonEmpty(value)) return lines;
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

/**
 * Aplica regras de sync em memória (útil para testes).
 * @returns {{ added: string[], aligned: string[], lines: string[] }}
 */
export function applySyncRules({
  webContent = "",
  rootMap = new Map(),
  exampleMap = new Map(),
  syncKeys = SYNC_KEYS,
  alignKeys = ALIGN_KEYS,
}) {
  const current = parseEnv(webContent);
  const fromRoot = { map: rootMap, keysInFile: new Set(rootMap.keys()) };
  const fromExample = { map: exampleMap, keysInFile: new Set(exampleMap.keys()) };

  let lines = webContent ? webContent.split(/\r?\n/) : [];
  const added = [];
  const aligned = [];

  for (const key of syncKeys) {
    if (current.keysInFile.has(key)) continue;
    const val = pickValue(key, fromRoot, fromExample);
    if (!shouldAddMissingKey(false, val)) continue;
    lines.push(formatEnvLine(key, val));
    added.push(key);
  }

  // Re-parse after adds so align sees updated presence (values still from original current for compare)
  for (const key of alignKeys) {
    const rootVal = rootMap.get(key);
    if (!shouldAlignValue(rootVal, current.map.get(key))) continue;
    lines = upsertEnvLine(lines, key, rootVal);
    aligned.push(key);
  }

  return { added, aligned, lines };
}

/**
 * Copia integrações web → root só quando raiz está vazia/ausente.
 */
export function applyCopyWebToRoot({
  rootContent = "",
  webMap = new Map(),
  keys = COPY_WEB_TO_ROOT_KEYS,
}) {
  const rootParsed = parseEnv(rootContent);
  let rootLines = rootContent ? rootContent.split(/\r?\n/) : [];
  const copied = [];

  for (const key of keys) {
    const webVal = webMap.get(key);
    const rootVal = rootParsed.map.get(key);
    if (!shouldCopyIfTargetEmpty(webVal, rootVal)) continue;
    rootLines = upsertEnvLine(rootLines, key, webVal);
    copied.push(key);
  }

  return { copied, lines: rootLines };
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
    if (!shouldAddMissingKey(false, val)) continue;
    lines.push(formatEnvLine(key, val));
    added.push(key);
  }

  for (const key of ALIGN_KEYS) {
    const rootVal = fromRoot.map.get(key);
    const webVal = current.map.get(key);
    if (!shouldAlignValue(rootVal, webVal)) continue;
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
  if (isNonEmpty(databaseUrl) && !isNonEmpty(directUrl)) {
    directUrl = databaseUrl;
  }

  if (isNonEmpty(databaseUrl)) {
    const dbLines = [
      "# Gerado por npm run sync:env — não editar manualmente",
      formatEnvLine("DATABASE_URL", databaseUrl),
      formatEnvLine("DIRECT_URL", directUrl ?? databaseUrl),
      "",
    ];
    fs.writeFileSync(databaseEnv, dbLines.join("\n"), "utf8");
    console.log("✓ packages/database/.env sincronizado (DATABASE_URL, DIRECT_URL)");
  }

  if (fs.existsSync(rootEnv) && isNonEmpty(databaseUrl)) {
    let rootLines = fs.readFileSync(rootEnv, "utf8").split(/\r?\n/);
    const rootParsed = parseEnv(fs.readFileSync(rootEnv, "utf8"));
    let rootChanged = false;

    if (!isNonEmpty(rootParsed.map.get("DIRECT_URL"))) {
      rootLines = upsertEnvLine(rootLines, "DIRECT_URL", directUrl ?? databaseUrl);
      rootChanged = true;
      console.log("✓ DIRECT_URL adicionado em .env raiz");
    }

    for (const key of COPY_WEB_TO_ROOT_KEYS) {
      const webVal = web.map.get(key);
      const rootVal = rootParsed.map.get(key);
      if (!shouldCopyIfTargetEmpty(webVal, rootVal)) continue;
      rootLines = upsertEnvLine(rootLines, key, webVal);
      rootChanged = true;
      console.log(`✓ ${key} copiado de apps/web/.env para .env raiz`);
    }

    if (rootChanged) {
      fs.writeFileSync(rootEnv, rootLines.join("\n").replace(/\n?$/, "\n"), "utf8");
    }
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main();
}
