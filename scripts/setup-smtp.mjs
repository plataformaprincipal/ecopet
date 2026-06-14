/**
 * Configura credenciais SMTP do EcoPet.
 *
 * Dev local (Mailpit — recomendado):
 *   node scripts/setup-smtp.mjs --dev
 *
 * Gmail produção:
 *   npm run setup:smtp -- --user=seu@gmail.com --pass="senha-de-app" --test=seu@gmail.com
 *
 * Ethereal (fallback online):
 *   node scripts/setup-smtp.mjs --ethereal
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { mergeSmtpIntoWebEnv } from "./merge-smtp-into-web-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const smtpLocal = path.join(root, "apps", "web", ".env.smtp.local");
const smtpExample = path.join(root, "apps", "web", ".env.smtp.local.example");

const DEV_SMTP = {
  user: "ecopet@local.dev",
  fromEmail: "noreply@ecopet.local",
  testEmail: "dev@ecopet.local",
};

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (arg === "--ethereal") out.ethereal = true;
    else if (arg === "--help-gmail") out.helpGmail = true;
    else if (arg === "--dev" || arg === "--mailpit") out.dev = true;
    else if (arg.startsWith("--user=")) out.user = arg.slice(7);
    else if (arg.startsWith("--pass=")) out.pass = arg.slice(7);
    else if (arg.startsWith("--test=")) out.test = arg.slice(7);
    else if (arg.startsWith("--from=")) out.from = arg.slice(7);
    else if (arg.startsWith("--provider=")) out.provider = arg.slice(11);
  }
  return out;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function writeSmtpLocal(vars) {
  const lines = [
    "# Credenciais SMTP — NÃO versionar (gitignore)",
    "# Gerado por: node scripts/setup-smtp.mjs",
    "",
  ];
  for (const [k, v] of Object.entries(vars)) {
    if (v !== undefined && v !== "") lines.push(`${k}=${v}`);
  }
  lines.push("");
  fs.writeFileSync(smtpLocal, lines.join("\n"), "utf8");
}

function devCredentials() {
  const pass = crypto.randomBytes(18).toString("base64url");
  return {
    MAIL_PROVIDER: "custom",
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "1025",
    SMTP_SECURE: "false",
    SMTP_USER: DEV_SMTP.user,
    SMTP_PASS: pass,
    SMTP_FROM_NAME: "EcoPet",
    SMTP_FROM_EMAIL: DEV_SMTP.fromEmail,
    TEST_EMAIL: DEV_SMTP.testEmail,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.helpGmail) {
    console.log("Gmail — use senha de APP: https://myaccount.google.com/apppasswords\n");
    console.log('npm run setup:smtp -- --user=seu@gmail.com --pass="senha-de-app" --test=seu@gmail.com');
    process.exit(0);
  }

  if (!fs.existsSync(smtpExample)) {
    fs.writeFileSync(
      smtpExample,
      `# Copie para .env.smtp.local ou use: npm run setup:smtp:dev
# Dev (Mailpit): npm run mail:up && npm run setup:smtp:dev
MAIL_PROVIDER=custom
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=ecopet@local.dev
SMTP_PASS=
SMTP_FROM_NAME=EcoPet
SMTP_FROM_EMAIL=noreply@ecopet.local
TEST_EMAIL=dev@ecopet.local
`,
      "utf8"
    );
  }

  let vars;

  if (args.dev) {
    vars = devCredentials();
    console.log("→ Credenciais SMTP de desenvolvimento (Mailpit) criadas.");
    console.log(`  SMTP_USER=${vars.SMTP_USER}`);
    console.log(`  SMTP_PASS=*** (${vars.SMTP_PASS.length} chars, ver apps/web/.env.smtp.local)`);
    console.log("  Inbox web: http://localhost:8025");
    console.log("  Suba o Mailpit: npm run mail:up");
  } else if (args.ethereal) {
    console.log("→ Criando conta de teste Ethereal...");
    const account = await nodemailer.createTestAccount();
    vars = {
      MAIL_PROVIDER: "custom",
      SMTP_HOST: "smtp.ethereal.email",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_USER: account.user,
      SMTP_PASS: account.pass,
      SMTP_FROM_NAME: "EcoPet",
      SMTP_FROM_EMAIL: account.user,
      TEST_EMAIL: account.user,
    };
    console.log(`✓ Conta Ethereal: ${account.user}`);
    console.log(`  Preview: https://ethereal.email/login`);
  } else if (args.user && args.pass) {
    const user = args.user.trim();
    vars = {
      MAIL_PROVIDER: args.provider || "gmail",
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_USER: user,
      SMTP_PASS: args.pass.trim(),
      SMTP_FROM_NAME: "EcoPet",
      SMTP_FROM_EMAIL: args.from || user,
      TEST_EMAIL: args.test || user,
    };
  } else if (process.stdin.isTTY) {
    console.log("=== EcoPet — configuração SMTP ===\n");
    console.log("1) Dev local (Mailpit) — npm run setup:smtp:dev");
    console.log("2) Gmail — senha de APP: https://myaccount.google.com/apppasswords\n");
    const mode = await ask("Modo [dev/gmail] (dev): ");
    if (!mode || mode.toLowerCase().startsWith("d")) {
      vars = devCredentials();
    } else {
      const user = await ask("SMTP_USER (e-mail Gmail): ");
      const pass = await ask("SMTP_PASS (senha de app): ");
      const test = (await ask(`TEST_EMAIL [${user}]: `)) || user;
      if (!user || !pass) {
        console.error("❌ SMTP_USER e SMTP_PASS são obrigatórios.");
        process.exit(1);
      }
      vars = {
        MAIL_PROVIDER: "gmail",
        SMTP_HOST: "smtp.gmail.com",
        SMTP_PORT: "587",
        SMTP_SECURE: "false",
        SMTP_USER: user,
        SMTP_PASS: pass,
        SMTP_FROM_NAME: "EcoPet",
        SMTP_FROM_EMAIL: user,
        TEST_EMAIL: test,
      };
    }
  } else {
    vars = devCredentials();
    console.log("→ Sem TTY: usando credenciais dev Mailpit (npm run mail:up).");
  }

  writeSmtpLocal(vars);
  console.log(`✓ Salvo em apps/web/.env.smtp.local`);

  const merged = mergeSmtpIntoWebEnv({ force: true });
  if (merged.length > 0) {
    console.log(`✓ Mesclado em apps/web/.env: ${merged.join(", ")}`);
  }

  console.log("\nPróximo passo: npm run mail:up && npm run test:mail");
}

main().catch((e) => {
  console.error("❌", e.message || e);
  process.exit(1);
});
