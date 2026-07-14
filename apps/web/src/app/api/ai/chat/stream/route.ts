import { requireAuth } from "@/lib/auth/guards";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import {
  aiNotConfiguredResponse,
  AI_NOT_CONFIGURED_USER_MESSAGE,
} from "@/lib/integrations/integration-errors";

/**
 * Streaming endpoint — does NOT fake SSE.
 * - AI not configured → 503 JSON AI_NOT_CONFIGURED (no OpenAI call)
 * - Configured but streaming not safely wired through orchestrator → 501 STREAMING_PENDING
 * Clients should use non-streaming POST /api/ai/chat until streaming is ready.
 */
export async function POST(_request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  if (!AI_CONFIG.isConfigured) {
    return aiNotConfiguredResponse(AI_NOT_CONFIGURED_USER_MESSAGE);
  }

  return Response.json(
    {
      success: false as const,
      error: {
        code: "STREAMING_PENDING",
        message:
          "Streaming ainda não está disponível com segurança. Use o endpoint não-streaming /api/ai/chat.",
        fallback: "/api/ai/chat",
      },
      code: "STREAMING_PENDING",
      fallback: "/api/ai/chat",
    },
    { status: 501 }
  );
}
