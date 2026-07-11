import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { executeInternalTool } from "@/lib/ai/ai-tools";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";

export type RecommendationItem = {
  entityType: string;
  entityId: string;
  score: number;
  explanation: string;
  sponsored?: boolean;
};

export async function generateProductRecommendations(params: {
  userId: string;
  role: UserRole;
  query?: string;
  locale?: string;
}): Promise<RecommendationItem[]> {
  const products = (await executeInternalTool(
    "searchProducts",
    { userId: params.userId, role: params.role },
    { query: params.query ?? "" }
  )).result as Array<{
    id: string;
    name: string;
    price: number;
    isSponsored: boolean;
    shortDescription: string | null;
    rating: number;
  }> | null;

  if (!products?.length) return [];

  // Base determinística a partir de dados reais
  let items: RecommendationItem[] = products.map((p, idx) => ({
    entityType: "product",
    entityId: p.id,
    score: Math.max(0.1, 1 - idx * 0.08) + (p.rating || 0) / 50,
    explanation: p.shortDescription?.slice(0, 120) || p.name,
    sponsored: p.isSponsored,
  }));

  if (AI_CONFIG.isConfigured && params.query) {
    try {
      const client = getOpenAIClient();
      const catalog = products
        .map((p) => `${p.id}|${p.name}|${p.price}|sponsored=${p.isSponsored}`)
        .join("\n");
      const completion = await client.chat.completions.create({
        model: AI_CONFIG.model,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "Reordene recomendações apenas com IDs fornecidos. Responda JSON array de {entityId, score, explanation}. Não invente IDs. Marque sponsored se aplicável.",
          },
          {
            role: "user",
            content: `Query: ${params.query}\nCatálogo:\n${catalog}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as { items?: RecommendationItem[] } | RecommendationItem[];
      const list = Array.isArray(parsed) ? parsed : parsed.items ?? [];
      const byId = new Map(products.map((p) => [p.id, p]));
      items = list
        .filter((i) => byId.has(i.entityId))
        .map((i) => ({
          entityType: "product",
          entityId: i.entityId,
          score: Number(i.score) || 0.5,
          explanation: String(i.explanation ?? byId.get(i.entityId)?.name ?? ""),
          sponsored: byId.get(i.entityId)?.isSponsored,
        }));
    } catch {
      // mantém ranking determinístico
    }
  }

  for (const item of items.slice(0, 10)) {
    try {
      await prisma.aIRecommendation.create({
        data: {
          userId: params.userId,
          role: String(params.role),
          recommendationType: "product",
          entityType: item.entityType,
          entityId: item.entityId,
          score: item.score,
          explanation: item.explanation,
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch {
      // ignore
    }
  }

  await writeAiAuditLog({
    userId: params.userId,
    role: params.role,
    module: "recommendations",
    action: "recommend",
    decision: "ALLOW",
    metadata: { count: items.length },
  });

  return items.slice(0, 10);
}
