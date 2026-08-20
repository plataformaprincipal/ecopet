/**
 * Seed no banco da aplicação Web (mesma ordem de env que migrate-deploy-web).
 * Não imprime URLs.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function load(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return "(invalid)";
  }
}

const root = path.resolve(import.meta.dirname, "..");
load(path.join(root, ".env"));
load(path.join(root, "packages/database/.env"));
load(path.join(root, "apps/web/.env"));
load(path.join(root, "apps/web/.env.local"));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL ausente após carregar env da Web.");
  process.exit(1);
}

console.log("seed — runtime host:", hostOf(process.env.DATABASE_URL));

const result = spawnSync("npx", ["tsx", "prisma/seed.ts"], {
  cwd: path.join(root, "packages/database"),
  env: process.env,
  stdio: "inherit",
  shell: true,
});
process.exit(result.status ?? 1);
