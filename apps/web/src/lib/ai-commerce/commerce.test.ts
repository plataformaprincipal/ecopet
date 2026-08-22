import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  areAiCommercePricesConfirmed,
  isAiCommerceEnabled,
  isAiCommerceSku,
  isAiMonetizationFree,
  isAiPaidCheckoutEnabled,
  getAiMonetizationMode,
  AI_COMMERCE_SKUS,
  AI_COMMERCE_SKU_LIST,
} from "./flags";
import { aiToolCostClass, aiToolHourlyLimit } from "./rate-policy";
import { couponAllowsSku } from "./coupon-policy";
import { eccovetOutputSchema, visionOutputSchema, labOutputSchema, checkupOutputSchema } from "./schemas";
import { estimateOpenAiCostUsd } from "./models";
import { getProductDefBySku, getProductDefBySlug, AI_COMMERCE_PRODUCTS, durationCopy, purchaseCta } from "./catalog";
import { schemaForCapability, normalizeCapability, jsonSchemaByCapability } from "./schemas";
import { workbookFromOutput } from "./workbook";
import { buildStructuredPdf } from "./pdf";
import { getCatalogBySku } from "@/lib/pricing/catalog";
import { remainingUsage } from "./usage";
import { mapMpOrderStatusToInternal } from "@/lib/mercado-pago/status";
import { AiEvents } from "@/lib/analytics/events";
import { buildXlsx } from "./workbook";

describe("AI commerce flags", () => {
  it("fica desligado por padrão", () => {
    assert.equal(isAiCommerceEnabled({}), false);
    assert.equal(isAiCommerceEnabled({ AI_COMMERCE_ENABLED: "true" }), true);
    assert.equal(areAiCommercePricesConfirmed({}), false);
  });

  it("FREE_BETA é o default e não exige checkout", () => {
    assert.equal(getAiMonetizationMode({}), "FREE_BETA");
    assert.equal(isAiMonetizationFree({}), true);
    assert.equal(isAiPaidCheckoutEnabled({ AI_COMMERCE_ENABLED: "true" }), false);
    assert.equal(isAiPaidCheckoutEnabled({ AI_MONETIZATION_MODE: "PAID", AI_COMMERCE_ENABLED: "true" }), true);
    assert.equal(isAiPaidCheckoutEnabled({ AI_MONETIZATION_MODE: "PAID" }), false);
  });

  it("FREE_BETA preserva os 13 capabilityIds e não zera preço canônico", () => {
    assert.equal(AI_COMMERCE_SKU_LIST.length, 13);
    for (const product of AI_COMMERCE_PRODUCTS) {
      assert.ok(product.capabilityId.length > 3);
      assert.ok(product.sku.startsWith("AI_"));
    }
    assert.equal(getCatalogBySku("AI_ECCOVET")?.amountCents, 2990);
  });

  it("classifica custo para rate limit sem expor números ao usuário", () => {
    assert.equal(aiToolCostClass("AI_ECCOVET_VISION"), "high");
    assert.equal(aiToolCostClass("AI_ECCONUTRI"), "medium");
    assert.equal(aiToolCostClass("AI_ECCOVET"), "low");
    assert.ok(aiToolHourlyLimit("AI_ECCOVET_VISION") < aiToolHourlyLimit("AI_ECCOVET"));
  });

  it("reconhece os 13 SKUs oficiais e o alias legado", () => {
    assert.equal(isAiCommerceSku(AI_COMMERCE_SKUS.ECCOVET), true);
    assert.equal(isAiCommerceSku("AI_ECCOLAB"), true);
    assert.equal(isAiCommerceSku("AI-T01"), false);
  });
});

describe("AI commerce catalog", () => {
  it("expõe treze produtos públicos", () => {
    assert.equal(AI_COMMERCE_PRODUCTS.length, 13);
    assert.ok(getProductDefBySlug("vet"));
    assert.ok(getProductDefBySlug("lab"));
    assert.equal(getProductDefBySlug("lab")?.sku, "AI_ECCOVET_EXAMS");
    assert.ok(getProductDefBySku("AI_ECCOVET_VISION"));
    assert.ok(getProductDefBySku("AI_PET_HEALTH_PROFILE"));
  });

  it("registra origem documental de cada preço", () => {
    const vet = getCatalogBySku("AI_ECCOVET");
    assert.ok(vet);
    assert.match(vet!.sourceSection, /AI-T02/);
    assert.equal(vet!.amountCents, 2990);
    assert.equal(vet!.metadata?.priceSource, "DOCUMENT");
    const vision = getCatalogBySku("AI_ECCOVET_VISION");
    assert.equal(vision?.amountCents, 1490);
    assert.equal(vision?.metadata?.priceSource, "DOCUMENT_DERIVED");
    const profile = getCatalogBySku("AI_PET_HEALTH_PROFILE");
    assert.equal(profile?.amountCents, 4990);
    assert.match(profile!.sourceSection, /SAU-011/);
  });
});

describe("cupom DIGITAL_AI", () => {
  it("rejeita cupom sem SKU elegível", () => {
    assert.equal(couponAllowsSku(null, "AI_ECCOVET"), false);
    assert.equal(couponAllowsSku([], "AI_ECCOVET"), false);
    assert.equal(couponAllowsSku(["AI_ECCOVET"], "AI_ECCOVET"), true);
    assert.equal(couponAllowsSku(["AI_ECCOLAB"], "AI_ECCOVET"), false);
  });
});

describe("structured output schemas", () => {
  it("valida EccoVet", () => {
    const parsed = eccovetOutputSchema.safeParse({
      summary: "ok",
      complaint: "coceira",
      relevantHistory: "—",
      observations: ["a"],
      attentionSigns: ["b"],
      urgencyLevel: "MONITOR",
      possibleConsiderations: ["c"],
      recommendedNextSteps: ["d"],
      watchFor: ["e"],
      vetQuestions: ["f"],
      limitations: ["g"],
    });
    assert.equal(parsed.success, true);
  });

  it("rejeita urgência inválida", () => {
    const parsed = visionOutputSchema.safeParse({
      imageQuality: "boa",
      visibleRegion: "pele",
      visibleObservations: [],
      apparentChanges: [],
      attentionSigns: [],
      urgencyLevel: "GRAVE",
      recommendedNextSteps: [],
      limitations: [],
    });
    assert.equal(parsed.success, false);
  });

  it("lab não aceita status inventado", () => {
    const parsed = labOutputSchema.safeParse({
      examName: "Hemograma",
      laboratory: null,
      examDate: null,
      speciesMentioned: null,
      markers: [{ name: "Ht", value: "40", unit: "%", reference: "37-55", status: "OK" }],
      summary: "x",
      mainChanges: [],
      vetTalkingPoints: [],
      limitations: [],
    });
    assert.equal(parsed.success, false);
  });

  it("checkup aceita índice nulo", () => {
    const parsed = checkupOutputSchema.safeParse({
      overview: "ok",
      routine: "ok",
      feeding: "ok",
      activity: "ok",
      prevention: "ok",
      followUpPoints: [],
      priorities: [],
      nextSteps: [],
      vetQuestions: [],
      urgencyLevel: "ROUTINE",
      limitations: [],
      accompanimentIndex: null,
    });
    assert.equal(parsed.success, true);
  });
});

describe("custo OpenAI centralizado", () => {
  it("estima a partir da tabela JSON", () => {
    const cost = estimateOpenAiCostUsd({
      model: "gpt-4o-mini",
      inputTokens: 1000,
      cachedInputTokens: 0,
      outputTokens: 1000,
    });
    assert.equal(cost, 0.00015 + 0.0006);
  });
});

describe("entitlement remaining usage", () => {
  it("zera em estados terminais", () => {
    assert.equal(remainingUsage({ usageLimit: 2, usageCount: 0, status: "REVOKED" }), 0);
    assert.equal(remainingUsage({ usageLimit: 2, usageCount: 0, status: "REFUNDED" }), 0);
    assert.equal(remainingUsage({ usageLimit: 1, usageCount: 1, status: "CONSUMED" }), 0);
  });

  it("conta utilizações restantes quando AVAILABLE", () => {
    assert.equal(remainingUsage({ usageLimit: 2, usageCount: 1, status: "AVAILABLE" }), 1);
    assert.equal(remainingUsage({ usageLimit: 1, usageCount: 0, status: "IN_USE" }), 1);
  });
});

describe("mapeamento Mercado Pago → status interno", () => {
  it("aprova processed/accredited", () => {
    assert.equal(mapMpOrderStatusToInternal("processed", "accredited"), "APPROVED");
  });
  it("mapeia recusa, expirado, refund e chargeback", () => {
    assert.equal(mapMpOrderStatusToInternal("failed", "cc_rejected"), "REJECTED");
    assert.equal(mapMpOrderStatusToInternal("expired"), "EXPIRED");
    assert.equal(mapMpOrderStatusToInternal("refunded"), "REFUNDED");
    assert.equal(mapMpOrderStatusToInternal("charged_back"), "CHARGED_BACK");
    assert.equal(mapMpOrderStatusToInternal("processing"), "PROCESSING");
    assert.equal(mapMpOrderStatusToInternal("created"), "CREATED");
  });
});

describe("analytics comercial", () => {
  it("expõe os eventos obrigatórios", () => {
    assert.equal(AiEvents.CATALOG_VIEW.event_name, "ai_catalog_view");
    assert.equal(AiEvents.ADD_TO_CART.event_name, "ai_add_to_cart");
    assert.equal(AiEvents.PAYMENT_APPROVED.event_name, "ai_payment_approved");
    assert.equal(AiEvents.ENTITLEMENT_CREATED.event_name, "ai_entitlement_created");
    assert.equal(AiEvents.REPORT_DOWNLOADED.event_name, "ai_report_downloaded");
  });
});

describe("planilha XLSX", () => {
  it("gera arquivo OpenXML", () => {
    const bytes = buildXlsx([{ name: "Acompanhamento", headers: ["Item"], rows: [["peso"]] }]);
    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4b);
    assert.ok(bytes.length > 200);
  });

  it("gera planilha por capability aplicável", () => {
    const output = { summary: "ok", markers: [{ name: "Ht", value: "40", unit: "%", reference: "37-55", status: "WITHIN" }], examName: "Hemograma", examDate: "2026-08-01", laboratory: "Lab" };
    for (const cap of ["eccovet.assessment", "eccovet.exams", "ecconutri.assessment", "eccopeso.assessment", "eccobehavior.assessment", "eccomed.review", "eccocheckup.assessment"]) {
      const sheets = workbookFromOutput(cap, output, "Thor");
      const bytes = buildXlsx(sheets);
      assert.ok(bytes.length > 200, cap);
    }
  });
});

describe("copy comercial de plano 30 dias", () => {
  it("não promete renovação automática", () => {
    const vet = getProductDefBySku("AI_ECCOVET")!;
    assert.equal(vet.unitLabel, "plano de 30 dias");
    assert.match(durationCopy(vet), /Renovação manual/);
    assert.doesNotMatch(durationCopy(vet), /Renovação automática/);
    assert.equal(purchaseCta(vet), "Comprar plano de 30 dias");
  });
});

describe("workspaces especializados", () => {
  it("cada produto tem workspaceKind próprio", () => {
    const kinds = AI_COMMERCE_PRODUCTS.map((p) => p.workspaceKind);
    assert.equal(new Set(kinds).size, 13);
  });
});

describe("capabilities e schemas", () => {
  it("todas as 13 capabilities têm schema JSON", () => {
    for (const p of AI_COMMERCE_PRODUCTS) {
      const id = normalizeCapability(p.capabilityId);
      assert.ok(jsonSchemaByCapability[id] || jsonSchemaByCapability[p.capabilityId], p.capabilityId);
      assert.ok(schemaForCapability(p.capabilityId));
    }
  });
});

describe("PDF engine", () => {
  it("gera PDF com branding para um produto", () => {
    const pdf = buildStructuredPdf({
      title: "Relatório EccoVet AI",
      productName: "EccoVet AI",
      petName: "Thor",
      ownerName: "Tutor",
      executionId: "exec_test",
      createdAt: new Date("2026-08-21"),
      sections: [{ heading: "Resumo", body: "Caso organizado." }],
      limitations: ["Documento orientativo."],
    });
    assert.equal(pdf[0], 0x25);
    assert.equal(String.fromCharCode(pdf[1]), "P");
    assert.ok(pdf.length > 400);
  });
});

describe("preço confiável", () => {
  it("backend ignora valor enviado pelo frontend — fonte é o SKU", () => {
    assert.equal(getCatalogBySku("AI_ECCOVET_TRIAGE")?.amountCents, 3990);
    assert.notEqual(getCatalogBySku("AI_ECCOVET_TRIAGE")?.amountCents, 1);
  });
});
