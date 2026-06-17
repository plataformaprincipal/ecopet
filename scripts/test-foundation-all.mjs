/**
 * Executa todos os testes foundation em sequência.
 * Requer WEB_URL apontando para servidor com código atual.
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const SUITES = [
  "test-foundation-auth.mjs",
  "test-foundation-catalog.mjs",
  "test-foundation-profiles.mjs",
  "test-foundation-pets.mjs",
  "test-foundation-appointments.mjs",
  "test-foundation-marketplace.mjs",
  "test-foundation-products.mjs",
  "test-foundation-services.mjs",
  "test-foundation-cart.mjs",
  "test-foundation-orders.mjs",
  "test-foundation-integrations.mjs",
  "test-foundation-navigation.mjs",
  "test-foundation-chat.mjs",
  "test-foundation-social.mjs",
  "test-foundation-gestor.mjs",
];

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [path.join(root, "scripts", script)], {
      stdio: "inherit",
      env: process.env,
      shell: true,
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${script} falhou (${code})`))));
  });
}

async function main() {
  console.log("=== EcoPet Foundation ALL ===\n");
  for (const suite of SUITES) {
    console.log(`\n--- ${suite} ---\n`);
    await run(suite);
  }
  console.log("\n✓ Todos os testes foundation passaram.");
}

main().catch((e) => {
  console.error("\n✗", e.message);
  process.exit(1);
});
