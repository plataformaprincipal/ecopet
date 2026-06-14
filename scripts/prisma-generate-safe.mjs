/**
 * prisma generate — fonte única: packages/database
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dbDir = path.join(root, "packages", "database");
const enginePath = path.join(root, "node_modules", ".prisma", "client", "query_engine-windows.dll.node");

const result = spawnSync("npx", ["prisma", "generate"], {
  cwd: dbDir,
  shell: true,
  stdio: "inherit",
  env: process.env,
});

if (result.status === 0) {
  process.exit(0);
}

if (fs.existsSync(enginePath)) {
  console.warn("⚠ prisma generate falhou (arquivo bloqueado), usando cliente existente.");
  process.exit(0);
}

process.exit(result.status ?? 1);
