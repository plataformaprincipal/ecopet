import { requireAuth } from "@/lib/auth/guards";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import {
  aiNotConfiguredResponse,
  AI_NOT_CONFIGURED_USER_MESSAGE,
} from "@/lib/integrations/integration-errors";
import { streamAssistantChat } from "@/lib/ai/assistant";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * SSE streaming do Assistente Virtual.
 * Fallback documentado: POST /api/ai/chat
 */
export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  if (!AI_CONFIG.isConfigured) {
    return aiNotConfiguredResponse(AI_NOT_CONFIGURED_USER_MESSAGE);
  }

  let body: {
    message?: string;
    conversationId?: string;
    locale?: string;
    petId?: string;
    pagePath?: string;
    module?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: { code: "VALIDATION", message: "JSON inválido" } },
      { status: 400 }
    );
  }

  const message = typeof body.message === "string" ? body.message : "";
  if (!message.trim()) {
    return Response.json(
      { success: false, error: { code: "VALIDATION", message: "Mensagem vazia" } },
      { status: 400 }
    );
  }

  const profile = await prisma.user
    .findUnique({
      where: { id: user.id },
      select: { name: true },
    })
    .catch(() => null);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        for await (const event of streamAssistantChat({
          userId: user.id,
          role: user.role,
          message,
          conversationId: body.conversationId,
          locale: body.locale,
          petId: body.petId,
          pagePath: typeof body.pagePath === "string" ? body.pagePath.slice(0, 200) : undefined,
          module: typeof body.module === "string" ? body.module.slice(0, 64) : undefined,
          ip: clientIp(request),
          displayName: profile?.name?.split(/\s+/)[0] ?? null,
        })) {
          if (request.signal.aborted) break;
          send(event);
        }
      } catch (e) {
        send({
          type: "error",
          code: "AI_ERROR",
          message: e instanceof Error ? e.message : "Falha no stream",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
