/**
 * Mescla credenciais SMTP em apps/web/.env.
 * Preenche chaves vazias a partir de .env.smtp.local e da raiz .env.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const webEnv = path.join(root, "apps", "web", ".env");
const smtpLocal = path.join(root, "apps", "web", ".env.smtp.local");
const rootEnv = path.join(root, ".env");

const SMTP_KEYS = [
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
  }
  return map;
}

function readEnvMap(filePath) {
  if (!fs.existsSync(filePath)) return new Map();
  return parseEnv(fs.readFileSync(filePath, "utf8"));
}

function serializeEnvLine(key, val) {
  if (/[\s#"'=]/.test(val)) return `${key}="${val}"`;
  return `${key}=${val}`;
}

/** @returns {string[]} chaves atualizadas */
export function mergeSmtpIntoWebEnv(options = {}) {
  const { silent = false, force = false } = options;

  if (!fs.existsSync(webEnv)) {
    throw new Error(`Arquivo ausente: ${webEnv}`);
  }

  const sources = [readEnvMap(smtpLocal), readEnvMap(rootEnv)];
  const current = readEnvMap(webEnv);
  const lines = fs.readFileSync(webEnv, "utf8").split(/\r?\n/);
  const updated = [];

  for (const key of SMTP_KEYS) {
    if (!force && current.get(key)?.trim()) continue;

    let val;
    for (const src of sources) {
      const candidate = src.get(key)?.trim();
      if (candidate) {
        val = candidate;
        break;
      }
    }
    if (!val) continue;

    const lineIdx = lines.findIndex((l) => l.trim().startsWith(`${key}=`));
    const serialized = serializeEnvLine(key, val);
    if (lineIdx >= 0) {
      lines[lineIdx] = serialized;
    } else {
      lines.push(serialized);
    }
    updated.push(key);
  }

  if (updated.length > 0) {
    fs.writeFileSync(webEnv, lines.join("\n").replace(/\n?$/, "\n"), "utf8");
    if (!silent) {
      console.log("✓ SMTP mesclado em apps/web/.env:", updated.join(", "));
    }
  }

  return updated;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  mergeSmtpIntoWebEnv();
}
