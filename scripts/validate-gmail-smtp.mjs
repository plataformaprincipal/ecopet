/**
 * Validação Gmail real — EcoPet
 * Pré-requisito:
 *   npm run setup:smtp -- --user=SEU@gmail.com --pass="SENHA_APP" --test=SEU@gmail.com
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const webEnv = path.join(root, "apps", "web", ".env");

function parseEnv(content) {
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

function maskConfig() {
  const env = parseEnv(fs.readFileSync(webEnv, "utf8"));
  const host = env.get("SMTP_HOST") || "";
  const isGmail = host.includes("gmail.com");
  const isDev = host === "127.0.0.1" || host === "localhost";
  return {
    host,
    port: env.get("SMTP_PORT"),
    user: env.get("SMTP_USER"),
    passLen: (env.get("SMTP_PASS") || "").length,
    from: env.get("SMTP_FROM_EMAIL") || env.get("SMTP_FROM"),
    test: env.get("TEST_EMAIL"),
    provider: env.get("MAIL_PROVIDER"),
    isGmail,
    isDev,
    ready: isGmail && env.get("SMTP_USER") && env.get("SMTP_PASS") && env.get("TEST_EMAIL"),
  };
}

async function queryEmailLog(limit = 5) {
  const prisma = new PrismaClient();
  try {
    return await prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        recipient: true,
        subject: true,
        status: true,
        provider: true,
        error: true,
        sentAt: true,
        createdAt: true,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function testForgotPassword(email) {
  const base = process.env.APP_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  console.log("=== EcoPet — validação Gmail SMTP ===\n");

  spawnSync(process.execPath, [path.join(__dirname, "sync-web-env.mjs")], {
    cwd: root,
    stdio: "inherit",
  });

  const cfg = maskConfig();
  console.log("1) Configuração SMTP:");
  console.log(`   SMTP_HOST=${cfg.host}`);
  console.log(`   SMTP_PORT=${cfg.port}`);
  console.log(`   SMTP_USER=${cfg.user || "(vazio)"}`);
  console.log(`   SMTP_PASS=${cfg.passLen ? `*** (${cfg.passLen} chars)` : "(vazio)"}`);
  console.log(`   SMTP_FROM=${cfg.from || "(vazio)"}`);
  console.log(`   TEST_EMAIL=${cfg.test || "(vazio)"}`);

  if (cfg.isDev) {
    console.error("\n❌ Ambiente ainda em Maildev/Mailpit (127.0.0.1:1025).");
    console.error('Configure Gmail: npm run setup:smtp -- --user=SEU@gmail.com --pass="SENHA_APP" --test=SEU@gmail.com');
    process.exit(1);
  }

  if (!cfg.isGmail) {
    console.error("\n❌ SMTP_HOST não é Gmail (smtp.gmail.com).");
    process.exit(1);
  }

  if (!cfg.ready) {
    console.error("\n❌ Credenciais Gmail incompletas.");
    process.exit(1);
  }

  console.log("\n2) npm run test:mail...");
  const mail = spawnSync("npm", ["run", "test:mail"], { cwd: root, stdio: "inherit", shell: true });
  if (mail.status !== 0) {
    console.error("\n❌ test:mail falhou.");
    process.exit(mail.status || 1);
  }

  console.log("\n3) EmailLog recente:");
  const logs = await queryEmailLog(3);
  console.log(JSON.stringify(logs, null, 2));

  const testEmail = process.env.GMAIL_RESET_TEST_EMAIL || cfg.test;
  if (testEmail) {
    console.log(`\n4) POST /api/auth/forgot-password → ${testEmail}...`);
    const fp = await testForgotPassword(testEmail);
    console.log(`   status=${fp.status}`);
    const logs2 = await queryEmailLog(1);
    if (logs2[0]) {
      console.log(`   EmailLog mais recente: status=${logs2[0].status} subject=${logs2[0].subject}`);
    }
    console.log("\n→ Verifique Gmail (inbox e spam) e conclua reset manual em /redefinir-senha");
  }

  console.log("\n5) npm run build...");
  const build = spawnSync("npm", ["run", "build"], { cwd: root, stdio: "inherit", shell: true });
  process.exit(build.status || 0);
}

main().catch((e) => {
  console.error("❌", e.message || e);
  process.exit(1);
});
