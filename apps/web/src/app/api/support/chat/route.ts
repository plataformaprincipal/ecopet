import { z } from "zod";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { checkDistributedRateLimit, clientIp } from "@/lib/rate-limit";
import {
  getOrCreateGuestSupportBootstrap,
  runPlatformSupportChat,
} from "@/lib/support/platform-support-service";

const bodySchema = z.object({
  message: z.string().min(1).max(2000).optional(),
  guestId: z.string().min(8).max(128).optional(),
  sessionId: z.string().min(8).max(128).optional(),
  bootstrap: z.boolean().optional(),
  escalate: z.boolean().optional(),
  category: z
    .enum(["ACCOUNT", "PAYMENT", "ORDER", "TECHNICAL", "PARTNER", "ONG", "PET", "OTHER"])
    .optional(),
  context: z
    .object({
      pathname: z.string().max(200).optional(),
      locale: z.string().max(16).optional(),
      errorCategory: z.string().max(64).optional().nullable(),
      publicErrorCode: z.string().max(64).optional().nullable(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!(await checkDistributedRateLimit(`support-chat:${ip}`, 30, 60_000))) {
    return apiFailure("RATE_LIMITED", "Muitas mensagens. Aguarde um momento e tente novamente.", 429);
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiFailure("VALIDATION", "Dados inválidos.", 400);
  }

  const user = await getCurrentUser();

  if (parsed.data.bootstrap) {
    if (parsed.data.guestId) {
      const session = await getOrCreateGuestSupportBootstrap(
        parsed.data.guestId,
        parsed.data.sessionId
      );
      return apiSuccess({ session });
    }
    if (user) {
      return apiSuccess({
        session: {
          id: "auth",
          guestId: null,
          sessionId: "auth",
          status: "AUTHENTICATED",
          messages: [
            {
              id: "welcome",
              role: "assistant",
              content: "Olá. Sou o suporte EccoPet. Como posso ajudar?",
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });
    }
    return apiFailure("VALIDATION", "guestId obrigatório para visitante.", 400);
  }

  if (!parsed.data.message) {
    return apiFailure("VALIDATION", "Mensagem obrigatória.", 400);
  }

  if (!user && !parsed.data.guestId) {
    return apiFailure("VALIDATION", "guestId obrigatório para visitante.", 400);
  }

  const result = await runPlatformSupportChat({
    message: parsed.data.message,
    guestId: parsed.data.guestId,
    sessionId: parsed.data.sessionId,
    userId: user?.id ?? null,
    userRole: user?.role ?? null,
    escalate: parsed.data.escalate,
    category: parsed.data.category,
    context: {
      ...parsed.data.context,
      authStatus: user ? "authenticated" : "anonymous",
      userRole: user?.role ?? null,
    },
  });

  return apiSuccess(result);
}
