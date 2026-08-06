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

function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

function looksLikeLocalhost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/** Server-side (NextAuth, proxy route, RSC) */
export function getServerApiUrl(): string {
  const configured =
    process.env.API_INTERNAL_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "";

  // Never use localhost Express targets on Vercel / production builds.
  if (configured) {
    if ((isProductionBuild() || isVercelRuntime()) && looksLikeLocalhost(configured)) {
      return "";
    }
    return configured;
  }

  if (isProductionBuild() || isVercelRuntime()) return "";

  const runtime = readRuntimeApiUrl();
  if (runtime) return runtime;
  return "http://localhost:4000";
}

export { PROXY_PREFIX };
