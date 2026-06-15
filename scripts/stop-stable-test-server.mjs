/**
 * Encerra servidor de testes iniciado por start-stable-test-server.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const PID_FILE = path.join(root, ".ecopet", "test-server.pid");
const PORT = process.env.TEST_PORT || "3002";

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
    /* ignore */
  }
}

if (fs.existsSync(PID_FILE)) {
  const pid = fs.readFileSync(PID_FILE, "utf8").trim();
  try {
    process.kill(Number(pid));
    console.log(`✓ Processo ${pid} encerrado`);
  } catch {
    killPort(PORT);
    console.log(`✓ Porta ${PORT} liberada`);
  }
  fs.unlinkSync(PID_FILE);
} else {
  killPort(PORT);
  console.log(`✓ Porta ${PORT} liberada`);
}
