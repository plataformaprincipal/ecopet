/**
 * Bootstrap: Postgres embedded + prisma db push + testes de fundação.
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { ensurePostgres, DATABASE_URL } from "./ensure-postgres.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const webDir = path.join(root, "apps", "web");

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd || root,
      shell: true,
      stdio: "inherit",
      env: { ...process.env, ...opts.env },
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

async function waitForWeb(maxMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch("http://localhost:3000/login");
      if (res.status < 500) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Next.js não respondeu a tempo");
}

async function freePort3000() {
  try {
    if (process.platform === "win32") {
      const { execSync } = await import("child_process");
      const out = execSync('netstat -ano | findstr ":3000"', { encoding: "utf8" });
      const pids = new Set(
        out
          .split("\n")
          .map((l) => l.trim().split(/\s+/).pop())
          .filter((p) => p && /^\d+$/.test(p))
      );
      for (const pid of pids) {
        if (pid === "0") continue;
        try {
          execSync(`taskkill /PID ${pid} /F`);
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* port already free */
  }
}

async function main() {
  await ensurePostgres();
  await freePort3000();

  await run("npx", ["prisma", "generate"], {
    cwd: webDir,
    env: { DATABASE_URL },
  }).catch(() => {
    console.log("⚠ prisma generate ignorado (cliente já gerado ou arquivo bloqueado no Windows)");
  });
  await run("npx", ["prisma", "db", "push", "--accept-data-loss", "--skip-generate"], {
    cwd: webDir,
    env: { DATABASE_URL },
  });

  const dev = spawn("npm", ["run", "dev"], {
    cwd: webDir,
    shell: true,
    stdio: "ignore",
    env: {
      ...process.env,
      DATABASE_URL,
      AUTH_SECRET: process.env.AUTH_SECRET || "ecopet-dev-auth-secret",
      PASSWORD_RESET_TEST_FILE: path.join(root, ".ecopet", "last-reset-token.txt"),
    },
  });

  try {
    await waitForWeb();
    await run("node", ["scripts/test-foundation.mjs"], {
      env: {
        DATABASE_URL,
        WEB_URL: "http://localhost:3000",
        PASSWORD_RESET_TEST_FILE: path.join(root, ".ecopet", "last-reset-token.txt"),
      },
    });
    console.log("\n✅ Bootstrap + testes concluídos");
  } finally {
    dev.kill("SIGTERM");
  }
}

main().catch((e) => {
  console.error("\n❌", e.message);
  process.exit(1);
});
