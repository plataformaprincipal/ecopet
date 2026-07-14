/**
 * Sobe servidor Next.js de produção para testes (porta estável).
 * Uso: node scripts/start-stable-test-server.mjs
 * Define PORT via env (padrão 3002).
 */
import { spawn, execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const webDir = path.join(root, "apps", "web");
const PORT = process.env.TEST_PORT || "3002";
const PID_FILE = path.join(root, ".ecopet", "test-server.pid");

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr ":${port}"`, { encoding: "utf8" });
      const pids = new Set(
        out
          .split("\n")
          .map((l) => l.trim().split(/\s+/).pop())
          .filter((p) => p && /^\d+$/.test(p) && p !== "0")
      );
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`);
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* port free */
  }
}

async function waitForHealth(url, maxMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) {
        const body = await res.json();
        if (body?.success) return;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Servidor não respondeu em ${url}`);
}

async function main() {
  if (process.env.CLEAN_NEXT === "1") {
    const nextDir = path.join(webDir, ".next");
    if (fs.existsSync(nextDir)) {
      fs.rmSync(nextDir, { recursive: true, force: true });
      console.log("✓ .next removido");
    }
  }

  killPort(PORT);

  if (process.env.SKIP_BUILD === "1") {
    console.log("→ SKIP_BUILD=1 — reutilizando .next existente");
  } else {
    console.log("→ npm run build …");
    await new Promise((resolve, reject) => {
      const child = spawn("npm", ["run", "build"], { cwd: root, shell: true, stdio: "inherit" });
      child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`build exit ${code}`))));
    });
  }

  console.log(`→ next start na porta ${PORT} …`);
  const server = spawn("npm", ["run", "start"], {
    cwd: webDir,
    shell: true,
    stdio: "ignore",
    env: {
      ...process.env,
      PORT,
      AUTH_RATE_LIMIT_RELAXED: process.env.AUTH_RATE_LIMIT_RELAXED ?? "1",
      AUTH_TEST_RESET_RATE_LIMIT: process.env.AUTH_TEST_RESET_RATE_LIMIT ?? "1",
      AUTH_TEST_EXPOSE_OTP: process.env.AUTH_TEST_EXPOSE_OTP ?? "1",
      PHONE_SMS_RECOVERY_ENABLED: process.env.PHONE_SMS_RECOVERY_ENABLED ?? "1",
    },
    detached: process.platform !== "win32",
  });

  fs.mkdirSync(path.dirname(PID_FILE), { recursive: true });
  fs.writeFileSync(PID_FILE, String(server.pid));

  const baseUrl = `http://localhost:${PORT}`;
  await waitForHealth(baseUrl);
  console.log(`✓ Servidor estável: ${baseUrl}`);
  console.log(`  WEB_URL=${baseUrl}`);
  console.log(`  PID=${server.pid} (salvo em ${PID_FILE})`);
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
