import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { AI_COMMERCE_PRODUCTS, getProductDefBySlug } from "./catalog";
import { listCapabilityRuntimes, getCapabilityRuntime } from "./capability-runtime";
import { isAiMonetizationFree } from "./flags";
import { jsonSchemaByCapability, schemaForCapability, normalizeCapability } from "./schemas";
import { specialistJsonByCapability, specialistSchemaFor } from "./specialist-output";
import { detectRedFlags } from "./red-flags";
import { nextDueFromRule, VACCINATION_RULES_VERSION } from "./vaccination-rules";
import { computeWeightMath } from "./weight-math";
import { computeNextBestAction } from "./next-best-action";
import { postprocessSpecialistOutput } from "./postprocess";
import { AI_COMMERCE_LIMITS, AI_COMMERCE_MODELS } from "./models";
import { AiEvents } from "@/lib/analytics/events";
import { workbookFromOutput, buildXlsx } from "./workbook";
import { buildStructuredPdf } from "./pdf";

const webSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
function readSrc(rel: string) {
  return fs.readFileSync(path.join(webSrc, rel), "utf8");
}

describe("13/13 capability runtime", () => {
  it("define os 13 especialistas oficiais sem produto 14", () => {
    const runtimes = listCapabilityRuntimes();
    assert.equal(runtimes.length, 13);
    assert.equal(AI_COMMERCE_PRODUCTS.length, 13);
    const names = AI_COMMERCE_PRODUCTS.map((p) => p.name);
    for (const expected of [
      "EccoVet AI",
      "EccoVet Triagem",
      "EccoCheckup AI",
      "Pet Health Profile",
      "EccoVet Relatório",
      "EccoVet Exames",
      "EccoVet Vision",
      "EccoDental AI",
      "EccoNutri AI",
      "EccoPeso AI",
      "EccoBehavior AI",
      "EccoVacina AI",
      "EccoMed AI",
    ]) {
      assert.ok(names.includes(expected), expected);
    }
  });

  it("cada card CTA aponta para o workbench /eccopet/{slug}", () => {
    const landing = readSrc("components/features/ai-commerce/landing.tsx");
    assert.match(landing, /ecopetAi\.hub\.useNow/);
    assert.match(landing, /href=\{p\.href\}/);
    for (const product of AI_COMMERCE_PRODUCTS) {
      assert.equal(product.href, `/eccopet/${product.slug}`);
      assert.match(product.workspaceHref("abc"), /\/eccopet\/.+\/session\/abc/);
      const runtime = getCapabilityRuntime(product.sku);
      assert.ok(runtime, product.sku);
      assert.ok(runtime!.steps.length >= 1, product.sku);
      assert.ok(runtime!.headline.length > 8, product.sku);
      assert.ok(runtime!.youProvide.length > 0, product.sku);
      assert.ok(runtime!.youReceive.length > 0, product.sku);
    }
  });

  it("product page abre o workbench e chama executions", () => {
    const product = readSrc("components/features/ai-commerce/product-page.tsx");
    assert.match(product, /AiWorkbench/);
    assert.match(product, /\/api\/ai-commerce\/executions/);
    const workspace = readSrc("components/features/ai-commerce/workspace.tsx");
    assert.match(workspace, /SmartInputWizard/);
    assert.match(workspace, /SpecialistFollowUpChat/);
    assert.match(workspace, /DiagnosticImpressionCard/);
    assert.doesNotMatch(workspace, /Como posso ajudar\?/);
  });
});

describe("FREE_BETA", () => {
  it("permanece gratuito e fora de checkout", () => {
    assert.equal(isAiMonetizationFree({}), true);
    const landing = readSrc("components/features/ai-commerce/landing.tsx");
    assert.ok(!landing.includes("Adicionar ao carrinho"));
  });
});

describe("structured output 13/13", () => {
  it("cada capability tem schema JSON e zod próprios", () => {
    for (const p of AI_COMMERCE_PRODUCTS) {
      const id = normalizeCapability(p.capabilityId);
      assert.ok(jsonSchemaByCapability[id] || jsonSchemaByCapability[p.capabilityId], p.capabilityId);
      assert.ok(specialistJsonByCapability[id], p.capabilityId);
      const parsed = specialistSchemaFor(p.capabilityId);
      assert.ok(parsed);
      assert.ok(schemaForCapability(p.capabilityId));
    }
  });
});

describe("red flags", () => {
  it("força emergência em dificuldade respiratória antes do LLM", () => {
    const hits = detectRedFlags({ complaint: "está com dificuldade para respirar e piora rápida" });
    assert.ok(hits.some((h) => h.key === "breathing"));
    const out = postprocessSpecialistOutput({
      sku: "AI_ECCOVET_TRIAGE",
      capabilityId: "eccovet.triage",
      input: { breathing: true, complaint: "falta de ar" },
      output: { summary: "x", urgency: { level: "ROUTINE", reasons: [] } },
    });
    assert.equal(out.urgencyLevel, "EMERGENCY");
    assert.equal(rec(out).triageClass, "EMERGENCY");
  });
});

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

describe("pet ownership / context rules", () => {
  it("unknown não vira false: próxima dose sem data não é inventada", () => {
    const none = nextDueFromRule({ name: "Antirrábica", lastDate: null, species: "DOG" });
    assert.equal(none.nextDue, null);
    assert.equal(none.source, "INSUFFICIENT_DATA");
    const ok = nextDueFromRule({ name: "Antirrábica", lastDate: "2026-01-01", species: "DOG" });
    assert.equal(ok.source, "SYSTEM_CALCULATED");
    assert.equal(ok.ruleVersion, VACCINATION_RULES_VERSION);
    assert.ok(ok.nextDue);
  });
});

describe("cálculo determinístico de peso", () => {
  it("não depende de LLM para delta e tendência", () => {
    const math = computeWeightMath(
      [
        { kg: 10, date: "2026-07-01" },
        { kg: 9.2, date: "2026-08-20" },
      ],
      9.2
    );
    assert.equal(math.source, "SYSTEM_CALCULATED");
    assert.ok(math.deltaKg != null);
    assert.equal(math.trend, "DOWN");
  });
});

describe("OpenAI config central", () => {
  it("não hardcoda modelo por módulo e preserva OPENAI_MODEL", () => {
    const gateway = readSrc("lib/ai-commerce/openai-gateway.ts");
    assert.match(gateway, /AI_COMMERCE_MODELS/);
    assert.doesNotMatch(gateway, /gpt-5/);
    assert.ok(AI_COMMERCE_MODELS.default);
    assert.ok(AI_COMMERCE_LIMITS.timeoutMs > 0);
    assert.match(gateway, /input_file/);
    assert.match(gateway, /input_image/);
  });
});

describe("next best action e follow-up", () => {
  it("Vision aponta para EccoVet e Dental para Checkup", () => {
    const vision = computeNextBestAction({ sku: "AI_ECCOVET_VISION", output: { summary: "pele" } });
    assert.equal(vision?.sku, "AI_ECCOVET");
    const dental = computeNextBestAction({ sku: "AI_ECCODENTAL" });
    assert.equal(dental?.sku, "AI_ECCOCHECKUP");
  });

  it("chat secundário existe e não é a primeira tela", () => {
    const workspace = readSrc("components/features/ai-commerce/workspace.tsx");
    assert.match(workspace, /SpecialistFollowUpChat/);
    assert.match(workspace, /SmartInputWizard/);
    const follow = readSrc("app/api/ai-commerce/executions/[id]/follow-up/route.ts");
    assert.match(follow, /sendFollowUp/);
  });
});

describe("artefatos", () => {
  it("PDF e XLSX continuam estruturados", () => {
    const pdf = buildStructuredPdf({
      title: "EccoVet — Análise clínica",
      productName: "EccoVet AI",
      petName: "Thor",
      ownerName: "Tutor",
      executionId: "exec_test",
      createdAt: new Date("2026-08-24"),
      sections: [{ heading: "Resumo", body: "Caso organizado." }],
      limitations: ["Documento orientativo."],
    });
    assert.equal(String.fromCharCode(pdf[0]), "%");
    const sheets = workbookFromOutput("eccovet.exams", {
      examName: "Hemograma",
      examDate: "2026-08-01",
      laboratory: "Lab",
      markers: [{ name: "Ht", value: "40", unit: "%", reference: "37-55", status: "WITHIN" }],
    }, "Thor");
    assert.ok(sheets.some((s) => s.name === "Resultados"));
    assert.ok(buildXlsx(sheets).length > 200);
  });
});

describe("analytics do ecossistema", () => {
  it("registra abertura, análise, artefato, follow-up e health profile", () => {
    assert.equal(AiEvents.MODULE_OPEN.event_name, "ai_module_open");
    assert.equal(AiEvents.ANALYSIS_COMPLETED.event_name, "ai_analysis_completed");
    assert.equal(AiEvents.FOLLOWUP_STARTED.event_name, "ai_followup_started");
    assert.equal(AiEvents.HEALTH_PROFILE_ADDED.event_name, "ai_health_profile_added");
    assert.equal(AiEvents.CROSS_MODULE_ACTION.event_name, "ai_cross_module_action");
  });
});

describe("slugs canônicos", () => {
  it("health-profile e triagem resolvem", () => {
    assert.equal(getProductDefBySlug("health-profile")?.name, "Pet Health Profile");
    assert.equal(getProductDefBySlug("triagem")?.name, "EccoVet Triagem");
  });
});
