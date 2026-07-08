import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { listDbProviders, listCodeProviders } from "@/lib/ai/db/bootstrap";
import { getAIProvider, getAiStatus } from "@/lib/ai/provider";
import { AI_PROVIDER_NOT_CONFIGURED_MESSAGE } from "@/lib/ai/errors";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const providers = await listDbProviders();
  const codeProviders = listCodeProviders();
  const health = await getAIProvider().healthCheck();

  return apiSuccess({
    providers: providers.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      status: p.status,
      isConfigured: p.isConfigured,
      modelCount: p._count.models,
    })),
    registry: codeProviders,
    health,
    status: getAiStatus(),
    message: health.ok ? null : AI_PROVIDER_NOT_CONFIGURED_MESSAGE,
  });
}
