/**
 * Teste técnico de SMTP — EcoPet
 * Uso: npm run test:mail
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import nodemailer from "nodemailer";
import {
  applyMailProvider,
  detectSmtpProvider,
  requiredSmtpVars,
  resolveSecure,
  resolveSmtpFrom,
} from "./mail-providers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const webDir = path.join(root, "apps", "web");
const webEnv = path.join(webDir, ".env");
const webEnvExample = path.join(webDir, ".env.example");
const rootEnv = path.join(root, ".env");

function loadEnvFile(filePath, override = false) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
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
    if (override || process.env[key] === undefined || !String(process.env[key]).trim()) {
      process.env[key] = val;
    }
  }
}

function printSmtpError(label, err) {
  console.error(`\n❌ ${label}`);
  console.error("   message:", err?.message || err);
  if (err?.code) console.error("   code:", err.code);
  if (err?.command) console.error("   command:", err.command);
  if (err?.responseCode) console.error("   responseCode:", err.responseCode);
  if (err?.response) console.error("   response:", err.response);
}

async function logEmailToDb(data) {
  if (!process.env.DATABASE_URL?.trim()) {
    console.warn("⚠ DATABASE_URL ausente — EmailLog não registrado.");
    return null;
  }
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    let row;
    if (data.id) {
      row = await prisma.emailLog.update({
        where: { id: data.id },
        data: {
          status: data.status,
          provider: data.provider,
          error: data.error ?? null,
          sentAt: data.sentAt ?? null,
        },
      });
    } else {
      row = await prisma.emailLog.create({
        data: {
          recipient: data.recipient,
          subject: data.subject,
          status: data.status,
          provider: data.provider,
          error: data.error ?? null,
          sentAt: data.sentAt ?? null,
        },
      });
    }
    await prisma.$disconnect();
    return row.id;
  } catch (e) {
    console.warn("⚠ Falha ao registrar EmailLog:", e?.message || e);
    return null;
  }
}

async function main() {
  console.log("=== EcoPet — teste SMTP ===\n");

  spawnSync(process.execPath, [path.join(__dirname, "sync-web-env.mjs")], {
    cwd: root,
    stdio: "inherit",
  });

  loadEnvFile(webEnvExample);
  loadEnvFile(rootEnv);
  loadEnvFile(path.join(webDir, ".env.smtp.local"));
  loadEnvFile(webEnv, true);

  if (!process.env.APP_URL?.trim() && process.env.NEXTAUTH_URL?.trim()) {
    process.env.APP_URL = process.env.NEXTAUTH_URL;
  }

  const preset = applyMailProvider(process.env);
  const smtpFrom = resolveSmtpFrom(process.env);
  if (smtpFrom) process.env.SMTP_FROM = smtpFrom;

  const missing = requiredSmtpVars(process.env);
  if (missing.length > 0) {
    console.error("❌ Variáveis ausentes em apps/web/.env:", missing.join(", "));
    console.error("\nConfigure SMTP:");
    console.error("  npm run setup:smtp:dev && npm run mail:up");
    console.error('  npm run setup:smtp -- --user=seu@gmail.com --pass="senha-de-app" --test=seu@gmail.com');
    console.error("  npm run setup:smtp:gmail   # mostra o comando Gmail");
    process.exit(1);
  }

  const testEmail = process.env.TEST_EMAIL.trim();
  const host = process.env.SMTP_HOST.trim();
  const port = Number(process.env.SMTP_PORT);
  const secure = resolveSecure(port);
  const provider = process.env.MAIL_PROVIDER
    ? preset.label
    : detectSmtpProvider(host);
  const subject = "EcoPet — teste SMTP";

  console.log("Configuração detectada:");
  console.log(`  MAIL_PROVIDER=${process.env.MAIL_PROVIDER || "custom"}`);
  console.log(`  provider=${provider}`);
  console.log(`  host=${host}`);
  console.log(`  port=${port}`);
  console.log(`  secure=${secure}`);
  console.log(`  remetente=${smtpFrom}`);
  console.log(`  SMTP_USER=${process.env.SMTP_USER}`);
  console.log(`  APP_URL=${process.env.APP_URL}`);
  console.log(`  TEST_EMAIL=${testEmail}`);
  console.log(`  env_file=${webEnv}\n`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.trim(),
    },
  });

  const pendingId = await logEmailToDb({
    recipient: testEmail,
    subject,
    status: "PENDING",
    provider,
  });

  console.log("→ transporter.verify()...");
  const verifyStart = Date.now();
  try {
    await transporter.verify();
    console.log(`✓ verify OK (${Date.now() - verifyStart}ms)\n`);
  } catch (err) {
    if (pendingId) {
      await logEmailToDb({
        id: pendingId,
        status: "FAILED",
        provider,
        error: [err?.message, err?.code, err?.response].filter(Boolean).join(" | "),
      });
    }
    printSmtpError("Falha na verificação SMTP (transporter.verify)", err);
    process.exit(1);
  }

  console.log(`→ sendMail → ${testEmail}...`);
  const sendStart = Date.now();
  try {
    const info = await transporter.sendMail({
      from: smtpFrom,
      to: testEmail,
      subject,
      text: "Este é um e-mail de teste do EcoPet. Se você recebeu, o SMTP está configurado corretamente.",
      html: `<p>Este é um e-mail de teste do <strong>EcoPet</strong>.</p><p>Se você recebeu, o SMTP está configurado corretamente.</p>`,
    });
    const elapsed = Date.now() - sendStart;
    const response = info.response || "";
    const responseCodeMatch = response.match(/^(\d{3})/);
    console.log(`✓ sendMail aceito (${elapsed}ms)`);
    console.log(`  messageId: ${info.messageId || "(n/a)"}`);
    console.log(`  response: ${response || "(n/a)"}`);
    if (responseCodeMatch) console.log(`  responseCode: ${responseCodeMatch[1]}`);

    if (pendingId) {
      await logEmailToDb({
        id: pendingId,
        status: "SENT",
        provider,
        sentAt: new Date(),
      });
      console.log(`  EmailLog: SENT (id=${pendingId})`);
    }

    console.log("\n✅ test:mail concluído — verifique caixa de entrada e spam.");
  } catch (err) {
    if (pendingId) {
      await logEmailToDb({
        id: pendingId,
        status: "FAILED",
        provider,
        error: [err?.message, err?.code, err?.response].filter(Boolean).join(" | "),
      });
    }
    printSmtpError("Falha ao enviar e-mail de teste (sendMail)", err);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\n❌", e.message || e);
  process.exit(1);
});
