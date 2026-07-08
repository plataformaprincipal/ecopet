import { apiSuccess } from "@/lib/api-response";
import { requireClient } from "@/lib/auth/require-auth";
import { isAIProviderConfigured, getAiStatus } from "@/lib/ai/provider";

export async function GET() {
  const { error } = await requireClient();
  if (error) return error;

  const configured = isAIProviderConfigured();
  return apiSuccess({
    configured,
    status: getAiStatus(),
    message: configured ? null : "IA ainda não configurada.",
  });
}
