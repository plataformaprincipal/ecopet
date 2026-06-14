/**
 * Orquestrador dev ECOPET — evita EADDRINUSE e mantém web + API sincronizados.
 *
 * 1. Reutiliza API já saudável em 4000+ se existir
 * 2. Caso contrário, sobe API na primeira porta livre (4000 → 4001 → …)
 * 3. Grava .ecopet/runtime-api-port.json
 * 4. Sobe Next.js com NEXT_PUBLIC_API_URL apontando para a porta correta
 */
import { spawn } from "child_process";
import net from "net";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RUNTIME_DIR = path.join(ROOT, ".ecopet");
const RUNTIME_FILE = path.join(RUNTIME_DIR, "runtime-api-port.json");
const START_PORT = Number(process.env.API_PORT || process.env.PORT || 4000);
const MAX_ATTEMPTS = 10;

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen({ port, host: "0.0.0.0" }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function checkEcopetHealth(port) {
  try {
    const res = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.service === "ecopet-api";
  } catch {
    return false;
  }
}

async function resolvePort() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const port = START_PORT + i;
    const healthy = await checkEcopetHealth(port);
    if (healthy) {
      console.log(`[dev] API ECOPET já ativa em http://localhost:${port} — reutilizando`);
      return { port, reuse: true };
    }
    if (await isPortAvailable(port)) {
      return { port, reuse: false };
    }
    console.warn(`[dev] Porta ${port} ocupada por outro processo — tentando ${port + 1}…`);
  }
  throw new Error(`Nenhuma porta livre entre ${START_PORT} e ${START_PORT + MAX_ATTEMPTS - 1}`);
}

function writeRuntimePort(port) {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.writeFileSync(
    RUNTIME_FILE,
    JSON.stringify(
      {
        port,
        baseUrl: `http://localhost:${port}`,
        updatedAt: new Date().toISOString(),
        service: "ecopet-api",
      },
      null,
      2
    )
  );
}

async function waitForHealth(port, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    if (await checkEcopetHealth(port)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, {
    stdio: "inherit",
    shell: true,
    cwd: ROOT,
    ...opts,
  });
}

const { port, reuse } = await resolvePort();
const apiUrl = `http://localhost:${port}`;
writeRuntimePort(port);
console.log(`[dev] API URL: ${apiUrl}`);

let apiProc = null;
if (!reuse) {
  apiProc = run("npm", ["run", "dev", "-w", "@ecopet/api"], {
    env: { ...process.env, API_PORT: String(port), PORT: String(port) },
  });
  const ready = await waitForHealth(port);
  if (!ready) {
    console.error("[dev] API não respondeu a tempo em", apiUrl);
    apiProc.kill();
    process.exit(1);
  }
  console.log(`[dev] API pronta em ${apiUrl}`);
}

const webProc = run("npm", ["run", "dev", "-w", "@ecopet/web"], {
  env: {
    ...process.env,
    API_INTERNAL_URL: apiUrl,
    API_PORT: String(port),
  },
});

function shutdown(code = 0) {
  if (apiProc && !apiProc.killed) apiProc.kill();
  if (webProc && !webProc.killed) webProc.kill();
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
apiProc?.on("exit", (code) => {
  if (code && code !== 0) shutdown(code);
});
webProc.on("exit", (code) => shutdown(code ?? 0));
