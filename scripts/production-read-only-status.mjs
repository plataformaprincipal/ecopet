/**
 * Read-only Production identity: hosts/refs only, then prisma migrate status.
 * Does not load local .env files. Never prints URLs or secrets.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

function hostOf(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || ""}`;
  } catch {
    return "(invalid-or-empty)";
  }
}

function projectRef(url) {
  try {
    const u = new URL(url);
    const user = decodeURIComponent(u.username || "");
    const host = u.hostname;
    const fromUser =
      user.match(/\.([a-z0-9]{16,})$/i) || user.match(/^postgres\.([a-z0-9]+)$/i);
    const fromHost = host.match(/^db\.([a-z0-9]+)\./i);
    const ref = (fromUser && fromUser[1]) || (fromHost && fromHost[1]);
    if (!ref) return host.replace(/^(.{8}).+(.{6})$/, "$1…$2");
    return `${ref.slice(0, 4)}…${ref.slice(-4)}`;
  } catch {
    return "(invalid)";
  }
}

const db = process.env.DATABASE_URL || "";
const direct = process.env.DIRECT_URL || "";
console.log("=== isolated process env identity ===");
console.log("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID ? "present" : "missing");
console.log("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET ? "present" : "missing");
console.log("MERCADO_PAGO_ACCESS_TOKEN", process.env.MERCADO_PAGO_ACCESS_TOKEN ? "present" : "missing");
console.log("MERCADO_PAGO_CLIENT_ID", process.env.MERCADO_PAGO_CLIENT_ID ? "present" : "missing");
console.log("MERCADO_PAGO_WEBHOOK_SECRET", process.env.MERCADO_PAGO_WEBHOOK_SECRET ? "present" : "missing");
console.log("OPENAI_API_KEY", process.env.OPENAI_API_KEY ? "present" : "missing");
console.log("RESEND_API_KEY", process.env.RESEND_API_KEY ? "present" : "missing");
console.log("EMAIL_FROM", process.env.EMAIL_FROM ? "present" : "missing");
console.log("TALKJS_SECRET_KEY", process.env.TALKJS_SECRET_KEY ? "present" : "missing");
console.log("AUTH_RATE_LIMIT_RELAXED", process.env.AUTH_RATE_LIMIT_RELAXED ? "present" : "missing");
console.log("ECOPET_STABLE_TEST_SERVER", process.env.ECOPET_STABLE_TEST_SERVER ? "present" : "missing");
console.log("PRICING_MEMORY_FALLBACK", process.env.PRICING_MEMORY_FALLBACK ? "present" : "missing");
console.log("DATABASE_URL host", hostOf(db));
console.log("DATABASE_URL ref", projectRef(db));
console.log("DIRECT_URL host", hostOf(direct));
console.log("DIRECT_URL ref", projectRef(direct));

const root = path.resolve(import.meta.dirname, "..");
console.log("=== prisma migrate status (read-only) ===");
const result = spawnSync("npx", ["prisma", "migrate", "status"], {
  cwd: path.join(root, "packages/database"),
  env: process.env,
  stdio: "inherit",
  shell: true,
});
process.exit(result.status ?? 1);
