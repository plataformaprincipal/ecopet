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
  if (capabilityId === "eccovet_vision") {
    return [
      { heading: "Qualidade da imagem", body: String(output.imageQuality ?? "") },
      { heading: "Regiao visivel", body: String(output.visibleRegion ?? "") },
      { heading: "Observacoes visiveis", body: asList(output.visibleObservations) },
      { heading: "Alteracoes aparentes", body: asList(output.apparentChanges) },
      { heading: "Sinais de atencao", body: asList(output.attentionSigns) },
      { heading: "Prioridade", body: String(output.urgencyLevel ?? "") },
      { heading: "Proximos passos", body: asList(output.recommendedNextSteps) },
    ];
  }
  if (capabilityId === "eccolab") {
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
  if (capabilityId === "eccocheckup") {
    return [
      { heading: "Visao geral", body: String(output.overview ?? "") },
      { heading: "Rotina", body: String(output.routine ?? "") },
      { heading: "Alimentacao", body: String(output.feeding ?? "") },
      { heading: "Atividade", body: String(output.activity ?? "") },
      { heading: "Prevencao", body: String(output.prevention ?? "") },
      { heading: "Pontos para acompanhar", body: asList(output.followUpPoints) },
      { heading: "Prioridades", body: asList(output.priorities) },
      { heading: "Proximos passos", body: asList(output.nextSteps) },
    ];
  }
  return [
    { heading: "Resumo", body: String(output.summary ?? "") },
    { heading: "Queixa", body: String(output.complaint ?? "") },
    { heading: "Historico relevante", body: String(output.relevantHistory ?? "") },
    { heading: "Observacoes", body: asList(output.observations) },
    { heading: "Sinais de atencao", body: asList(output.attentionSigns) },
    { heading: "Prioridade", body: String(output.urgencyLevel ?? "") },
    { heading: "Possibilidades a considerar", body: asList(output.possibleConsiderations) },
    { heading: "O que fazer agora", body: asList(output.recommendedNextSteps) },
    { heading: "O que observar", body: asList(output.watchFor) },
    { heading: "Perguntas para seu veterinario", body: asList(output.vetQuestions) },
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
