/**
 * Testes da experiência unificada do parceiro (/partner/*) — EcoPet
 *
 * Valida de forma determinística (sem servidor/DB):
 *  - estrutura de navegação (sidebar + bottom nav) aponta para /partner/*
 *  - todas as 13 áreas do parceiro estão presentes
 *  - PARTNER acessa /partner/*; CLIENT / ONG / ADMIN são bloqueados
 *  - redirect padrão pós-login do PARTNER é /partner
 *  - gate de aprovação: rotas comerciais exigem parceiro aprovado
 *  - parceiro PENDENTE tem accessLevel "limited" e vê tela de aprovação
 *  - parceiro APROVADO tem accessLevel "full" e acessa tudo
 *  - account-status: PENDING não é bloqueado de /partner pelo middleware
 *    (gate é feito no shell), mas tela de status é mostrada
 *
 * Cobre os critérios de aceite de acesso/permissão (testes 1, 2, 13)
 * e a integridade de roteamento das áreas do parceiro.
 */
import {
  PARTNER_EXPERIENCE_NAV,
  PARTNER_EXPERIENCE_BOTTOM_NAV,
  PARTNER_IMMERSIVE_ROUTES,
  PARTNER_RIGHT_PANEL_ROUTES,
  isPartnerExperienceNavActive,
  isPartnerExperiencePath,
  partnerExperienceRouteRequiresApproval,
} from "../apps/web/src/lib/partner/experience-nav.ts";
import { canAccessRoute, getDefaultDashboardPath } from "../apps/web/src/lib/permissions.ts";
import { getPartnerAccessLevel } from "../apps/web/src/lib/partner/access.ts";
import { canAccessWithAccountStatus } from "../apps/web/src/lib/account-status.ts";

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

console.log("=== EcoPet — test:partner-experience ===\n");

// 1. Redirect pós-login
ok("PARTNER cai em /partner após login", getDefaultDashboardPath("PARTNER") === "/partner");

// 2. Navegação aponta para /partner/*
ok(
  "todos os itens da sidebar apontam para /partner*",
  PARTNER_EXPERIENCE_NAV.every((i) => i.href === "/partner" || i.href.startsWith("/partner/"))
);
ok(
  "todos os itens da bottom nav apontam para /partner*",
  PARTNER_EXPERIENCE_BOTTOM_NAV.every((i) => i.href === "/partner" || i.href.startsWith("/partner/"))
);
ok("sidebar contém as 13 áreas do parceiro", PARTNER_EXPERIENCE_NAV.length === 13);

// 3. Áreas esperadas presentes
const expected = [
  "/partner",
  "/partner/social",
  "/partner/marketplace",
  "/partner/products",
  "/partner/services",
  "/partner/orders",
  "/partner/appointments",
  "/partner/customers",
  "/partner/messages",
  "/partner/notifications",
  "/partner/eccopet",
  "/partner/profile",
  "/partner/settings",
];
const navHrefs = new Set(PARTNER_EXPERIENCE_NAV.map((i) => i.href));
for (const href of expected) {
  ok(`navegação inclui ${href}`, navHrefs.has(href));
}

// 4. PARTNER acessa todas as rotas; demais roles bloqueados (teste 13)
for (const { href } of PARTNER_EXPERIENCE_NAV) {
  ok(`PARTNER acessa ${href}`, canAccessRoute("PARTNER", href));
  ok(`CLIENT NÃO acessa ${href}`, !canAccessRoute("CLIENT", href));
  ok(`ONG NÃO acessa ${href}`, !canAccessRoute("ONG", href));
  ok(`ADMIN NÃO acessa ${href}`, !canAccessRoute("ADMIN", href));
}

// 5. Helpers de path
ok("isPartnerExperiencePath('/partner') = true", isPartnerExperiencePath("/partner"));
ok("isPartnerExperiencePath('/partner/orders') = true", isPartnerExperiencePath("/partner/orders"));
ok("isPartnerExperiencePath('/parceiro') = false", !isPartnerExperiencePath("/parceiro"));
ok("nav ativo: /partner só ativa em /partner", isPartnerExperienceNavActive("/partner", "/partner"));
ok(
  "nav ativo: /partner não ativa em /partner/orders",
  !isPartnerExperienceNavActive("/partner/orders", "/partner")
);
ok(
  "nav ativo: /partner/products ativa em subrota",
  isPartnerExperienceNavActive("/partner/products/123/edit", "/partner/products")
);

// 6. Gate de aprovação (rotas comerciais)
ok("rota /partner/products exige aprovação", partnerExperienceRouteRequiresApproval("/partner/products"));
ok("rota /partner/orders exige aprovação", partnerExperienceRouteRequiresApproval("/partner/orders"));
ok("rota /partner/appointments exige aprovação", partnerExperienceRouteRequiresApproval("/partner/appointments"));
ok("rota /partner/marketplace exige aprovação", partnerExperienceRouteRequiresApproval("/partner/marketplace"));
ok("rota /partner/eccopet exige aprovação", partnerExperienceRouteRequiresApproval("/partner/eccopet"));
ok("rota /partner (home) NÃO exige aprovação", !partnerExperienceRouteRequiresApproval("/partner"));
ok("rota /partner/social NÃO exige aprovação", !partnerExperienceRouteRequiresApproval("/partner/social"));
ok("rota /partner/profile NÃO exige aprovação", !partnerExperienceRouteRequiresApproval("/partner/profile"));
ok("rota /partner/settings NÃO exige aprovação", !partnerExperienceRouteRequiresApproval("/partner/settings"));

// 7. accessLevel por status de aprovação (teste 1 e 2)
ok(
  "parceiro APROVADO (ACTIVE + APPROVED) → full",
  getPartnerAccessLevel({ accountStatus: "ACTIVE", verificationStatus: "APPROVED" }) === "full"
);
ok(
  "parceiro PENDENTE (PENDING) → limited",
  getPartnerAccessLevel({ accountStatus: "PENDING", verificationStatus: "PENDING" }) === "limited"
);
ok(
  "parceiro ATIVO sem verificação → limited",
  getPartnerAccessLevel({ accountStatus: "ACTIVE", verificationStatus: null }) === "limited"
);

// 8. account-status middleware: PENDING acessa /partner (gate fica no shell)
ok(
  "PENDING partner acessa /partner (não bloqueado pelo middleware)",
  canAccessWithAccountStatus("PARTNER", "PENDING", "/partner").allowed === true
);
ok(
  "PENDING partner acessa /partner/profile",
  canAccessWithAccountStatus("PARTNER", "PENDING", "/partner/profile").allowed === true
);
ok(
  "SUSPENDED partner é redirecionado para tela de suspensão",
  canAccessWithAccountStatus("PARTNER", "SUSPENDED", "/partner").redirectTo === "/conta/suspensa"
);

// 9. Listas auxiliares são subconjuntos da navegação real
ok("rotas imersivas existem na navegação", PARTNER_IMMERSIVE_ROUTES.every((r) => navHrefs.has(r)));
ok("rotas com painel direito existem na navegação", PARTNER_RIGHT_PANEL_ROUTES.every((r) => navHrefs.has(r)));

console.log(`\n${passed} passaram, ${failed} falharam`);
process.exit(failed > 0 ? 1 : 0);
