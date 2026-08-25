import "server-only";
import { prisma } from "@/lib/prisma";
import { getOwnedExecution } from "./execution-service";
import { getProductDefBySku } from "./catalog";
import { buildStructuredPdf } from "./pdf";
import { AI_AUDIT, writeAiCommerceAudit } from "./audit";
import { AiCommerceError } from "./errors";

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (value == null) return [];
  return [String(value)];
}

function sectionsFromOutput(capabilityId: string, output: Record<string, unknown>) {
  const impression = output.diagnosticImpression as Record<string, unknown> | undefined;
  const evidence = Array.isArray(output.evidence) ? output.evidence : [];
  const common = [
    { heading: "Resumo", body: String(output.summary ?? output.clinicalOverview ?? "") },
    ...(impression && impression.status !== "NOT_APPLICABLE"
      ? [
          {
            heading: "Impressao Diagnostica Assistida por IA",
            body: [
              `Hipotese principal: ${String(impression.primaryHypothesis ?? "—")}`,
              `Confianca: ${String(impression.confidence ?? "")}${impression.confidenceScore != null ? ` (${impression.confidenceScore} heuristicos)` : ""}`,
              `Racional: ${String(impression.rationale ?? "")}`,
            ],
          },
        ]
      : []),
    ...(evidence.length
      ? [
          {
            heading: "Evidencias",
            body: evidence.map((row) => {
              const e = row as Record<string, unknown>;
              return `${e.statement} [${e.source} / ${e.strength}]`;
            }),
          },
        ]
      : []),
  ];
  if (capabilityId.includes("vision") || capabilityId === "eccovet_vision") {
    return [
      { heading: "Qualidade da imagem", body: String(output.imageQuality ?? "") },
      { heading: "Regiao visivel", body: String(output.visibleRegion ?? "") },
      { heading: "Observacoes visiveis", body: asList(output.visibleObservations) },
      { heading: "Alteracoes aparentes", body: asList(output.apparentChanges) },
      { heading: "Sinais de atencao", body: asList(output.attentionSigns) },
      { heading: "Prioridade", body: String(output.urgencyLevel ?? "") },
      { heading: "Proximos passos", body: asList(output.recommendedNextSteps ?? output.nextSteps) },
      ...common,
    ];
  }
  if (capabilityId.includes("exams") || capabilityId === "eccolab") {
    const markers = Array.isArray(output.markers) ? output.markers : [];
    const table = markers.map((m) => {
      const row = m as Record<string, unknown>;
      return `${row.name}: ${row.value} ${row.unit ?? ""} | ref ${row.reference ?? "indisponivel"} | ${row.status}`;
    });
    return [
      { heading: "Exame", body: String(output.examName ?? "") },
      { heading: "Laboratorio", body: String(output.laboratory ?? "Nao informado") },
      { heading: "Marcadores", body: table },
      { heading: "Resumo", body: String(output.summary ?? "") },
      { heading: "Principais alteracoes", body: asList(output.mainChanges) },
      { heading: "Pontos para o veterinario", body: asList(output.vetTalkingPoints) },
    ];
  }
  if (capabilityId.includes("checkup") || capabilityId === "eccocheckup") {
    return [
      { heading: "Check-up", body: String(output.overview ?? "") },
      { heading: "Status por sistema", body: asList(output.checklist) },
      { heading: "Documentado", body: asList(output.documented) },
      { heading: "Lacunas", body: asList(output.gaps) },
      { heading: "Top 3 prioridades", body: asList(output.priorities) },
      { heading: "Acoes recomendadas", body: asList(output.nextSteps) },
    ];
  }
  if (capabilityId.includes("triage")) {
    return [
      { heading: "Classificacao", body: String(output.triageClass ?? output.urgencyLevel ?? "") },
      { heading: "Queixa", body: String(output.complaint ?? "") },
      { heading: "Por que / sinal", body: asList(output.attentionSigns) },
      { heading: "O que fazer", body: asList(output.nowDo) },
      { heading: "O que nao fazer", body: asList(output.avoid) },
      { heading: "Levar / observar", body: asList(output.takeWithYou) },
      ...common,
    ];
  }
  if (capabilityId.includes("nutri")) {
    const energy = (output.energyMath as Record<string, unknown> | undefined) ?? {};
    return [
      { heading: "Avaliacao nutricional", body: String(output.overview ?? output.summary ?? "") },
      {
        heading: "Calculo energetico (sistema)",
        body: `RER ${energy.rerKcal ?? "—"} kcal | fator ${energy.merFactor ?? "—"} | MER ${energy.merKcal ?? "—"} kcal`,
      },
      { heading: "Rotina", body: asList(output.suggestedOrganization) },
      { heading: "Transicao", body: asList(output.transitionPlan) },
      { heading: "Monitoramento", body: asList(output.followUpPoints) },
    ];
  }
  if (capabilityId.includes("peso")) {
    const math = (output.weightMath as Record<string, unknown> | undefined) ?? {};
    return [
      { heading: "Peso atual", body: String(math.currentKg ?? "") },
      { heading: "Variacao", body: `${math.deltaKg ?? "—"} kg (${math.deltaPct ?? "—"}%)` },
      { heading: "Tendencia", body: String(math.trend ?? output.trendNarrative ?? "") },
      { heading: "Monitoramento", body: asList(output.monitoringPlan) },
    ];
  }
  if (capabilityId.includes("behavior")) {
    return [
      { heading: "Padrao ABC", body: String(output.abcNotes ?? "") },
      { heading: "Gatilhos", body: asList(output.triggers) },
      { heading: "Plano de manejo", body: asList(output.managementPlan) },
      { heading: "Enriquecimento", body: asList(output.enrichmentPlan) },
      ...common,
    ];
  }
  if (capabilityId.includes("vacina")) {
    return [
      { heading: "Carteira identificada", body: asList(output.observations) },
      { heading: "Proximas acoes", body: asList(output.nextActions) },
      { heading: "Campos incompletos", body: asList(output.incompleteFields) },
      ...common,
    ];
  }
  if (capabilityId.includes("eccomed") || capabilityId.includes("med")) {
    return [
      { heading: "Medicamentos documentados", body: asList(output.observations) },
      { heading: "Alertas de informacao incompleta", body: asList(output.incompleteAlerts) },
      { heading: "Administracao", body: asList(output.administrationPlan) },
      ...common,
    ];
  }
  if (capabilityId.includes("dental")) {
    return [
      { heading: "Mapa oral visual", body: String(output.oralSummary ?? "") },
      { heading: "Observacoes visiveis", body: asList(output.visibleObservations) },
      { heading: "Cuidados domiciliares", body: asList(output.preventiveCare) },
      { heading: "Quando avaliar presencialmente", body: asList(output.professionalItems) },
      ...common,
    ];
  }
  if (capabilityId.includes("report") || capabilityId.includes("profile")) {
    return [
      { heading: "Identificacao / resumo", body: String(output.healthBrief ?? output.summary ?? "") },
      { heading: "Linha do tempo", body: asList(output.timeline ?? output.trends) },
      { heading: "Dado informado pelo tutor", body: asList(output.reportedInformation) },
      { heading: "Dado documental", body: asList(output.documentedFindings ?? output.documented) },
      { heading: "Analise IA", body: asList(output.sourcesUsed) },
      { heading: "Questoes a esclarecer", body: asList(output.pendingItems ?? output.gaps) },
      ...common,
    ];
  }
  return [
    ...common,
    { heading: "Resumo do caso", body: String(output.clinicalOverview ?? output.summary ?? "") },
    { heading: "Queixa", body: String(output.complaint ?? "") },
    { heading: "Historico relevante", body: String(output.relevantHistory ?? "") },
    { heading: "Achados", body: asList(output.observations) },
    { heading: "Sinais de atencao", body: asList(output.attentionSigns) },
    { heading: "Prioridade", body: String(output.urgencyLevel ?? "") },
    { heading: "Diferenciais", body: asList(output.possibleConsiderations) },
    { heading: "O que fazer agora", body: asList(output.recommendedNextSteps) },
    { heading: "O que monitorar", body: asList(output.watchFor) },
    { heading: "Perguntas para a consulta", body: asList(output.vetQuestions) },
    { heading: "Fontes e limitacoes", body: asList(output.limitations) },
  ];
}

export async function generateAiReport(params: { userId: string; executionId: string }) {
  const execution = await getOwnedExecution(params.userId, params.executionId);
  if (execution.status !== "COMPLETED" || !execution.structuredOutput) {
    throw new AiCommerceError("REPORT_NOT_READY", "O resultado ainda não está disponível.", 409);
  }
  const existing = execution.reports[0];
  if (existing) return existing;

  const def = getProductDefBySku(execution.entitlement.sku);
  const [user, pet] = await Promise.all([
    prisma.user.findUnique({ where: { id: params.userId }, select: { name: true } }),
    prisma.pet.findUnique({ where: { id: execution.petId }, select: { name: true } }),
  ]);
  const output = execution.structuredOutput as Record<string, unknown>;
  const pdf = buildStructuredPdf({
    title: def?.reportTitle ?? "Relatorio EccoPet AI",
    productName: def?.name ?? execution.entitlement.sku,
    petName: pet?.name ?? "Pet",
    ownerName: user?.name ?? "Tutor",
    executionId: execution.id,
    createdAt: execution.completedAt ?? new Date(),
    sections: sectionsFromOutput(execution.capabilityId, output),
    limitations: asList(output.limitations),
  });

  const report = await prisma.aIReport.create({
    data: {
      executionId: execution.id,
      userId: params.userId,
      petId: execution.petId,
      type: def?.reportTitle ?? "Relatorio EccoPet AI",
      version: "v1",
      structuredData: execution.structuredOutput,
      pdfStorageKey: `reports/${execution.id}.pdf`,
    },
  });
  await writeAiCommerceAudit({
    userId: params.userId,
    action: AI_AUDIT.REPORT_GENERATED,
    sku: execution.entitlement.sku,
    executionId: execution.id,
    metadata: { reportId: report.id },
  });
  return { ...report, pdfBytes: pdf };
}

export async function getReportPdf(params: { userId: string; executionId: string }) {
  const generated = await generateAiReport(params);
  if ("pdfBytes" in generated && generated.pdfBytes) return generated.pdfBytes as Uint8Array;
  const execution = await getOwnedExecution(params.userId, params.executionId);
  const def = getProductDefBySku(execution.entitlement.sku);
  const [user, pet] = await Promise.all([
    prisma.user.findUnique({ where: { id: params.userId }, select: { name: true } }),
    prisma.pet.findUnique({ where: { id: execution.petId }, select: { name: true } }),
  ]);
  const output = (execution.structuredOutput ?? {}) as Record<string, unknown>;
  return buildStructuredPdf({
    title: def?.reportTitle ?? "Relatorio EccoPet AI",
    productName: def?.name ?? execution.entitlement.sku,
    petName: pet?.name ?? "Pet",
    ownerName: user?.name ?? "Tutor",
    executionId: execution.id,
    createdAt: execution.completedAt ?? new Date(),
    sections: sectionsFromOutput(execution.capabilityId, output),
    limitations: asList(output.limitations),
  });
}
