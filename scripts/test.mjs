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
  { name: "test:client-experience", cmd: "node", args: ["--import", "tsx", "scripts/test-client-experience.mjs"] },
  {
    name: "test:partner-experience",
    cmd: "node",
    args: ["--import", "tsx", "scripts/test-partner-experience.mjs"],
    env: { TSX_TSCONFIG_PATH: "apps/web/tsconfig.json" },
  },
  {
    name: "test:ngo-experience",
    cmd: "node",
    args: ["--import", "tsx", "scripts/test-ngo-experience.mjs"],
    env: { TSX_TSCONFIG_PATH: "apps/web/tsconfig.json" },
  },
  { name: "test:ngo-flows", cmd: "node", args: ["scripts/test-ngo-flows.mjs"] },
  { name: "test:catalog-delete-guards", cmd: "node", args: ["--import", "tsx", "scripts/test-catalog-delete-guards.mjs"] },
  {
    name: "test:cloudinary",
    cmd: "node",
    args: ["--import", "tsx", "scripts/test-cloudinary-upload.mjs"],
    env: { TSX_TSCONFIG_PATH: "apps/web/tsconfig.json" },
  },
];

let failed = 0;

console.log("=== EcoPet — npm run test ===\n");

for (const step of steps) {
  console.log(`→ ${step.name}`);
  const result = spawnSync(step.cmd, step.args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: step.env ? { ...process.env, ...step.env } : process.env,
  });
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
