import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { listPrompts } from "@/lib/ai/prompts/registry";
import { getAiLogStats, listAiLogs } from "@/lib/ai/logger";
import { getAiStatus } from "@/lib/ai/provider";

export async function GET(request: Request) {
  const { error } = await requireAdmin({ path: new URL(request.url).pathname });
  if (error) return error;

  const url = new URL(request.url);
  const agentId = url.searchParams.get("agentId") ?? undefined;
  const prompts = listPrompts(agentId ? { agentId: agentId as never } : undefined).map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    category: p.category,
    version: p.version,
    agentId: p.agentId,
    recommendedModel: p.recommendedModel,
    temperature: p.temperature,
    isActive: p.isActive,
    contentPreview: p.content.slice(0, 200),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  const stats = await getAiLogStats();
  const recentLogs = await listAiLogs({ adminView: true, limit: 20 });

  return apiSuccess({
    prompts,
    stats,
    recentLogs,
    providers: getAiStatus(),
  });
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin({ path: new URL(request.url).pathname });
  if (error) return error;

  // Edição pelo painel ADMIN — implementação completa em etapa futura
  return apiFailure(
    "NOT_IMPLEMENTED",
    "Edição de prompts pelo painel será habilitada em etapa futura. Prompts atuais são versionados em código.",
    501
  );
}
