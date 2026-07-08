import type { PrismaClient } from "@prisma/client";
import { buildClientFinancePanel } from "@/lib/client/finance-panel";
import { buildClientAnalyticsPanel } from "@/lib/client/analytics-panel";
import { buildClientWellnessPanel } from "@/lib/client/wellness-panel";

export type ReportPeriod = "weekly" | "monthly" | "annual";

export type ClientReportSummary = {
  period: ReportPeriod;
  generatedAt: string;
  finance: { spent: number; forecast: number; topCategory: string | null };
  wellness: { index: number; level: string };
  analytics: { vaccinesPending: number; routineRate: number; activities: number };
  petsCount: number;
};

function periodRange(period: ReportPeriod): { start: Date; end: Date; label: string } {
  const end = new Date();
  const start = new Date();
  if (period === "weekly") {
    start.setDate(end.getDate() - 7);
    return { start, end, label: "Semanal" };
  }
  if (period === "annual") {
    start.setFullYear(end.getFullYear() - 1);
    return { start, end, label: "Anual" };
  }
  start.setMonth(end.getMonth() - 1);
  return { start, end, label: "Mensal" };
}

export async function buildClientReportSummary(
  prisma: PrismaClient,
  userId: string,
  period: ReportPeriod
): Promise<ClientReportSummary> {
  const [finance, analytics, wellness, petsCount] = await Promise.all([
    buildClientFinancePanel(prisma, userId),
    buildClientAnalyticsPanel(prisma, userId),
    buildClientWellnessPanel(prisma, userId),
    prisma.pet.count({ where: { ownerId: userId, deletedAt: null } }),
  ]);

  const range = periodRange(period);
  return {
    period,
    generatedAt: new Date().toISOString(),
    finance: {
      spent: finance.spentThisMonth,
      forecast: finance.forecastNextMonth,
      topCategory: finance.spentByCategory[0]?.label ?? null,
    },
    wellness: { index: wellness.index, level: wellness.level },
    analytics: {
      vaccinesPending: analytics.vaccinesPending,
      routineRate: analytics.routineCompletion.rate,
      activities: analytics.petActivities.length,
    },
    petsCount,
  };
}

export function reportToCsv(summary: ClientReportSummary): string {
  const lines = [
    "EcoPet — Relatório do Cliente",
    `Período,${summary.period}`,
    `Gerado em,${new Date(summary.generatedAt).toLocaleString("pt-BR")}`,
    "",
    "Indicador,Valor",
    `Pets cadastrados,${summary.petsCount}`,
    `Gastos (referência),R$ ${summary.finance.spent.toFixed(2)}`,
    `Previsão próximo mês,R$ ${summary.finance.forecast.toFixed(2)}`,
    `Maior categoria,${summary.finance.topCategory ?? "—"}`,
    `Índice de bem-estar,${summary.wellness.index}`,
    `Nível de bem-estar,${summary.wellness.level}`,
    `Vacinas pendentes,${summary.analytics.vaccinesPending}`,
    `Rotina cumprida (%),${summary.analytics.routineRate}`,
    `Atividades recentes,${summary.analytics.activities}`,
  ];
  return lines.join("\n");
}

/** PDF mínimo em texto (sem dependências externas). */
export function reportToPdfBytes(summary: ClientReportSummary): Uint8Array {
  const text = [
    "EcoPet - Relatorio do Cliente",
    `Periodo: ${summary.period}`,
    `Gerado: ${new Date(summary.generatedAt).toLocaleString("pt-BR")}`,
    "",
    `Pets: ${summary.petsCount}`,
    `Gastos: R$ ${summary.finance.spent.toFixed(2)}`,
    `Previsao: R$ ${summary.finance.forecast.toFixed(2)}`,
    `Bem-estar: ${summary.wellness.index} (${summary.wellness.level})`,
    `Vacinas pendentes: ${summary.analytics.vaccinesPending}`,
    `Rotina: ${summary.analytics.routineRate}%`,
  ].join("\n");

  const escaped = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const stream = `BT /F1 12 Tf 50 750 Td (${escaped.replace(/\n/g, ") Tj T* (")}) Tj ET`;
  const pdf = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length ${stream.length} >>stream
${stream}
endstream endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000${(350 + stream.length).toString().padStart(3, "0")} 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
${400 + stream.length}
%%EOF`;
  return new TextEncoder().encode(pdf);
}
