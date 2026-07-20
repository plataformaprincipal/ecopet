/**
 * Motor preditivo explicável — scoring / regras / tendências.
 * Não apresenta previsões como certeza; persiste em AIRecommendation.
 */
import "server-only";

import { ProductCatalogStatus, type UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAiFlagEnabled, assertAiFlag } from "../feature-flags";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";

export type PredictionKind =
  | "client.reorder_probability"
  | "client.routine_delay_risk"
  | "partner.low_stock_risk"
  | "partner.sales_trend"
  | "ngo.campaign_goal_risk"
  | "admin.churn_signal";

export type ExplainablePrediction = {
  kind: PredictionKind;
  objective: string;
  score: number;
  confidence: number;
  label: "low" | "medium" | "high";
  explanation: string;
  limitations: string;
  dataSources: string[];
  periodDays: number;
  generatedAt: string;
  validUntil: string;
  entityType: string;
  entityId: string;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function labelFromScore(score: number): "low" | "medium" | "high" {
  if (score >= 0.66) return "high";
  if (score >= 0.33) return "medium";
  return "low";
}

export async function predictClientReorder(userId: string): Promise<ExplainablePrediction> {
  assertAiFlag("predictions");
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true, total: true, status: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const completed = orders.filter((o) =>
    ["PAID", "DELIVERED", "COMPLETED", "SHIPPED"].includes(String(o.status))
  );
  const count = completed.length;
  const avgGapDays =
    count >= 2
      ? (completed[0].createdAt.getTime() - completed[count - 1].createdAt.getTime()) /
        (Math.max(1, count - 1) * 86400000)
      : 45;

  const daysSinceLast = completed[0]
    ? (Date.now() - completed[0].createdAt.getTime()) / 86400000
    : 90;

  const score = clamp01(
    count === 0 ? 0.15 : 0.25 + Math.min(0.5, count * 0.08) + (daysSinceLast / avgGapDays > 0.8 ? 0.2 : 0)
  );

  return {
    kind: "client.reorder_probability",
    objective: "Estimativa de probabilidade de nova compra nos próximos 30 dias",
    score,
    confidence: count >= 3 ? 0.65 : count >= 1 ? 0.45 : 0.25,
    label: labelFromScore(score),
    explanation:
      count === 0
        ? "Sem pedidos recentes; score conservador baseado em ausência de histórico."
        : `${count} pedido(s) em 90 dias; último há ~${Math.round(daysSinceLast)} dia(s); intervalo médio ~${Math.round(avgGapDays)} dia(s).`,
    limitations:
      "Modelo heurístico (frequência/recência). Não considera sazonalidade externa nem campanhas ativas.",
    dataSources: ["orders(status,createdAt) últimos 90 dias"],
    periodDays: 90,
    generatedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
    entityType: "user",
    entityId: userId,
  };
}

export async function predictPartnerLowStock(partnerUserId: string): Promise<ExplainablePrediction> {
  assertAiFlag("predictions");
  const products = await prisma.product.findMany({
    where: {
      sellerId: partnerUserId,
      deletedAt: null,
      status: ProductCatalogStatus.ACTIVE,
    },
    select: { id: true, name: true, stock: true },
    take: 200,
  });

  const low = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const out = products.filter((p) => p.stock <= 0);
  const score = clamp01(low.length * 0.12 + out.length * 0.2);

  return {
    kind: "partner.low_stock_risk",
    objective: "Risco de ruptura de estoque no catálogo ativo",
    score,
    confidence: products.length >= 5 ? 0.7 : 0.4,
    label: labelFromScore(score),
    explanation: `${products.length} produtos ativos; ${low.length} com estoque ≤5; ${out.length} esgotados.`,
    limitations: "Não inclui previsão de demanda por velocidade de venda; apenas nível atual de estoque.",
    dataSources: ["products(stock,status) do parceiro"],
    periodDays: 0,
    generatedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 2 * 86400000).toISOString(),
    entityType: "partner",
    entityId: partnerUserId,
  };
}

export async function persistPrediction(
  userId: string,
  role: UserRole | string,
  prediction: ExplainablePrediction
) {
  if (!isAiFlagEnabled("predictions")) return null;

  const row = await prisma.aIRecommendation.create({
    data: {
      userId,
      role: String(role),
      recommendationType: prediction.kind,
      entityType: prediction.entityType,
      entityId: prediction.entityId,
      score: prediction.score,
      explanation: [
        prediction.explanation,
        `Confiança: ${(prediction.confidence * 100).toFixed(0)}%`,
        `Limitações: ${prediction.limitations}`,
        `Fontes: ${prediction.dataSources.join("; ")}`,
      ].join("\n"),
      status: "ACTIVE",
      expiresAt: new Date(prediction.validUntil),
    },
  });

  await writeAiAuditLog({
    userId,
    role,
    module: "predictions",
    action: `prediction.${prediction.kind}`,
    entityType: prediction.entityType,
    entityId: prediction.entityId,
    decision: "EXECUTED",
    metadata: {
      score: prediction.score,
      confidence: prediction.confidence,
      recommendationId: row.id,
    },
  });

  return row;
}

export async function runPredictionsForUser(input: {
  userId: string;
  role: UserRole;
}): Promise<ExplainablePrediction[]> {
  if (!isAiFlagEnabled("predictions")) return [];

  const out: ExplainablePrediction[] = [];

  if (input.role === "CLIENT" || input.role === "TUTOR") {
    const p = await predictClientReorder(input.userId);
    await persistPrediction(input.userId, input.role, p);
    out.push(p);
  }

  if (input.role === "PARTNER") {
    const p = await predictPartnerLowStock(input.userId);
    await persistPrediction(input.userId, input.role, p);
    out.push(p);
  }

  return out;
}
