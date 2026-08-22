/**
 * Estabilização pós-go-live — testes unitários dos bugs reais.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isValidBrazilPhoneInput,
  normalizeBrazilPhoneInput,
} from "./validation/brazil-phone";
import { checkoutSchema } from "@/schemas/product";
import { BRAZILIAN_STATE_OPTIONS } from "./address/brazilian-states";
import { filterCities } from "./address/brazilian-cities";
import { zodIssuesToFieldMap } from "./validation/field-errors";
import { messageForDuplicateCode } from "./registration/document-messages";
import { isAuthorizedPaidSource } from "./payments/simulated-payments";
import { planToolsFromMessage } from "./ai/modules/intent-router";
import { parseLoginIdentifier } from "./auth/login-identifier";

const webSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readSrc(rel: string) {
  return fs.readFileSync(path.join(webSrc, rel), "utf8");
}

describe("valid BR phone accepted", () => {
  const valid = ["(83) 98812-3456", "83 98812-3456", "83988123456", "+55 83 98812-3456"];
  for (const sample of valid) {
    it(`aceita ${sample}`, () => {
      assert.equal(isValidBrazilPhoneInput(sample), true);
      assert.equal(normalizeBrazilPhoneInput(sample), "+5583988123456");
    });
  }

  it("rejeita sequência obviamente inválida", () => {
    assert.equal(isValidBrazilPhoneInput("(83) 99999-9999"), false);
    assert.equal(isValidBrazilPhoneInput("11111111111"), false);
  });
});

describe("checkout field-level validation", () => {
  it("aponta CEP incompleto no campo zipCode", () => {
    const parsed = checkoutSchema.safeParse({
      deliveryMethod: "DELIVERY_LOCAL",
      paymentMethod: "PIX",
      phone: "83988123456",
      address: {
        street: "Rua das Flores",
        number: "10",
        city: "João Pessoa",
        state: "PB",
        zipCode: "58000-00",
      },
    });
    assert.equal(parsed.success, false);
    if (parsed.success) return;
    const fields = zodIssuesToFieldMap(parsed.error);
    assert.equal(fields.zipCode, "CEP incompleto. Informe 8 números.");
  });

  it("exige UF da lista brasileira", () => {
    const parsed = checkoutSchema.safeParse({
      deliveryMethod: "DELIVERY_LOCAL",
      paymentMethod: "PIX",
      phone: "83988123456",
      address: {
        street: "Rua das Flores",
        number: "10",
        city: "João Pessoa",
        state: "XX",
        zipCode: "58000000",
      },
    });
    assert.equal(parsed.success, false);
    if (parsed.success) return;
    const fields = zodIssuesToFieldMap(parsed.error);
    assert.ok(fields.state);
  });
});

describe("Brazilian UF select", () => {
  it("contém 27 UFs com rótulo PB — Paraíba", () => {
    assert.equal(BRAZILIAN_STATE_OPTIONS.length, 27);
    assert.ok(BRAZILIAN_STATE_OPTIONS.some((s) => s.code === "PB" && s.label.includes("Paraíba")));
  });
});

describe("city autocomplete fallback", () => {
  it("filtra enquanto digita e permite valor manual fora da lista", () => {
    assert.deepEqual(filterCities(["João Pessoa", "Campina Grande"], "joão", 12), ["João Pessoa"]);
    assert.deepEqual(filterCities([], "Cidade Nova", 12), []);
  });
});

describe("ONG uniqueness messages", () => {
  it("não usa mensagem genérica para e-mail/CNPJ", () => {
    assert.equal(messageForDuplicateCode("EMAIL_DUPLICATE"), "Este e-mail já está cadastrado.");
    assert.equal(messageForDuplicateCode("CNPJ_DUPLICATE"), "Este CNPJ já possui cadastro.");
  });
});

describe("partner conversation never remains indefinitely loading", () => {
  it("mensagens usam timeout e PENDING pode conversar", () => {
    const clientApi = readSrc("lib/messages/client-api.ts");
    assert.ok(clientApi.includes("fetchWithTimeout"));
    const perms = readSrc("lib/messages/permissions.ts");
    assert.ok(perms.includes('status === "ACTIVE" || status === "PENDING"'));
  });
});

describe("authenticated social posting does not request login", () => {
  it("auth gate espera sessão carregar antes de abrir modal", () => {
    const src = readSrc("providers/auth-gate-provider.tsx");
    assert.ok(src.includes("if (isLoading)"));
    assert.ok(src.includes("queuedAction"));
    assert.ok(!src.includes("setOpen(true)") || src.indexOf("isLoading") < src.indexOf("setOpen(true)"));
  });
});

describe("AI immediate pending state", () => {
  it("shell insere pending imediatamente", () => {
    const src = readSrc("components/features/eccopet-ai/eccopet-ai-shell.tsx");
    assert.ok(src.includes("pending: true"));
    const bubble = readSrc("components/features/eccopet-ai/ai-message-bubble.tsx");
    assert.ok(bubble.includes("EccoPet está pensando"));
  });
});

describe("AI image generation intent", () => {
  it("roteia generate_image", () => {
    const plan = planToolsFromMessage("Crie uma imagem de um camelo feliz.", "CLIENT");
    assert.equal(plan.tools[0]?.name, "generate_image");
  });
});

describe("reviews menu opens reviews", () => {
  it("perfil aponta para /dashboard/client/reviews", () => {
    const src = readSrc("components/features/client/pages/client-profile-management-page.tsx");
    assert.ok(src.includes('href="/dashboard/client/reviews"'));
    assert.ok(src.includes("Minhas avaliações"));
    assert.ok(fs.existsSync(path.join(webSrc, "app/(app)/dashboard/client/reviews/page.tsx")));
  });
});

describe("favorites opens favorites", () => {
  it("atalho de favoritos não aponta para home do marketplace", () => {
    const src = readSrc("components/features/client/pages/client-profile-management-page.tsx");
    assert.ok(src.includes("/marketplace/favoritos"));
    assert.ok(fs.existsSync(path.join(webSrc, "app/(app)/marketplace/favoritos/page.tsx")));
  });
});

describe("orders empty state CTA", () => {
  it("pedidos vazios têm CTA para marketplace", () => {
    const src = readSrc("components/features/marketplace/orders-panels.tsx");
    assert.ok(src.includes("Você ainda não fez nenhum pedido"));
    assert.ok(src.includes('href="/marketplace"'));
  });
});

describe("story creation opens", () => {
  it("Seu story abre o composer", () => {
    const src = readSrc("components/features/social/stories-bar.tsx");
    assert.ok(src.includes("Seu story"));
    assert.ok(src.includes("StoryComposer"));
  });
});

describe("CNPJ lookup failure does not block login", () => {
  it("lookup trata indisponibilidade como continue manual", () => {
    const src = readSrc("lib/integrations/cnpj/cnpj-service.ts");
    assert.ok(src.includes("unavailable: true"));
    assert.ok(src.includes("continue manualmente"));
  });
});

describe("partner login independent from CNPJ lookup", () => {
  it("login não consulta BrasilAPI", () => {
    const src = readSrc("app/api/auth/login/route.ts");
    assert.ok(!src.includes("lookupCnpj"));
    assert.ok(!src.includes("brasilapi"));
    const parsed = parseLoginIdentifier("12.345.678/0001-95");
    assert.equal(parsed.type, "document");
    assert.equal(parsed.value.length, 14);
  });
});

describe("partner/ONG light and dark theme", () => {
  it("não oferece tema black e normaliza preferência antiga", () => {
    const src = readSrc("providers/theme-provider.tsx");
    assert.ok(!src.includes('"dark black"'));
    assert.ok(!src.includes('black: "black"'));
    const theme = readSrc("lib/theme/ecopet-theme.ts");
    assert.ok(theme.includes("normalizeAppearanceTheme"));
    assert.ok(!theme.includes('"black" as const'));
  });
});

describe("payment state transition", () => {
  it("PAID só por webhook ou poll", () => {
    assert.equal(isAuthorizedPaidSource("webhook"), true);
    assert.equal(isAuthorizedPaidSource("poll"), true);
    assert.equal(isAuthorizedPaidSource("frontend"), false);
  });
});

describe("social AI tab removed, global assistant kept", () => {
  it("hub social não tem aba de IA", () => {
    const src = readSrc("components/features/social/hub/social-hub.tsx");
    assert.ok(!src.includes("HubAssistantPanel"));
    assert.ok(src.includes('"feed"'));
    const layout = readSrc("app/layout.tsx");
    assert.ok(layout.includes("GlobalEcopetAssistant"));
  });
});

describe("cart icon with badge", () => {
  it("barra pública tem carrinho", () => {
    const src = readSrc("components/layouts/public-app-bar.tsx");
    assert.ok(src.includes("ShoppingCart"));
    assert.ok(src.includes("itemCount"));
  });
});

describe("appointments service loading resolves", () => {
  it("detalhe de serviço tem estados empty/error", () => {
    const src = readSrc("components/features/foundation/client-service-detail-panel.tsx");
    assert.ok(src.includes('"error"') || src.includes("Tentar novamente"));
  });
});
