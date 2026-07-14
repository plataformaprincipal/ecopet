/**
 * Windows-safe web build with raised heap (NODE_OPTIONS / --max-old-space-size).
 * Invokes prisma generate then Next.js build without relying on cross-env.
 */
import { spawnSync } from "child_process";
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

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(process.execPath, [path.join(root, "scripts", "prisma-generate-safe.mjs")], root);

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
run(process.execPath, [heap, nextBin, "build"], webDir);
