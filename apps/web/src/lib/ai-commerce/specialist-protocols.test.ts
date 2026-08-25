import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AI_COMMERCE_PRODUCTS } from "./catalog";
import { systemPromptForCapability } from "./prompts";
import { computeEnergyMath, computeRerKcal, merFactorFor } from "./weight-math";
import { nextDueFromRule } from "./vaccination-rules";
import {
  getSpecialistProtocol,
  inferAffectedSystem,
  isInterviewReady,
  listSpecialistProtocols,
  missingMinimumData,
  nextInterviewQuestion,
  shouldInterruptInterview,
} from "./specialist-protocols";

const marley = {
  identity: { name: "Marley", species: "DOG", breed: "Maltês", age: "4 anos", neutered: true },
  anthropometrics: { weight: 7.2 },
  health: { allergies: [] },
  medications: [{ name: "Nenhuma" }],
};

describe("13 protocolos especializados", () => {
  it("existem 13 protocolos com intro, árvore, resultado e artefato distintos", () => {
    const protocols = listSpecialistProtocols();
    assert.equal(protocols.length, 13);
    const intros = new Set(protocols.map((p) => p.intro));
    const firstQuestions = new Set(protocols.map((p) => p.questionTree[0]?.id));
    const resultHeads = new Set(protocols.map((p) => p.resultSections[0]));
    const analysis = new Set(protocols.map((p) => p.analysisInstructions.slice(0, 80)));
    assert.equal(intros.size, 13);
    assert.ok(firstQuestions.size >= 10);
    assert.ok(resultHeads.size >= 10);
    assert.equal(analysis.size, 13);
    for (const p of protocols) {
      assert.ok(p.minimumData.length >= 1, p.sku);
      assert.ok(p.questionTree.length >= 2, p.sku);
      assert.ok(p.resultSections.length >= 4, p.sku);
      assert.ok(p.artifactConfig.reportTitle.includes("ECCOPET") || p.artifactConfig.reportTitle.includes("ECCO"), p.sku);
      assert.ok(p.specialistTitle.startsWith("Dr. Ecco"), p.sku);
      assert.match(p.analysisInstructions, /N[AÃ]O|nunca|Nunca|não invent/i);
    }
  });

  it("perguntas iniciais diferem entre módulos e usam o nome do pet", () => {
    const prompts = AI_COMMERCE_PRODUCTS.map((product) => {
      const protocol = getSpecialistProtocol(product.sku)!;
      const q = nextInterviewQuestion(protocol, {}, marley);
      return `${product.sku}:${q?.prompt ?? protocol.intro}`;
    });
    assert.ok(prompts.some((p) => p.includes("O que está acontecendo com Marley")));
    assert.ok(prompts.some((p) => p.includes("consciente")));
    assert.ok(prompts.some((p) => p.includes("tipo de relatório")));
    assert.ok(prompts.some((p) => p.includes("Envie o exame de Marley")));
    assert.ok(prompts.some((p) => p.includes("região")));
    assert.ok(prompts.some((p) => p.includes("alimentação de Marley")));
    assert.ok(prompts.some((p) => p.includes("comportamento")));
    assert.equal(new Set(prompts).size, 13);
  });

  it("não pergunta peso já conhecido — confirma", () => {
    const protocol = getSpecialistProtocol("AI_ECCONUTRI")!;
    const afterGoal = nextInterviewQuestion(protocol, { goal: "Manutenção" }, marley);
    assert.ok(afterGoal);
    assert.match(afterGoal!.prompt, /7,2 kg|7.2 kg/);
    assert.equal(afterGoal!.type, "confirm");
    const confirmed = nextInterviewQuestion(protocol, { goal: "Manutenção", "weight__confirm": "Sim", currentFood: "ração X" }, marley);
    assert.ok(confirmed);
    assert.notEqual(confirmed!.id, "weight");
  });

  it("Clínica Geral ramifica vômito e não faz FAST SCREEN de triagem", () => {
    const clinical = getSpecialistProtocol("AI_ECCOVET")!;
    const triage = getSpecialistProtocol("AI_ECCOVET_TRIAGE")!;
    assert.equal(inferAffectedSystem("Marley vomitou desde ontem"), "gastrointestinal");
    const q = nextInterviewQuestion(
      clinical,
      { chiefComplaint: "vomitando desde ontem", affectedSystem: "gastrointestinal", onset: "Ontem", severity: "Moderada", progression: "Piorando", giKind: "Vômito" },
      marley
    );
    assert.ok(q);
    assert.match(q!.id, /vomit|water/);
    const triageFirst = nextInterviewQuestion(triage, {}, marley);
    assert.equal(triageFirst?.id, "conscious");
    assert.notEqual(q!.id, "conscious");
  });

  it("Triagem interrompe em red flag e fica pronta", () => {
    const triage = getSpecialistProtocol("AI_ECCOVET_TRIAGE")!;
    const answers = { conscious: "Sim", breathingOk: "Sim", urineBlock: "Tenta e não produz" };
    assert.equal(shouldInterruptInterview(triage, answers), true);
    assert.equal(isInterviewReady(triage, answers, marley), true);
    const next = nextInterviewQuestion(triage, answers, marley);
    assert.ok(!next || next.id !== "chiefComplaint" || shouldInterruptInterview(triage, answers));
  });

  it("Behavior exige ABC na ordem A → B → C", () => {
    const behavior = getSpecialistProtocol("AI_ECCOBEHAVIOR")!;
    const a = nextInterviewQuestion(behavior, { behaviorType: "Agressividade" }, marley);
    assert.equal(a?.id, "antecedent");
    const b = nextInterviewQuestion(behavior, { behaviorType: "Agressividade", antecedent: "visita à porta" }, marley);
    assert.equal(b?.id, "behaviorExact");
    const c = nextInterviewQuestion(
      behavior,
      { behaviorType: "Agressividade", antecedent: "visita à porta", behaviorExact: "late e avança" },
      marley
    );
    assert.equal(c?.id, "consequence");
    assert.ok(missingMinimumData(behavior, { behaviorType: "Agressividade" }, marley).includes("antecedent"));
  });

  it("Health Profile preserva regra de proveniência no prompt", () => {
    const prompt = systemPromptForCapability("pethealth.profile");
    assert.match(prompt, /USER_REPORTED/);
    assert.match(prompt, /DOCUMENT_EXTRACTED/);
    assert.match(prompt, /SYSTEM_CALCULATED/);
    assert.match(prompt, /AI_ANALYSIS/);
    assert.match(prompt, /NUNCA misture|Nunca misture/);
  });

  it("Med não autoriza inventar dose; Vacina usa regra sem inventar próxima dose", () => {
    const med = systemPromptForCapability("eccomed.review");
    assert.match(med, /N[AÃ]O cria medicamento|Nunca invente dose|NUNCA invente dose/i);
    assert.match(med, /Dê X mg/);
    const none = nextDueFromRule({ name: "V8", lastDate: null, species: "DOG" });
    assert.equal(none.nextDue, null);
    assert.equal(none.source, "INSUFFICIENT_DATA");
  });

  it("Nutri usa matemática determinística RER = 70 × kg^0.75", () => {
    const rer = computeRerKcal(7.2);
    assert.equal(rer, Math.round(70 * Math.pow(7.2, 0.75)));
    const factor = merFactorFor({ goal: "Perder peso", neutered: true, activity: "Moderada" });
    assert.equal(factor, 1.0);
    const energy = computeEnergyMath({ weightKg: 7.2, goal: "Manutenção", neutered: true, activity: "Moderada" });
    assert.equal(energy.source, "SYSTEM_CALCULATED");
    assert.equal(energy.rerKcal, rer);
    assert.equal(energy.merFactor, 1.6);
    assert.equal(energy.merKcal, Math.round(rer * 1.6));
    assert.equal(energy.gramsPerDay, null);
  });

  it("casos A–J produzem dados coletados e seções de resultado específicas", () => {
    const cases: Array<{ sku: string; answers: Record<string, unknown>; expectReady: boolean; section: string }> = [
      { sku: "AI_ECCOVET", answers: { chiefComplaint: "vomitando desde ontem", onset: "Ontem", severity: "Moderada" }, expectReady: true, section: "Impressão clínica assistida" },
      { sku: "AI_ECCOVET_TRIAGE", answers: { conscious: "Sim", breathingOk: "Sim", urineBlock: "Tenta e não produz" }, expectReady: true, section: "Classificação" },
      { sku: "AI_ECCOVET_EXAMS", answers: { labUploaded: "enviado:hemograma.pdf" }, expectReady: true, section: "Tabela de marcadores" },
      { sku: "AI_ECCOVET_VISION", answers: { region: "pele", visionUploaded: "enviado:lesao.jpg" }, expectReady: true, section: "O que consigo ver" },
      { sku: "AI_ECCOPESO", answers: { weight: "8.1", "weight__confirm": "Atualizar" }, expectReady: true, section: "Variação %" },
      { sku: "AI_ECCODENTAL", answers: { halitosis: "Forte" }, expectReady: true, section: "Mapa oral visual" },
      { sku: "AI_ECCOBEHAVIOR", answers: { behaviorType: "Agressividade", antecedent: "visita", behaviorExact: "rosna", consequence: "tutor afasta" }, expectReady: true, section: "Padrão ABC" },
      { sku: "AI_ECCOVACCINE", answers: { cardSource: "Foto" }, expectReady: true, section: "Carteira identificada" },
      { sku: "AI_ECCOMED", answers: { medContext: "Receita / medicamento prescrito" }, expectReady: true, section: "Identificação do medicamento" },
      { sku: "AI_ECCOCHECKUP", answers: { energy: "Normal", appetite: "Normais", stool: "Não", urine: "Sim" }, expectReady: true, section: "Top 3 prioridades" },
    ];
    for (const item of cases) {
      const protocol = getSpecialistProtocol(item.sku)!;
      assert.equal(isInterviewReady(protocol, item.answers, marley), item.expectReady, item.sku);
      assert.ok(protocol.resultSections.includes(item.section), `${item.sku} ${item.section}`);
    }
  });
});
