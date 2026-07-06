/**
 * Valida variáveis obrigatórias para deploy Vercel (apps/web).
 * Uso: node scripts/validate-production-env.mjs
 *      NODE_ENV=production VERCEL=1 node scripts/validate-production-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadDotEnv() {
  const path = resolve(root, ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotEnv();

const env = process.env;
const critical = [];
const recommended = [];
const warnings = [];

if (!env.DATABASE_URL?.trim()) critical.push("DATABASE_URL");
if (!env.AUTH_SECRET?.trim() && !env.NEXTAUTH_SECRET?.trim()) {
  critical.push("AUTH_SECRET ou NEXTAUTH_SECRET");
}

const urls = [env.NEXTAUTH_URL, env.APP_URL, env.NEXT_PUBLIC_APP_URL].filter(Boolean);
const hasLocalhost = urls.some((u) => /localhost|127\.0\.0\.1/i.test(u));
if (env.VERCEL === "1" && hasLocalhost) {
  warnings.push("URLs apontam para localhost na Vercel");
}

const hasResend = Boolean(env.RESEND_API_KEY?.trim());
const hasSmtp = Boolean(env.SMTP_HOST?.trim() && env.SMTP_USER?.trim() && env.SMTP_PASS?.trim());
if (!hasResend && !hasSmtp) {
  recommended.push("RESEND_API_KEY + EMAIL_FROM (ou SMTP_*)");
}

const hasCloudinary =
  env.CLOUDINARY_CLOUD_NAME?.trim() &&
  env.CLOUDINARY_API_KEY?.trim() &&
  env.CLOUDINARY_API_SECRET?.trim();
if (!hasCloudinary) {
  recommended.push("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
}

console.log("=== EcoPet — Validação de ambiente de produção ===\n");

if (critical.length) {
  console.log("❌ OBRIGATÓRIAS ausentes:");
  for (const v of critical) console.log(`   - ${v}`);
} else {
  console.log("✅ Variáveis obrigatórias presentes");
}

if (recommended.length) {
  console.log("\n⚠️  Recomendadas ausentes:");
  for (const v of recommended) console.log(`   - ${v}`);
}

if (warnings.length) {
  console.log("\n⚠️  Avisos:");
  for (const w of warnings) console.log(`   - ${w}`);
}

console.log("\nConsulte .env.example e apps/web/src/lib/env-registry.ts para lista completa.");

process.exit(critical.length ? 1 : 0);
