import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { listAiFeatureFlags, isAiFlagEnabled } from "./operational/feature-flags";
import { resolveEcoPetAgent, agentAllowsSensitiveAction } from "./operational/agent-orchestrator";
import { listAutomationRules, listRulesForEvent } from "./operational/automations/registry";
import { parseMarketplaceNaturalLanguage } from "./operational/marketplace/nl-search";
import { parseExploreIntent } from "./operational/explore/intent";

describe("EcoPet IA operacional — feature flags", () => {
  it("lista flags conhecidas", () => {
    const flags = listAiFeatureFlags();
    assert.equal(typeof flags.assistant, "boolean");
    assert.equal(typeof flags.marketplace_ai, "boolean");
    assert.equal(typeof flags.predictions, "boolean");
  });

  it("respeita AI_FLAG_ASSISTANT=false", () => {
    const prev = process.env.AI_FLAG_ASSISTANT;
    process.env.AI_FLAG_ASSISTANT = "false";
    assert.equal(isAiFlagEnabled("assistant"), false);
    if (prev === undefined) delete process.env.AI_FLAG_ASSISTANT;
    else process.env.AI_FLAG_ASSISTANT = prev;
  });
});

describe("EcoPet IA operacional — orquestrador", () => {
  it("roteia cliente no marketplace", () => {
    const plan = resolveEcoPetAgent({
      role: "CLIENT",
      pagePath: "/marketplace",
      message: "quero ração para cachorro",
    });
    assert.equal(plan.agentId, "marketplace");
    assert.equal(plan.persona, "CLIENT");
    assert.ok(plan.disclaimer.length > 10);
  });

  it("roteia parceiro e admin", () => {
    assert.equal(resolveEcoPetAgent({ role: "PARTNER" }).agentId, "partner");
    assert.equal(resolveEcoPetAgent({ role: "ONG" }).agentId, "ngo");
    assert.equal(resolveEcoPetAgent({ role: "ADMIN" }).agentId, "admin");
  });

  it("bloqueia ações sensíveis", () => {
    assert.equal(agentAllowsSensitiveAction("client", "refund"), false);
    assert.equal(agentAllowsSensitiveAction("admin", "suspend_user"), false);
    assert.equal(agentAllowsSensitiveAction("admin", "draft_report"), true);
  });
});

describe("EcoPet IA operacional — automações", () => {
  it("registra regras com eventos", () => {
    const rules = listAutomationRules();
    assert.ok(rules.length >= 4);
    assert.ok(listRulesForEvent("cart.abandoned").length >= 1);
    assert.ok(listRulesForEvent("stock.low").length >= 1);
  });
});

describe("EcoPet IA operacional — marketplace NL", () => {
  it("extrai filtros de preço e espécie", () => {
    const plan = parseMarketplaceNaturalLanguage(
      "Quero uma ração para cachorro adulto até R$ 100"
    );
    assert.equal(plan.intent, "products");
    assert.equal(plan.productFilters.species, "DOG");
    assert.equal(plan.productFilters.category, "FOOD");
    assert.equal(plan.productFilters.maxPrice, 100);
  });

  it("detecta serviços de banho e tosa", () => {
    const plan = parseMarketplaceNaturalLanguage("Preciso de banho e tosa amanhã");
    assert.equal(plan.intent, "services");
    assert.equal(plan.serviceFilters.category, "BATH_GROOMING");
  });
});

describe("EcoPet IA operacional — explore NL", () => {
  it("mapeia intenções para deep links", () => {
    assert.equal(parseExploreIntent("Quero encontrar uma ONG").target, "ngos");
    assert.equal(parseExploreIntent("Quero adotar um cachorro").target, "adoptions");
    assert.equal(parseExploreIntent("Mostre parceiros próximos").target, "partners");
    assert.equal(parseExploreIntent("Mostre produtos para gatos").target, "products");
  });
});
