import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { listModels } from "@/lib/ai/registry";
import { getAiStatus } from "@/lib/ai/provider";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const models = listModels().map((m) => ({
    id: m.id,
    provider: m.provider,
    label: m.label,
    description: m.description,
    version: m.version,
    contextWindow: m.contextWindow,
    streaming: m.streaming,
    vision: m.vision,
    functionCalling: m.functionCalling,
    maxTokens: m.maxTokens,
    enabled: m.enabled,
    status: m.status,
  }));

  return apiSuccess({
    models,
    providers: getAiStatus(),
  });
}
