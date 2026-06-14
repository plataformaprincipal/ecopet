/**
 * SMTP local de desenvolvimento (Maildev)
 * SMTP: 127.0.0.1:1025 | Inbox: http://127.0.0.1:8025
 * Uso: npm run mail:up
 */
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const MailDev = require("maildev");

const SMTP_PORT = 1025;
const WEB_PORT = 8025;

const maildev = new MailDev({
  smtp: SMTP_PORT,
  web: WEB_PORT,
  ip: "127.0.0.1",
  disableWeb: false,
});

maildev.listen((err) => {
  if (err) {
    console.error("❌ Maildev falhou:", err.message || err);
    process.exit(1);
  }
  console.log(`✓ Maildev SMTP 127.0.0.1:${SMTP_PORT}`);
  console.log(`✓ Inbox http://127.0.0.1:${WEB_PORT}`);
});

process.on("SIGINT", () => maildev.close(() => process.exit(0)));
process.on("SIGTERM", () => maildev.close(() => process.exit(0)));
