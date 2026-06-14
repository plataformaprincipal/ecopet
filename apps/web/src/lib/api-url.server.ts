import fs from "fs";
import path from "path";
import { PROXY_PREFIX } from "./api-url.client";

const RUNTIME_CANDIDATES = [
  path.resolve(process.cwd(), ".ecopet/runtime-api-port.json"),
  path.resolve(process.cwd(), "../.ecopet/runtime-api-port.json"),
  path.resolve(process.cwd(), "../../.ecopet/runtime-api-port.json"),
  path.resolve(process.cwd(), "../../../.ecopet/runtime-api-port.json"),
];

function readRuntimeApiUrl(): string | null {
  for (const file of RUNTIME_CANDIDATES) {
    try {
      if (!fs.existsSync(file)) continue;
      const data = JSON.parse(fs.readFileSync(file, "utf8")) as { baseUrl?: string; port?: number };
      if (data.baseUrl) return data.baseUrl;
      if (data.port) return `http://localhost:${data.port}`;
    } catch {
      /* try next */
    }
  }
  return null;
}

function isProductionBuild(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Server-side (NextAuth, proxy route, RSC) */
export function getServerApiUrl(): string {
  if (process.env.API_INTERNAL_URL) return process.env.API_INTERNAL_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const runtime = readRuntimeApiUrl();
  if (runtime) return runtime;
  if (isProductionBuild()) return "";
  return "http://localhost:4000";
}

export { PROXY_PREFIX };
