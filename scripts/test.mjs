/**
 * EcoPet — suite de testes (sem mocks em produção)
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const steps = [
  { name: "test:no-mocks", cmd: "node", args: ["scripts/test-no-mocks.mjs"] },
  { name: "test:empty-states", cmd: "node", args: ["--import", "tsx", "scripts/test-empty-states.mjs"] },
  { name: "test:i18n", cmd: "node", args: ["scripts/test-i18n.mjs"] },
  { name: "test:permissions:unit", cmd: "node", args: ["--import", "tsx", "scripts/test-permissions.mjs"] },
  { name: "test:catalog-delete-guards", cmd: "node", args: ["--import", "tsx", "scripts/test-catalog-delete-guards.mjs"] },
];

let failed = 0;

console.log("=== EcoPet — npm run test ===\n");

for (const step of steps) {
  console.log(`→ ${step.name}`);
  const result = spawnSync(step.cmd, step.args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    failed++;
    console.error(`✗ ${step.name} falhou\n`);
  } else {
    console.log(`✓ ${step.name} OK\n`);
  }
}

if (failed > 0) {
  console.error(`❌ ${failed} etapa(s) falharam`);
  process.exit(1);
}

console.log("✅ npm run test concluído");
process.exit(0);
