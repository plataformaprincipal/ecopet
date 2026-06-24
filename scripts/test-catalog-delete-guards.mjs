/**
 * Unitários — regras de exclusão de catálogo
 */
import {
  getProductDeleteBlockReason,
  getServiceDeleteBlockReason,
} from "../apps/web/src/lib/catalog/delete-guards.ts";

let passed = 0;
let failed = 0;

function ok(label, cond) {
  if (cond) {
    console.log(`✓ ${label}`);
    passed++;
  } else {
    console.error(`✗ ${label}`);
    failed++;
  }
}

async function main() {
  const productBlocked = await getProductDeleteBlockReason(
    { orderItem: { count: async () => 1 } },
    "p1"
  );
  ok("produto com pedido bloqueia delete", productBlocked === "HAS_ORDERS");

  const productOk = await getProductDeleteBlockReason(
    { orderItem: { count: async () => 0 } },
    "p1"
  );
  ok("produto sem pedido permite delete", productOk === null);

  const serviceBlocked = await getServiceDeleteBlockReason(
    { appointment: { count: async () => 2 } },
    "s1"
  );
  ok("serviço com agendamento bloqueia delete", serviceBlocked === "HAS_APPOINTMENTS");

  const serviceOk = await getServiceDeleteBlockReason(
    { appointment: { count: async () => 0 } },
    "s1"
  );
  ok("serviço sem agendamento permite delete", serviceOk === null);

  if (failed > 0) {
    console.error(`\n❌ ${failed} falha(s)`);
    process.exit(1);
  }
  console.log(`\n✅ ${passed} testes OK`);
}

main();
