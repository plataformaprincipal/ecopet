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
ok("getDefaultDashboardPath ADMIN → /dashboard/admin", getDefaultDashboardPath("ADMIN") === "/dashboard/admin");
ok("getDefaultDashboardPath CLIENT → /client", getDefaultDashboardPath("CLIENT") === "/client");

// Acesso à nova experiência unificada do cliente (/client/*)
ok("CLIENT acessa /client", canAccessRoute("CLIENT", "/client"));
ok("CLIENT acessa /client/social", canAccessRoute("CLIENT", "/client/social"));
ok("CLIENT acessa /client/marketplace", canAccessRoute("CLIENT", "/client/marketplace"));
ok("PARTNER NÃO acessa /client", !canAccessRoute("PARTNER", "/client"));
ok("ONG NÃO acessa /client", !canAccessRoute("ONG", "/client"));
ok("ADMIN NÃO acessa /client", !canAccessRoute("ADMIN", "/client"));

// Acesso à nova experiência unificada do parceiro (/partner/*)
ok("getDefaultDashboardPath PARTNER → /partner", getDefaultDashboardPath("PARTNER") === "/partner");
ok("PARTNER acessa /partner", canAccessRoute("PARTNER", "/partner"));
ok("PARTNER acessa /partner/products", canAccessRoute("PARTNER", "/partner/products"));
ok("PARTNER acessa /partner/orders", canAccessRoute("PARTNER", "/partner/orders"));
ok("CLIENT NÃO acessa /partner", !canAccessRoute("CLIENT", "/partner"));
ok("CLIENT NÃO acessa /partner/products", !canAccessRoute("CLIENT", "/partner/products"));
ok("ONG NÃO acessa /partner", !canAccessRoute("ONG", "/partner"));
ok("ADMIN NÃO acessa /partner", !canAccessRoute("ADMIN", "/partner"));

// Acesso à nova experiência unificada da ONG (/ngo/*)
ok("getDefaultDashboardPath ONG → /ngo", getDefaultDashboardPath("ONG") === "/ngo");
ok("ONG acessa /ngo", canAccessRoute("ONG", "/ngo"));
ok("ONG acessa /ngo/animals", canAccessRoute("ONG", "/ngo/animals"));
ok("ONG acessa /ngo/adoptions", canAccessRoute("ONG", "/ngo/adoptions"));
ok("ONG acessa /ngo/campaigns", canAccessRoute("ONG", "/ngo/campaigns"));
ok("CLIENT NÃO acessa /ngo", !canAccessRoute("CLIENT", "/ngo"));
ok("CLIENT NÃO acessa /ngo/animals", !canAccessRoute("CLIENT", "/ngo/animals"));
ok("PARTNER NÃO acessa /ngo", !canAccessRoute("PARTNER", "/ngo"));
ok("ADMIN NÃO acessa /ngo", !canAccessRoute("ADMIN", "/ngo"));

const http = await runHttpPermissionTests();
passed += http.passed;
failed += http.failed;

console.log(`\n${passed} passaram, ${failed} falharam${http.skipped ? " (HTTP ignorados)" : ""}`);
process.exit(failed > 0 ? 1 : 0);
