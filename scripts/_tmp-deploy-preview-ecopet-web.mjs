/**
 * Deploy Preview only — projeto ecopet-web (Root Directory=apps/web).
 * Rodar a partir da raiz do monorepo. Nunca --prod. Nunca ecopet_github.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const rootVercel = path.join(root, ".vercel");
const webVercel = path.join(root, "apps", "web", ".vercel");
const webProject = JSON.parse(
  fs.readFileSync(path.join(webVercel, "project.json"), "utf8"),
);

if (webProject.projectName !== "ecopet-web") {
  console.error("apps/web/.vercel must point to ecopet-web");
  process.exit(1);
}

fs.mkdirSync(rootVercel, { recursive: true });
for (const f of fs.readdirSync(webVercel)) {
  fs.copyFileSync(path.join(webVercel, f), path.join(rootVercel, f));
}
console.log("Forced .vercel link →", webProject.projectName, webProject.projectId);

console.log("Deploy Preview ecopet-web from monorepo root (NO --prod)");
const r = spawnSync(
  "npx",
  ["--yes", "vercel@48.1.6", "deploy", "--yes", "--target=preview"],
  {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  },
);
process.exit(r.status ?? 1);
