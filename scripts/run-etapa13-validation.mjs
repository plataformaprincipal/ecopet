/**
 * Validação completa Etapa 13 — servidor estável + todos os testes.
 */
import { spawn, execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const PORT = process.env.TEST_PORT || "3002";
const WEB_URL = `http://localhost:${PORT}`;

function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      shell: true,
      stdio: "inherit",
      env: { ...process.env, WEB_URL, ...env },
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exit ${code}`))));
  });
}

function stopServer() {
  try {
    execSync("node scripts/stop-stable-test-server.mjs", { cwd: root, stdio: "inherit" });
  } catch {
    /* ignore */
  }
}

async function startServer(relaxed) {
  await run("node", ["scripts/start-stable-test-server.mjs"], {
    TEST_PORT: PORT,
    CLEAN_NEXT: process.env.CLEAN_NEXT ?? "0",
    AUTH_RATE_LIMIT_RELAXED: relaxed,
  });
}

async function main() {
  console.log("=== Etapa 13 — Validação completa ===\n");

  try {
    stopServer();

    console.log("→ Fase A: servidor estrito + test:security …");
    await startServer("0");
    await run("npm", ["run", "test:security"], { WEB_URL });

    stopServer();

    console.log("\n→ Fase B: servidor relaxado + foundation:all + e2e …");
    await startServer("1");

    console.log("\n→ type-check …");
    await run("npm", ["run", "type-check"]);

    console.log("\n→ lint …");
    await run("npm", ["run", "lint"]);

    console.log("\n→ test:foundation:all …");
    await run("node", ["scripts/test-foundation-all.mjs"], { WEB_URL });

    console.log("\n→ playwright install chromium …");
    await run("npx", ["playwright", "install", "chromium"]);

    console.log("\n→ test:e2e …");
    await run("npx", ["playwright", "test"], { WEB_URL });

    console.log("\n✅ Etapa 13 validada com sucesso.");
  } catch (e) {
    console.error("\n❌", e.message);
    process.exit(1);
  } finally {
    stopServer();
  }
}

main();
