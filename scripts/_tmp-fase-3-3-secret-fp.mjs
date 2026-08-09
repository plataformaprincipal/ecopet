/** Fingerprint Preview webhook secret only — never print value. */
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}

function fp(secret) {
  const s = String(secret || "");
  if (!s) return { present: false, length: 0, sha8: null, charset: null };
  return {
    present: true,
    length: s.length,
    sha8: createHash("sha256").update(s, "utf8").digest("hex").slice(0, 8),
    charset: /^[0-9a-fA-F]+$/.test(s)
      ? "hex"
      : /^[0-9a-zA-Z_-]+$/.test(s)
        ? "alnum"
        : "mixed",
    hasWhitespace: /\s/.test(s),
    hasNewline: /[\r\n]/.test(s),
  };
}

async function pullEnv(environment) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `mpwh-${environment}-`));
  try {
    execSync(
      [
        "npx",
        "--yes",
        "vercel@58.7.1",
        "env",
        "pull",
        path.join(tmp, ".env"),
        `--environment=${environment}`,
        "--cwd",
        "apps/web",
        "--yes",
        "--non-interactive",
      ].join(" "),
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], maxBuffer: 5 * 1024 * 1024 }
    );
    const pulled = loadEnvFile(path.join(tmp, ".env"));
    return fp(pulled.MERCADO_PAGO_WEBHOOK_SECRET?.trim());
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

const localVerify = loadEnvFile(
  path.join(process.cwd(), "apps/web/.env.preview.verify")
);
const preview = await pullEnv("preview");
const production = await pullEnv("production");
const local = fp(localVerify.MERCADO_PAGO_WEBHOOK_SECRET?.trim());

console.log(
  JSON.stringify(
    {
      scopes: {
        preview,
        production,
        localVerifyFile: local,
      },
      previewEqualsProduction: preview.sha8 && preview.sha8 === production.sha8,
      previewEqualsLocalVerify: preview.sha8 && preview.sha8 === local.sha8,
      note: "fingerprints only — no secret values",
    },
    null,
    2
  )
);
