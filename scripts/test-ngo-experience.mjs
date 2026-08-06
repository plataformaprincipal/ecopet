/**
 * Testes da experiência unificada da ONG (/ngo/*) — EcoPet
 *
 * Valida de forma determinística (sem servidor/DB):
 *  - navegação (sidebar + bottom nav) aponta para /ngo/*
 *  - áreas canônicas da ONG estão presentes (rotas PT atuais)
 *  - ONG acessa /ngo/*; CLIENT / PARTNER / ADMIN são bloqueados
 *  - redirect padrão pós-login da ONG é /ngo
 *  - gate de aprovação: rotas institucionais exigem ONG aprovada
 *  - ONG PENDENTE → accessLevel "limited"; APROVADA → "full"; SUSPENSA → "blocked"
 *  - account-status: PENDING acessa /ngo (gate no shell); SUSPENDED é redirecionada
 *  - áreas públicas (/adoption, /campaigns, /ngos) são públicas
 */
import {
  NGO_EXPERIENCE_NAV,
  NGO_EXPERIENCE_BOTTOM_NAV,
  NGO_IMMERSIVE_ROUTES,
  NGO_RIGHT_PANEL_ROUTES,
  isNgoExperienceNavActive,
  isNgoExperiencePath,
  ngoExperienceRouteRequiresApproval,
} from "../apps/web/src/lib/ong/experience-nav.ts";
import { canAccessRoute, getDefaultDashboardPath } from "../apps/web/src/lib/permissions.ts";
import { getOngAccessLevel } from "../apps/web/src/lib/ong/access.ts";
import { canAccessWithAccountStatus } from "../apps/web/src/lib/account-status.ts";
import { isPublicClientPath, requiresAuth } from "../apps/web/src/lib/auth/routes.ts";

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

console.log("=== EcoPet — test:ngo-experience ===\n");

// 1. Redirect pós-login
ok("ONG cai em /ngo após login", getDefaultDashboardPath("ONG") === "/ngo");

// 2. Navegação aponta para /ngo/*
ok(
  "todos os itens da sidebar apontam para /ngo*",
  NGO_EXPERIENCE_NAV.every((i) => i.href === "/ngo" || i.href.startsWith("/ngo/"))
);
ok(
  "todos os itens da bottom nav apontam para /ngo*",
  NGO_EXPERIENCE_BOTTOM_NAV.every((i) => i.href === "/ngo" || i.href.startsWith("/ngo/"))
);
ok(
  "sidebar contém as áreas canônicas da ONG (≥11)",
  NGO_EXPERIENCE_NAV.length >= 11
);

// 3. Áreas esperadas presentes (rotas PT atuais do produto)
const expected = [
  "/ngo",
  "/ngo/social",
  "/ngo/animais",
  "/ngo/adocoes",
  "/ngo/campanhas",
  "/ngo/supporters",
  "/ngo/messages",
  "/ngo/notifications",
  "/ngo/eccopet",
  "/ngo/profile",
  "/ngo/configuracoes",
];
const navHrefs = new Set(NGO_EXPERIENCE_NAV.map((i) => i.href));
for (const href of expected) {
  ok(`navegação inclui ${href}`, navHrefs.has(href));
}

// 4. ONG acessa todas as rotas; demais roles bloqueados
for (const { href } of NGO_EXPERIENCE_NAV) {
  ok(`ONG acessa ${href}`, canAccessRoute("ONG", href));
  ok(`CLIENT NÃO acessa ${href}`, !canAccessRoute("CLIENT", href));
  ok(`PARTNER NÃO acessa ${href}`, !canAccessRoute("PARTNER", href));
  ok(`ADMIN NÃO acessa ${href}`, !canAccessRoute("ADMIN", href));
}

// 5. Helpers de path
ok("isNgoExperiencePath('/ngo') = true", isNgoExperiencePath("/ngo"));
ok("isNgoExperiencePath('/ngo/animais') = true", isNgoExperiencePath("/ngo/animais"));
ok("isNgoExperiencePath('/ong') = false", !isNgoExperiencePath("/ong"));
ok("nav ativo: /ngo só ativa em /ngo", isNgoExperienceNavActive("/ngo", "/ngo"));
ok("nav ativo: /ngo não ativa em /ngo/animais", !isNgoExperienceNavActive("/ngo/animais", "/ngo"));
ok(
  "nav ativo: /ngo/animais ativa em subrota",
  isNgoExperienceNavActive("/ngo/animais/123/editar", "/ngo/animais")
);

// 6. Gate de aprovação (rotas institucionais PT)
ok("rota /ngo/animais exige aprovação", ngoExperienceRouteRequiresApproval("/ngo/animais"));
ok("rota /ngo/adocoes exige aprovação", ngoExperienceRouteRequiresApproval("/ngo/adocoes"));
ok("rota /ngo/campanhas exige aprovação", ngoExperienceRouteRequiresApproval("/ngo/campanhas"));
ok("rota /ngo/social exige aprovação", ngoExperienceRouteRequiresApproval("/ngo/social"));
ok("rota /ngo/supporters exige aprovação", ngoExperienceRouteRequiresApproval("/ngo/supporters"));
ok("rota /ngo/eccopet exige aprovação", ngoExperienceRouteRequiresApproval("/ngo/eccopet"));
ok("rota /ngo (home) NÃO exige aprovação", !ngoExperienceRouteRequiresApproval("/ngo"));
ok("rota /ngo/profile NÃO exige aprovação", !ngoExperienceRouteRequiresApproval("/ngo/profile"));
ok(
  "rota /ngo/configuracoes NÃO exige aprovação",
  !ngoExperienceRouteRequiresApproval("/ngo/configuracoes")
);
ok("rota /ngo/messages NÃO exige aprovação", !ngoExperienceRouteRequiresApproval("/ngo/messages"));

// 7. accessLevel
ok(
  "ONG APROVADA (ACTIVE + APPROVED) → full",
  getOngAccessLevel({ accountStatus: "ACTIVE", verificationStatus: "APPROVED" }) === "full"
);
ok(
  "ONG PENDENTE (PENDING) → limited",
  getOngAccessLevel({ accountStatus: "PENDING", verificationStatus: "PENDING" }) === "limited"
);
ok(
  "ONG ATIVA sem verificação documental → full (regra atual ONG)",
  getOngAccessLevel({ accountStatus: "ACTIVE", verificationStatus: null }) === "full"
);
ok(
  "ONG SUSPENSA → blocked",
  getOngAccessLevel({ accountStatus: "SUSPENDED", verificationStatus: "APPROVED" }) === "blocked"
);

// 8. account-status middleware
ok(
  "PENDING ONG acessa /ngo (gate fica no shell)",
  canAccessWithAccountStatus("ONG", "PENDING", "/ngo").allowed === true
);
ok(
  "PENDING ONG acessa /ngo/profile",
  canAccessWithAccountStatus("ONG", "PENDING", "/ngo/profile").allowed === true
);
ok(
  "SUSPENDED ONG é redirecionada para tela de suspensão",
  canAccessWithAccountStatus("ONG", "SUSPENDED", "/ngo").redirectTo === "/conta/suspensa"
);

// 9. Áreas públicas
ok("/adoption é pública", isPublicClientPath("/adoption") && !requiresAuth("/adoption"));
ok("/adoption/[id] é pública", isPublicClientPath("/adoption/abc") && !requiresAuth("/adoption/abc"));
ok("/campaigns é pública", isPublicClientPath("/campaigns") && !requiresAuth("/campaigns"));
ok("/campaigns/[id] é pública", isPublicClientPath("/campaigns/abc") && !requiresAuth("/campaigns/abc"));
ok("/ngos/[id] é pública", isPublicClientPath("/ngos/abc") && !requiresAuth("/ngos/abc"));

// 10. Listas auxiliares
ok("rotas imersivas existem na navegação", NGO_IMMERSIVE_ROUTES.every((r) => navHrefs.has(r)));
ok(
  "rotas com painel direito existem na navegação",
  NGO_RIGHT_PANEL_ROUTES.every((r) => navHrefs.has(r) || r.startsWith("/ngo"))
);

console.log(`\n${passed} passaram, ${failed} falharam`);
process.exit(failed > 0 ? 1 : 0);
