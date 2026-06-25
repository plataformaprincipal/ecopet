/**
 * Testes da experiência unificada do cliente (/client/*) — EcoPet
 *
 * Valida de forma determinística (sem servidor/DB):
 *  - estrutura de navegação (sidebar + bottom nav) aponta para /client/*
 *  - todas as rotas do cliente são acessíveis pelo CLIENT
 *  - PARTNER / ONG / ADMIN são bloqueados de /client/*
 *  - o redirect padrão pós-login do CLIENT é /client
 *  - listas de rotas imersivas / painel direito são subconjuntos da navegação
 *
 * Cobre os critérios de aceite de acesso (visitante/parceiro não acessam /client)
 * e a integridade de roteamento de todas as 13 áreas do cliente.
 */
import {
  CLIENT_EXPERIENCE_NAV,
  CLIENT_EXPERIENCE_BOTTOM_NAV,
  CLIENT_IMMERSIVE_ROUTES,
  CLIENT_RIGHT_PANEL_ROUTES,
  isClientExperienceNavActive,
  isClientExperiencePath,
} from "../apps/web/src/lib/client/experience-nav.ts";
import { canAccessRoute, getDefaultDashboardPath } from "../apps/web/src/lib/permissions.ts";

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

console.log("=== EcoPet — test:client-experience ===\n");

// 1. Redirect pós-login
ok("CLIENT cai em /client após login", getDefaultDashboardPath("CLIENT") === "/client");

// 2. Navegação aponta para /client/*
ok(
  "todos os itens da sidebar apontam para /client*",
  CLIENT_EXPERIENCE_NAV.every((i) => i.href === "/client" || i.href.startsWith("/client/"))
);
ok(
  "todos os itens da bottom nav apontam para /client/*",
  CLIENT_EXPERIENCE_BOTTOM_NAV.every((i) => i.href.startsWith("/client/"))
);
ok("sidebar contém as 13 áreas do cliente", CLIENT_EXPERIENCE_NAV.length === 13);

// 3. Áreas esperadas presentes
const expected = [
  "/client",
  "/client/social",
  "/client/explore",
  "/client/marketplace",
  "/client/services",
  "/client/eccopet",
  "/client/my-pet",
  "/client/cart",
  "/client/orders",
  "/client/appointments",
  "/client/messages",
  "/client/notifications",
  "/client/profile",
];
const navHrefs = new Set(CLIENT_EXPERIENCE_NAV.map((i) => i.href));
for (const href of expected) {
  ok(`navegação inclui ${href}`, navHrefs.has(href));
}

// 4. CLIENT acessa todas as rotas; demais roles são bloqueados
for (const { href } of CLIENT_EXPERIENCE_NAV) {
  ok(`CLIENT acessa ${href}`, canAccessRoute("CLIENT", href));
  ok(`PARTNER NÃO acessa ${href}`, !canAccessRoute("PARTNER", href));
  ok(`ONG NÃO acessa ${href}`, !canAccessRoute("ONG", href));
  ok(`ADMIN NÃO acessa ${href}`, !canAccessRoute("ADMIN", href));
}

// 5. Helpers de path
ok("isClientExperiencePath('/client') = true", isClientExperiencePath("/client"));
ok("isClientExperiencePath('/client/social') = true", isClientExperiencePath("/client/social"));
ok("isClientExperiencePath('/cliente') = false", !isClientExperiencePath("/cliente"));
ok("nav ativo: /client só ativa em /client", isClientExperienceNavActive("/client", "/client"));
ok(
  "nav ativo: /client não ativa em /client/social",
  !isClientExperienceNavActive("/client/social", "/client")
);
ok(
  "nav ativo: /client/social ativa em subrota",
  isClientExperienceNavActive("/client/social/post/1", "/client/social")
);

// 6. Listas auxiliares são subconjuntos da navegação real
ok(
  "rotas imersivas existem na navegação",
  CLIENT_IMMERSIVE_ROUTES.every((r) => navHrefs.has(r))
);
ok(
  "rotas com painel direito existem na navegação",
  CLIENT_RIGHT_PANEL_ROUTES.every((r) => navHrefs.has(r))
);

console.log(`\n${passed} passaram, ${failed} falharam`);
process.exit(failed > 0 ? 1 : 0);
