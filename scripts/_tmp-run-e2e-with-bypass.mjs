/**
 * Runs an E2E script against SSO-protected Preview using automation bypass.
 * Does not print the bypass secret.
 *
 * Usage:
 *   WEB_URL=https://homolog.eccopet.com node scripts/_tmp-run-e2e-with-bypass.mjs scripts/test-fase2-commercial-flow.mjs
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const script = process.argv[2];
if (!script) {
  console.error("Usage: node scripts/_tmp-run-e2e-with-bypass.mjs <e2e-script>");
  process.exit(2);
}

function extractJsonObject(text) {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

const pull = spawnSync(
  "npx",
  [
    "--yes",
    "vercel@58.7.1",
    "project",
    "protection",
    "ecopet-web",
    "--json",
    "--non-interactive",
  ],
  {
    cwd: path.resolve("apps/web"),
    encoding: "utf8",
    shell: true,
  }
);
const prot = extractJsonObject(`${pull.stdout || ""}\n${pull.stderr || ""}`);
const secrets = Object.keys(prot?.protectionBypass || {});
if (!secrets.length) {
  console.error("Nenhum automation bypass configurado no projeto.");
  process.exit(2);
}
const bypass = secrets[0];
console.log("bypass: presente (não exibido)");
console.log(`ssoProtection: ${JSON.stringify(prot.ssoProtection || null)}`);

const preload = path.join(__dirname, "_tmp-bypass-preload.mjs");
fs.writeFileSync(
  preload,
  `
import dns from "dns";
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch {}
const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const _fetch = globalThis.fetch;
globalThis.fetch = (input, init = {}) => {
  const headers = new Headers(init.headers || {});
  if (secret) {
    headers.set("x-vercel-protection-bypass", secret);
    headers.set("x-vercel-set-bypass-cookie", "true");
  }
  return _fetch(input, { ...init, headers });
};
`
);

const web = process.env.WEB_URL || "https://homolog.eccopet.com";
console.log(`WEB_URL=${web}`);
console.log(`script=${script}`);

const r = spawnSync(process.execPath, ["--import", preload, script], {
  env: {
    ...process.env,
    WEB_URL: web,
    VERCEL_AUTOMATION_BYPASS_SECRET: bypass,
  },
  stdio: "inherit",
  shell: false,
});

try {
  fs.unlinkSync(preload);
} catch {}
process.exit(r.status === null ? 1 : r.status);
