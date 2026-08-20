/**
 * Auditoria pré-go-live: presença de env + probes live baratos.
 * Nunca imprime secrets, tokens ou URLs completas.
 */
import fs from "node:fs";
import path from "node:path";

function load(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    let val = line.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    const key = line.slice(0, i).trim();
    if (!(key in process.env) || !process.env[key]) process.env[key] = val;
  }
}

function present(key) {
  const v = process.env[key];
  return Boolean(typeof v === "string" && v.trim());
}

function sanitizeHost(url) {
  try {
    const u = new URL(url);
    const host = u.host;
    const refMatch = host.match(/postgres\.([a-z0-9]+)\./i) || host.match(/^([a-z0-9]{8,})\./i);
    const ref = refMatch ? `${refMatch[1].slice(0, 4)}…${refMatch[1].slice(-4)}` : host.replace(/^(.{6}).+(.{8})$/, "$1…$2");
    return { host: host.replace(u.password, ""), port: u.port, ref };
  } catch {
    return { host: "(invalid)", port: "", ref: "" };
  }
}

const root = path.resolve(import.meta.dirname, "..");
load(path.join(root, ".env"));
load(path.join(root, "packages/database/.env"));
load(path.join(root, "apps/web/.env"));
load(path.join(root, "apps/web/.env.local"));

const prodFile = path.join(root, ".ecopet", "vercel-production.env");
if (fs.existsSync(prodFile)) load(prodFile);

console.log("=== DB hosts (sanitized) ===");
for (const [label, url] of [
  ["DATABASE_URL", process.env.DATABASE_URL],
  ["DIRECT_URL", process.env.DIRECT_URL],
]) {
  if (!url) {
    console.log(label, "missing");
    continue;
  }
  const s = sanitizeHost(url);
  console.log(label, "host=", s.host, "port=", s.port, "ref=", s.ref);
}

console.log("=== local presence ===");
const keys = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "OPENAI_API_KEY",
  "OPENAI_SEND_PROJECT",
  "OPENAI_PROJECT_ID",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "TEST_EMAIL",
  "NEXT_PUBLIC_TALKJS_APP_ID",
  "TALKJS_SECRET_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "SMS_PROVIDER",
  "MERCADO_PAGO_ACCESS_TOKEN",
  "MERCADO_PAGO_WEBHOOK_SECRET",
  "MERCADO_PAGO_CLIENT_ID",
  "MERCADO_PAGO_CLIENT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "AUTH_RATE_LIMIT_RELAXED",
  "ECOPET_STABLE_TEST_SERVER",
  "PRICING_MEMORY_FALLBACK",
];
for (const k of keys) console.log(`${k}:${present(k) ? "present" : "missing"}`);

async function probe(name, fn) {
  try {
    const result = await fn();
    console.log(`SMOKE ${name}:`, result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    console.log(`SMOKE ${name}: FAIL`, msg.replace(/sk-[a-zA-Z0-9_-]+|re_[a-zA-Z0-9]+|GOCSPX-[^\s]+/gi, "[REDACTED]").slice(0, 180));
  }
}

await probe("openai", async () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return "SKIP_NO_KEY";
  const headers = { Authorization: `Bearer ${key}` };
  if (process.env.OPENAI_SEND_PROJECT === "1" && process.env.OPENAI_PROJECT_ID) {
    headers["OpenAI-Project"] = process.env.OPENAI_PROJECT_ID.trim();
  }
  const res = await fetch("https://api.openai.com/v1/models?limit=1", {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  return res.ok ? `LIVE_OK http=${res.status} projectHeader=${process.env.OPENAI_SEND_PROJECT === "1" ? "sent" : "omitted"}` : `LIVE_FAIL http=${res.status}`;
});

await probe("resend", async () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "SKIP_NO_KEY";
  const to = process.env.TEST_EMAIL?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!to || !from) {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? `CONFIG_LIVE_OK domains http=${res.status} (no TEST_EMAIL, send skipped)` : `LIVE_FAIL http=${res.status}`;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "EccoPet pre-go-live smoke",
      text: "Operational smoke. Ignore.",
    }),
    signal: AbortSignal.timeout(8000),
  });
  return res.ok ? `SEND_ACCEPTED http=${res.status}` : `SEND_FAIL http=${res.status}`;
});

await probe("talkjs", async () => {
  const appId = process.env.NEXT_PUBLIC_TALKJS_APP_ID;
  const secret = process.env.TALKJS_SECRET_KEY;
  if (!appId || !secret) return "SKIP_NO_KEY";
  const { createHmac } = await import("node:crypto");
  const sig = createHmac("sha256", secret).update("ecopet-smoke-test").digest("hex");
  if (sig.length < 16) return "SIG_FAIL";
  const res = await fetch(`https://api.talkjs.com/v1/${appId}/users/ecopet-smoke-test`, {
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(8000),
  });
  return `HMAC_OK live_get_user http=${res.status}`;
});

await probe("cloudinary", async () => {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !apiKey || !apiSecret) return "SKIP_NO_KEY";
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/ping`, {
    headers: { Authorization: `Basic ${auth}` },
    signal: AbortSignal.timeout(8000),
  });
  return res.ok ? `LIVE_OK http=${res.status}` : `LIVE_FAIL http=${res.status}`;
});

await probe("mercado_pago", async () => {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return "SKIP_NO_KEY";
  const res = await fetch("https://api.mercadopago.com/v1/payment_methods", {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
  return res.ok ? `LIVE_OK http=${res.status} (no charge)` : `LIVE_FAIL http=${res.status}`;
});
