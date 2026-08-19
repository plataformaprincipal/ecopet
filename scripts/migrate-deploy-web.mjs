/**
 * Deploy de migrations no banco da aplicação Web.
 * Fonte de verdade: apps/web/.env.local → apps/web/.env → .env raiz.
 * Não imprime URLs. Prisma usa DIRECT_URL para migrate quando definido.
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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
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

console.log("migrate deploy — runtime host:", hostOf(process.env.DATABASE_URL));
if (process.env.DIRECT_URL) {
  console.log("migrate deploy — direct host:", hostOf(process.env.DIRECT_URL));
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  cwd: path.join(root, "packages/database"),
  env: process.env,
  stdio: "inherit",
  shell: true,
});
process.exit(result.status ?? 1);
