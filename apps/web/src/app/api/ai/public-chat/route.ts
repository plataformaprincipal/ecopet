import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { checkDistributedRateLimit, clientIp } from "@/lib/rate-limit";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { guestMaxMessageChars, runPublicGuestChat } from "@/lib/ai/public-guest-chat";

function nextPublicChatEnvSnapshot() {
  const aiEnabledRaw = process.env.AI_ENABLED;
  return {
    aiEnabledPresent: aiEnabledRaw !== undefined,
    aiEnabled: aiEnabledRaw !== "false" && process.env.OPENAI_PAUSED !== "1",
    apiKeyPresent: Boolean(process.env.OPENAI_API_KEY?.trim()),
    model: AI_CONFIG.model,
    isConfigured: AI_CONFIG.isConfigured,
    globallyEnabled: AI_CONFIG.globallyEnabled,
  };
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  message: z.string().min(1),
  locale: z.string().max(16).optional(),
  pagePath: z.string().max(200).optional(),
  lat: z.number().finite().min(-90).max(90).optional(),
  lng: z.number().finite().min(-180).max(180).optional(),
});

/**
 * Chat público da EccoPet AI — visitante sem sessão.
 * Sem autenticação, limitado por IP, e restrito a dados públicos.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!(await checkDistributedRateLimit(`ai-public-chat:${ip}`, 12, 60_000))) {
    return apiFailure(
      "RATE_LIMITED",
      "Muitas mensagens em pouco tempo. Aguarde um momento e tente novamente.",
      429
    );
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiFailure("VALIDATION", "Mensagem inválida.", 400);
  }
  if (parsed.data.message.trim().length > guestMaxMessageChars()) {
    return apiFailure(
      "VALIDATION",
      `Mensagem muito longa. Limite de ${guestMaxMessageChars()} caracteres.`,
      400
    );
  }

  const envSnapshot = nextPublicChatEnvSnapshot();
  console.info(JSON.stringify({ scope: "AI_PUBLIC_CHAT", ...envSnapshot }));

  const result = await runPublicGuestChat({
    message: parsed.data.message,
    locale: parsed.data.locale,
    pagePath: parsed.data.pagePath,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
  });

  console.info(
    JSON.stringify({
      scope: "AI_PUBLIC_CHAT",
      available: result.available,
      requiresSignIn: result.requiresSignIn,
      providerErrorStatus: result._diag?.providerStatus ?? null,
      fallbackReason: result._diag?.fallbackReason ?? null,
      providerCode: result._diag?.providerCode ?? null,
    })
  );

  const { _diag: _ignored, ...clientResult } = result;
  return apiSuccess(clientResult);
}
