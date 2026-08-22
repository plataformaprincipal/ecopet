/**
 * Correções estruturais: EccoPet AI, Stories, sessão e tema.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { AI_COMMERCE_SKU_LIST } from "./ai-commerce/flags";
import { AI_COMMERCE_PRODUCTS } from "./ai-commerce/catalog";
import { isStoryPubliclyActive } from "./social/story-policy";
import { normalizeAppearanceTheme, cycleAppearanceTheme } from "./theme/ecopet-theme";

const webSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSrc(rel: string) {
  return fs.readFileSync(path.join(webSrc, rel), "utf8");
}

describe("EccoPet AI wiring", () => {
  it("catalogo canônico tem 13 SKUs conectados ao runtime", () => {
    assert.equal(AI_COMMERCE_SKU_LIST.length, 13);
    assert.equal(AI_COMMERCE_PRODUCTS.length, 13);
    for (const product of AI_COMMERCE_PRODUCTS) {
      assert.ok(product.capabilityId.length > 0);
      assert.ok(product.href.startsWith("/eccopet/"));
      assert.ok(AI_COMMERCE_SKU_LIST.includes(product.sku));
    }
  });

  it("rotas de persona usam a landing canônica, não um segundo chatbot", () => {
    assert.match(readSrc("app/(app)/eccopet/page.tsx"), /EccoPetAiLanding/);
    assert.match(readSrc("app/(app)/client/eccopet/page.tsx"), /EccoPetAiLanding/);
    assert.match(readSrc("app/(app)/partner/eccopet/page.tsx"), /EccoPetAiLanding/);
    assert.match(readSrc("app/(app)/ngo/eccopet/page.tsx"), /EccoPetAiLanding/);
    assert.match(readSrc("app/(app)/eccopet/assistente/page.tsx"), /EccoPetAIShell/);
    assert.match(readSrc("app/(app)/ia/page.tsx"), /redirect\("\/eccopet"\)/);
  });

  it("navegação e i18n padronizam o módulo como EccoPet AI", () => {
    const pt = JSON.parse(readSrc("i18n/locales/pt-BR.json")) as {
      pub: { nav: { eccopet: string }; home: { areaEccopet: string; aiCta: string } };
      nav: { ia: string };
    };
    assert.equal(pt.pub.nav.eccopet, "EccoPet AI");
    assert.equal(pt.nav.ia, "EccoPet AI");
    assert.equal(pt.pub.home.areaEccopet, "EccoPet AI");
    assert.match(pt.pub.home.aiCta, /EccoPet AI/);
    const partnerNav = readSrc("lib/partner/experience-nav.ts");
    assert.match(partnerNav, /href: "\/partner\/eccopet".*requiresApproval: false/);
    const ngoNav = readSrc("lib/ong/experience-nav.ts");
    assert.match(ngoNav, /href: "\/ngo\/eccopet".*requiresApproval: false/);
  });
});

describe("Stories separados de posts", () => {
  it("query pública exige expiresAt > now", () => {
    const now = new Date("2026-08-21T12:00:00.000Z");
    assert.equal(isStoryPubliclyActive(new Date("2026-08-22T12:00:00.000Z"), now), true);
    assert.equal(isStoryPubliclyActive(new Date("2026-08-21T11:59:00.000Z"), now), false);
    assert.equal(isStoryPubliclyActive(null, now), false);
    const src = readSrc("lib/social/stories.ts");
    assert.match(src, /expiresAt: \{ gt: now \}/);
    assert.ok(!src.includes("expiresAt: null"));
  });

  it("Seu story não deriva posts do feed", () => {
    const rail = readSrc("components/features/social/ecopet-social/stories-rail.tsx");
    assert.ok(!rail.includes("fetchPublicPosts"));
    assert.match(rail, /\/api\/social\/stories/);
    assert.match(rail, /\/social\/stories\//);
    assert.ok(!rail.includes("/feed/post/"));
  });
});

describe("Sessão persistente e logout", () => {
  it("JWT e cookie duram 30 dias com renovação no /api/auth/session", () => {
    const session = readSrc("lib/auth-session.ts");
    assert.match(session, /setExpirationTime\("30d"\)/);
    assert.match(session, /maxAge: 60 \* 60 \* 24 \* 30/);
    const route = readSrc("app/api/auth/session/route.ts");
    assert.match(route, /createSessionToken/);
    assert.match(route, /cookies\.set\(SESSION_COOKIE/);
  });

  it("Partner e ONG têm Sair visível nos shells", () => {
    assert.match(readSrc("components/features/partner/experience/partner-experience-sidebar.tsx"), /LogoutButton/);
    assert.match(readSrc("components/features/partner/experience/partner-experience-shell.tsx"), /LogoutButton/);
    assert.match(readSrc("components/features/ong/experience/ngo-experience-sidebar.tsx"), /LogoutButton/);
    assert.match(readSrc("components/features/ong/experience/ngo-experience-shell.tsx"), /LogoutButton/);
    assert.match(readSrc("components/features/partner/pages/partner-profile-management-page.tsx"), /LogoutButton/);
  });
});

describe("Tema light/dark", () => {
  it("black antigo vira dark e o ciclo não inclui preto", () => {
    assert.equal(normalizeAppearanceTheme("black"), "dark");
    assert.equal(normalizeAppearanceTheme("dark"), "dark");
    assert.equal(normalizeAppearanceTheme("light"), "light");
    assert.equal(cycleAppearanceTheme("light"), "dark");
    assert.equal(cycleAppearanceTheme("dark"), "light");
    assert.equal(cycleAppearanceTheme("black"), "light");
    const provider = readSrc("providers/theme-provider.tsx");
    assert.ok(!provider.includes("black:"));
    assert.match(provider, /defaultTheme="light"/);
  });
});
