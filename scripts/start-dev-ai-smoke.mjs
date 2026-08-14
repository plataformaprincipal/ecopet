/**
 * Inicia o dev server com IA habilitada para smoke local.
 * Carrega OPENAI_* do .env raiz/apps/web sem imprimir secrets.
 * Preferência: última OPENAI_API_KEY não-vazia encontrada (apps/web sobrescreve raiz).
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());

function parseEnvFile(relativePath) {
  const file = resolve(root, relativePath);
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const value = m[2].trim().replace(/^["']|["']$/g, "");
    if (value.length > 0) out[key] = value;
  }
  return out;
}

const merged = {
  ...parseEnvFile(".env"),
  ...parseEnvFile("apps/web/.env"),
};

for (const [key, value] of Object.entries(merged)) {
  if (key.startsWith("OPENAI_") || key === "AI_ENABLED") {
    if (key === "OPENAI_API_KEY" && value.length <= 10) continue;
    process.env[key] = value;
  }
}

process.env.AI_ENABLED = "true";

if (!process.env.OPENAI_API_KEY?.trim()) {
  console.error("OPENAI_API_KEY ausente — configure em apps/web/.env ou .env na raiz.");
  process.exit(1);
}

console.log("Starting dev with AI_ENABLED=true and OpenAI configured (key not logged).");

const child = spawn("npm", ["run", "dev", "-w", "@ecopet/web"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
  cwd: root,
});

child.on("exit", (code) => process.exit(code ?? 1));
