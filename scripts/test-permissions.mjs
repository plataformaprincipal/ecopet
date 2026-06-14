/**
 * Testes de permissões por role — EcoPet (unitários + HTTP opcional)
 */
import {
  canAccessRoute,
  getDefaultDashboardPath,
  isAdminOnlyPath,
} from "../apps/web/src/lib/permissions.ts";
import { runHttpPermissionTests } from "./test-permissions-http.mjs";

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

console.log("=== EcoPet — test:permissions ===\n");
console.log("--- Testes unitários ---\n");

ok("CLIENT acessa /dashboard", canAccessRoute("CLIENT", "/dashboard"));
ok("CLIENT acessa /perfil", canAccessRoute("CLIENT", "/perfil"));
ok("CLIENT acessa /meu-pet", canAccessRoute("CLIENT", "/meu-pet"));
ok("CLIENT NÃO acessa /gestor", !canAccessRoute("CLIENT", "/gestor"));
ok("CLIENT NÃO acessa /admin", !canAccessRoute("CLIENT", "/admin"));
ok("CLIENT NÃO acessa /agro", !canAccessRoute("CLIENT", "/agro"));

ok("PARTNER acessa /dashboard", canAccessRoute("PARTNER", "/dashboard"));
ok("PARTNER NÃO acessa /gestor", !canAccessRoute("PARTNER", "/gestor"));
ok("PARTNER NÃO acessa /meu-pet", !canAccessRoute("PARTNER", "/meu-pet"));

ok("ONG acessa /dashboard/ong", canAccessRoute("ONG", "/dashboard/ong"));
ok("ONG NÃO acessa /gestor", !canAccessRoute("ONG", "/gestor"));
ok("ONG NÃO acessa /meu-pet", !canAccessRoute("ONG", "/meu-pet"));

ok("ADMIN acessa /gestor", canAccessRoute("ADMIN", "/gestor"));
ok("ADMIN acessa /admin", canAccessRoute("ADMIN", "/admin"));
ok("ADMIN NÃO acessa /meu-pet", !canAccessRoute("ADMIN", "/meu-pet"));
ok("ADMIN NÃO acessa /marketplace", !canAccessRoute("ADMIN", "/marketplace"));

ok("isAdminOnlyPath /gestor", isAdminOnlyPath("/gestor/audit"));
ok("getDefaultDashboardPath ADMIN → /gestor", getDefaultDashboardPath("ADMIN") === "/gestor");
ok("getDefaultDashboardPath CLIENT → /dashboard", getDefaultDashboardPath("CLIENT") === "/dashboard");

const http = await runHttpPermissionTests();
passed += http.passed;
failed += http.failed;

console.log(`\n${passed} passaram, ${failed} falharam${http.skipped ? " (HTTP ignorados)" : ""}`);
process.exit(failed > 0 ? 1 : 0);
