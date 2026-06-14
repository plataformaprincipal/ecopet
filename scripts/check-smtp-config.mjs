import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const webEnv = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "apps", "web", ".env");

function parse(content) {
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    map.set(k, v);
  }
  return map;
}

const env = parse(fs.readFileSync(webEnv, "utf8"));
const pass = env.get("SMTP_PASS") || "";
const host = env.get("SMTP_HOST") || "";
const isGmail = host.includes("gmail.com");
const isDev = host === "127.0.0.1" || host === "localhost";

console.log("SMTP_HOST:", host || "(vazio)");
console.log("SMTP_PORT:", env.get("SMTP_PORT") || "(vazio)");
console.log("SMTP_USER:", env.get("SMTP_USER") || "(vazio)");
console.log("SMTP_PASS:", pass ? `*** (${pass.length} chars)` : "(vazio)");
console.log("SMTP_FROM_EMAIL:", env.get("SMTP_FROM_EMAIL") || env.get("SMTP_FROM") || "(vazio)");
console.log("TEST_EMAIL:", env.get("TEST_EMAIL") || "(vazio)");
console.log("MAIL_PROVIDER:", env.get("MAIL_PROVIDER") || "(vazio)");
console.log("modo:", isGmail ? "Gmail" : isDev ? "Maildev/Mailpit" : "custom");
