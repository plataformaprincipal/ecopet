import fs from "fs";
import path from "path";

function maskUrl(u) {
  if (!u) return "(ausente)";
  const s = String(u).replace(/^["']|["']$/g, "");
  return s.replace(/(postgresql?:\/\/[^:]+:)([^@]+)(@.+)/i, "$1***$3");
}

const root = path.resolve(import.meta.dirname, "..");
const paths = [
  ".env",
  "apps/web/.env",
  "packages/database/.env",
  ".env.example",
  "apps/web/.env.example",
  "apps/web/.env.local",
  ".env.production",
];

const keys = [
  "DATABASE_URL",
  "DIRECT_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_FROM_NAME",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET",
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "SMTP_HOST",
  "SMTP_USER",
];

for (const rel of paths) {
  const p = path.join(root, rel);
  console.log(`\n=== ${rel} ${fs.existsSync(p) ? "EXISTS" : "MISSING"} ===`);
  if (!fs.existsSync(p)) continue;
  const map = new Map();
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    map.set(k, v);
  }
  for (const k of keys) {
    if (!map.has(k)) continue;
    const v = map.get(k);
    if (k.includes("URL")) console.log(`${k} = ${maskUrl(v)}`);
    else if (k.includes("KEY") || k.includes("SECRET") || k.includes("PASS") || k === "SMTP_USER")
      console.log(`${k} = ${v ? "***SET***" : "(vazio)"}`);
    else console.log(`${k} = ${v || "(vazio)"}`);
  }
}
