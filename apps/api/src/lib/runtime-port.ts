import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Caminho compartilhado monorepo — lido pelo script dev e pelo Next.js */
export function runtimePortFilePath(): string {
  return path.resolve(__dirname, "../../../../.ecopet/runtime-api-port.json");
}

export function writeRuntimePort(port: number): void {
  const file = runtimePortFilePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const payload = {
    port,
    baseUrl: `http://localhost:${port}`,
    updatedAt: new Date().toISOString(),
    service: "ecopet-api",
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
}

export function readRuntimePort(): number | null {
  try {
    const raw = fs.readFileSync(runtimePortFilePath(), "utf8");
    const data = JSON.parse(raw) as { port?: number };
    return typeof data.port === "number" ? data.port : null;
  } catch {
    return null;
  }
}
