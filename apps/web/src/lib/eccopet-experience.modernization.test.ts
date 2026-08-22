/**
 * Modernização visual: tema, carrinho canônico, Home e navegação.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { computeEarnPoints, DEFAULT_LOYALTY_POLICY } from "./loyalty/rules";
import { normalizeAppearanceTheme, cycleAppearanceTheme } from "./theme/ecopet-theme";

const webSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSrc(rel: string) {
  return fs.readFileSync(path.join(webSrc, rel), "utf8");
}

function readJson(rel: string) {
  return JSON.parse(readSrc(rel)) as Record<string, unknown>;
}

describe("Tema semântico", () => {
  it("default é light e black legado vira dark", () => {
    assert.equal(normalizeAppearanceTheme(undefined), "light");
    assert.equal(normalizeAppearanceTheme("light"), "light");
    assert.equal(normalizeAppearanceTheme("dark"), "dark");
    assert.equal(normalizeAppearanceTheme("black"), "dark");
    assert.equal(cycleAppearanceTheme("light"), "dark");
    assert.equal(cycleAppearanceTheme("black"), "light");
  });

  it("header e toolbar compartilham a mesma chave de persistência", () => {
    const toggle = readSrc("components/shared/theme/theme-toggle.tsx");
    const toolbar = readSrc("components/shared/accessibility/accessibility-toolbar.tsx");
    const provider = readSrc("providers/theme-provider.tsx");
    assert.match(provider, /storageKey=\{ECOPET_THEME_STORAGE_KEY\}/);
    assert.match(toggle, /normalizeAppearanceTheme/);
    assert.match(toolbar, /normalizeAppearanceTheme/);
    assert.ok(!provider.includes("black:"));
  });
});

describe("Carrinho canônico", () => {
  it("página pública usa CartPanel com carrinho do servidor", () => {
    const page = readSrc("app/(app)/carrinho/page.tsx");
    const panel = readSrc("components/features/marketplace/cart-panel.tsx");
    const content = readSrc("components/features/marketplace/cart-page-content.tsx");
    assert.match(page, /CartPanel/);
    assert.match(panel, /useServerCart/);
    assert.match(panel, /addProductToServerCart/);
    assert.match(panel, /cart\.undo/);
    assert.match(panel, /cart\.haveCoupon/);
    assert.match(content, /CartPanel/);
    assert.ok(!panel.includes("useMarketplaceStore"));
    assert.ok(!panel.includes("DIGITAL_AI") || panel.includes('itemType !== "DIGITAL_AI"'));
  });

  it("IA gratuita não entra no serialize do carrinho", () => {
    const service = readSrc("lib/cart/cart-service.ts");
    assert.match(service, /isAiMonetizationFree/);
    assert.match(service, /hideAi/);
    assert.match(service, /AI_COMMERCE_ITEM_TYPE/);
    assert.match(readSrc("lib/ai-commerce/flags.ts"), /AI_FREE_BETA|isAiMonetizationFree/);
  });

  it("estoque insuficiente informa a quantidade máxima", () => {
    const route = readSrc("app/api/cart/items/[itemId]/route.ts");
    assert.match(route, /Quantidade máxima disponível/);
    assert.match(route, /parseInsufficientStock/);
  });

  it("EccoPontos do resumo vêm da política canônica do servidor", () => {
    const points = computeEarnPoints({
      amountBrl: 27,
      pointsPerBrl: DEFAULT_LOYALTY_POLICY.pointsPerBrl,
    });
    assert.equal(points, 27);
    assert.match(readSrc("lib/cart/cart-service.ts"), /estimatedRewards/);
    assert.match(readSrc("lib/cart/cart-service.ts"), /computeEarnPoints/);
  });
});

describe("Home e navegação", () => {
  it("Home não compara com concorrentes e trata EccoPet AI como gratuito", () => {
    const home = readSrc("components/features/public-premium/premium-public-home.tsx");
    const pt = readJson("i18n/locales/pt-BR.json") as {
      pub: { home: Record<string, string> };
    };
    assert.ok(!home.includes("Chewy"));
    assert.ok(!String(pt.pub.home.marketSubtitle).includes("Chewy"));
    assert.ok(!String(pt.pub.home.heroTitle).includes("em breve"));
    assert.match(home, /href[=:]\s*"\/eccopet"/);
    assert.match(home, /href[=:]\s*"\/marketplace"/);
    assert.match(home, /href[=:]\s*"\/servicos"/);
    assert.match(home, /href[=:]\s*"\/social"/);
    assert.match(home, /href[=:]\s*"\/adocao"/);
    assert.match(home, /isAuthenticated/);
    assert.ok(!home.includes("IA Pet"));
    assert.equal(pt.pub.home.aiFreeBadge.includes("Grátis") || pt.pub.home.aiSubtitle.includes("gratuit"), true);
  });

  it("navegação pública desktop e mobile ficam em 5 itens sem Explorar no header", () => {
    const nav = readSrc("lib/navigation/primary-nav.ts");
    assert.match(nav, /PUBLIC_DESKTOP_NAVIGATION/);
    assert.match(nav, /PUBLIC_MOBILE_NAVIGATION/);
    assert.match(nav, /href: "\/servicos"/);
    assert.match(nav, /href: "\/adocao"/);
    assert.match(nav, /id: "home"/);
    const desktopBlock = nav.slice(nav.indexOf("PUBLIC_DESKTOP_NAVIGATION"), nav.indexOf("PUBLIC_MOBILE_NAVIGATION"));
    assert.ok(!desktopBlock.includes('href: "/explorar"'));
  });
});
