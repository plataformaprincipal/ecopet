import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { AI_COMMERCE_PRODUCTS } from "./catalog";
import { listCapabilityRuntimes } from "./capability-runtime";
import { listSpecialistExperiences, specialistRegistryRow } from "./specialist-experience";
import { listSpecialistProtocols } from "./specialist-protocols";
import { computeNextBestAction } from "./next-best-action";
import { listEccoPetSaudeQuotes } from "../eccopet-saude/plans";
import { mapEmergencyServices, NO_VET_AVAILABLE_COPY } from "../bubis/map-emergency-services";

const webSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
function readSrc(rel: string) {
  return fs.readFileSync(path.join(webSrc, rel), "utf8");
}

describe("ecossistema comercial 13/13", () => {
  it("registry: 13 ids, capabilityIds, protocols, experiências e CTAs únicos", () => {
    assert.equal(AI_COMMERCE_PRODUCTS.length, 13);
    assert.equal(listCapabilityRuntimes().length, 13);
    assert.equal(listSpecialistProtocols().length, 13);
    assert.equal(listSpecialistExperiences().length, 13);
    const ids = AI_COMMERCE_PRODUCTS.map((p) => p.sku);
    const caps = AI_COMMERCE_PRODUCTS.map((p) => p.capabilityId);
    const slugs = AI_COMMERCE_PRODUCTS.map((p) => p.slug);
    const protocols = listSpecialistProtocols().map((p) => p.capabilityId);
    const intros = listSpecialistProtocols().map((p) => p.intro);
    const heroes = listSpecialistExperiences().map((p) => p.heroTitle);
    const ctas = AI_COMMERCE_PRODUCTS.map((p) => p.ctaLabel);
    assert.equal(new Set(ids).size, 13);
    assert.equal(new Set(caps).size, 13);
    assert.equal(new Set(slugs).size, 13);
    assert.equal(new Set(protocols).size, 13);
    assert.equal(new Set(intros).size, 13);
    assert.equal(new Set(heroes).size, 13);
    assert.equal(new Set(ctas).size, 13);
    for (const p of AI_COMMERCE_PRODUCTS) {
      const row = specialistRegistryRow(p.sku);
      assert.ok(row, p.sku);
      assert.equal(row!.capabilityId, p.capabilityId);
      assert.ok(row!.protocol);
      assert.ok(row!.acceptedInputs.length);
      assert.ok(row!.resultRenderer);
    }
  });

  it("cada módulo tem shell, chat inicializável e superfície própria", () => {
    const workspace = readSrc("components/features/ai-commerce/workspace.tsx");
    const shell = readSrc("components/features/ai-commerce/specialist-product-shell.tsx");
    const start = readSrc("components/features/ai-commerce/specialist-start-surface.tsx");
    assert.match(workspace, /SpecialistProductShell/);
    assert.match(workspace, /SmartInputWizard/);
    assert.match(workspace, /SpecialistStartSurface/);
    assert.match(workspace, /\/api\/ai-commerce\/executions/);
    assert.match(shell, /SpecialistProductShell/);
    for (const kind of [
      "triage",
      "report",
      "exams",
      "vision",
      "nutri",
      "peso",
      "vaccine",
      "checkup",
      "profile",
    ]) {
      assert.match(start, new RegExp(`kind === "${kind}"`));
    }
  });

  it("home é AI-first e o composer chama o stream GPT existente", () => {
    const home = readSrc("components/features/client/pages/client-dashboard-home.tsx");
    const composer = readSrc("components/features/client/home-ai-composer.tsx");
    assert.ok(home.indexOf("HomeAiComposer") < home.indexOf("Resumo"));
    assert.match(composer, /\/api\/ai\/chat\/stream/);
    assert.match(composer, /Pergunte qualquer coisa sobre seu pet/);
    assert.match(composer, /\/marketplace\/emergencia/);
  });

  it("loja /eccopet agrupa os 13 sem misturar Marketplace Saúde", () => {
    const landing = readSrc("components/features/ai-commerce/landing.tsx");
    assert.match(landing, /13 especialistas de IA/);
    assert.match(landing, /Mais usados/);
    assert.match(landing, /Nutrição e bem-estar/);
    assert.doesNotMatch(landing, /Bubis/);
    assert.doesNotMatch(landing, /Plano de Saúde Pet/);
    assert.match(landing, /p\.ctaLabel/);
    assert.match(landing, /href=\{p\.href\}/);
  });
});

describe("Marketplace Saúde e EccoPet Saúde", () => {
  it("rail de saúde fica no Marketplace, não na loja de IA", () => {
    const catalog = readSrc("components/features/marketplace/marketplace-catalog.tsx");
    const rail = readSrc("components/features/marketplace/marketplace-saude-rail.tsx");
    assert.match(catalog, /MarketplaceSaudeRail/);
    assert.match(rail, /SAÚDE ECCOPET/);
    assert.match(rail, /Plano de Saúde Pet|PLANO DE SAÚDE PET/);
    assert.match(rail, /EMERGÊNCIA VETERINÁRIA/);
    assert.match(rail, /\/marketplace\/saude/);
    assert.match(rail, /\/marketplace\/emergencia/);
    assert.match(rail, /Preciso de ajuda agora/);
    assert.doesNotMatch(rail, /AI_ECCOVET/);
  });

  it("planos cotam SKUs PRT oficiais e não fingem cobertura própria", () => {
    const quotes = listEccoPetSaudeQuotes();
    assert.equal(quotes.length, 3);
    for (const row of quotes) {
      assert.equal(row.seller, "ECCOPET");
      assert.equal(row.billingEnabled, false);
      assert.equal(row.splitReady, false);
      assert.ok(row.quote.customerAmountCents > 0);
      assert.equal(row.commercialAvailability, "PARTNER_REQUIRED");
      assert.equal(row.quote.purchasable, false);
      assert.ok((row.quote.blockedReasons ?? []).some((r) => r.includes("PARTNER_REQUIRED")));
    }
    const activate = readSrc("app/api/eccopet-saude/activate/route.ts");
    assert.doesNotMatch(activate, /splitReady:\s*true/);
  });
});

describe("Bubis e veterinário humano", () => {
  it("emergência abre Bubis com protocolo de triagem real", () => {
    const page = readSrc("app/(app)/marketplace/emergencia/page.tsx");
    const chat = readSrc("components/bubis/bubis-chat.tsx");
    assert.match(page, /BubisChat/);
    assert.match(chat, /AI_ECCOVET_TRIAGE/);
    assert.match(chat, /\/api\/ai-commerce\/executions/);
    assert.match(chat, /Assistente veterinária virtual/);
    assert.match(chat, /não sou médica-veterinária humana/);
    assert.match(chat, /emergency24h=true/);
    assert.match(chat, /shouldInterruptInterview/);
    assert.ok(fs.existsSync(path.join(webSrc, "../public/avatars/bubis.svg")));
  });

  it("não inventa veterinário disponível nem confirma consulta", () => {
    assert.equal(mapEmergencyServices(null).length, 0);
    assert.equal(mapEmergencyServices([]).length, 0);
    assert.equal(mapEmergencyServices({ services: [] }).length, 0);
    const mapped = mapEmergencyServices([
      {
        id: "svc_1",
        name: "Plantão 24h",
        price: 350,
        city: "São Paulo",
        state: "SP",
        modality: "IN_PERSON",
        isVerified: true,
        openToday: true,
        provider: {
          name: "Clínica Real",
          partnerProfile: { businessName: "Vet Real", city: "São Paulo", state: "SP" },
          veterinarianProfile: { crmv: "12345", specialties: ["Clínica geral"] },
        },
      },
    ]);
    assert.equal(mapped.length, 1);
    assert.equal(mapped[0]!.crmv, "12345");
    assert.equal(mapped[0]!.href, "/marketplace/servico/svc_1");
    const chat = readSrc("components/bubis/bubis-chat.tsx");
    assert.doesNotMatch(chat, /Veterinário a caminho/);
    assert.doesNotMatch(chat, /Consulta confirmada/);
    assert.match(chat, /NO_VET_AVAILABLE_COPY/);
    assert.match(NO_VET_AVAILABLE_COPY, /Não encontramos um veterinário disponível/);
  });

  it("triagem aponta para emergência Bubis", () => {
    const nba = computeNextBestAction({ sku: "AI_ECCOVET_TRIAGE" });
    assert.equal(nba?.href, "/marketplace/emergencia");
  });
});
