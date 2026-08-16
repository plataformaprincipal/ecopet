import { AI_CONFIG } from "@/lib/ai/ai-config";
import { apiSuccess } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Diagnóstico seguro do runtime de IA no Next.js (sem secrets).
 * GET /api/ai/runtime-status
 */
export async function GET() {
  const user = await getCurrentUser();
  const payload = {
    aiEnabled: AI_CONFIG.globallyEnabled,
    apiKeyPresent: Boolean(AI_CONFIG.apiKey),
    model: AI_CONFIG.model,
    isConfigured: AI_CONFIG.isConfigured,
    openaiClientReady: AI_CONFIG.isConfigured,
    session: {
      cookieUserResolved: Boolean(user),
      userIdPresent: Boolean(user?.id),
      role: user?.role ?? null,
    },
    entryPoints: {
      publicChat: "/api/ai/public-chat",
      authChat: "/api/ai/chat",
      authStream: "/api/ai/chat/stream",
      support: "/api/support/chat",
      toolsConfirm: "/api/ai/tools/confirm",
      conversations: "/api/ai/conversations",
    },
    note: "IA de produto roda no Next.js (same-origin). Não use /api/ecopet para /api/ai/*.",
  };

  console.info(
    JSON.stringify({
      scope: "AI_RUNTIME",
      aiEnabled: payload.aiEnabled,
      apiKeyPresent: payload.apiKeyPresent,
      model: payload.model,
      isConfigured: payload.isConfigured,
      userResolved: payload.session.cookieUserResolved,
    })
  );

  return apiSuccess(payload);
}
