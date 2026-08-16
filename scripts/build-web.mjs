/**
 * Windows-safe web build with raised heap (NODE_OPTIONS / --max-old-space-size).
 * Builds @ecopet/database (prisma generate + tsc → dist/) then Next.js build.
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const webDir = path.join(root, "apps", "web");
const heap = "--max-old-space-size=8192";

const existing = process.env.NODE_OPTIONS?.trim() ?? "";
if (!existing.includes("max-old-space-size")) {
  process.env.NODE_OPTIONS = existing ? `${existing} ${heap}` : heap;
}

function run(command, args, cwd, { shell = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
    shell,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Fonte única: prisma generate + compilação TypeScript → packages/database/dist
run("npm", ["run", "build", "-w", "@ecopet/database"], root, { shell: true });

const databaseDistRequired = [
  "index.js",
  "client.js",
  "diagnostics.js",
].map((file) => path.join(root, "packages", "database", "dist", file));

for (const file of databaseDistRequired) {
  if (!fs.existsSync(file)) {
    console.error(`[build-web] Arquivo obrigatório ausente após build do database: ${file}`);
    process.exit(1);
  }
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
run(process.execPath, [nextBin, "build"], webDir);
