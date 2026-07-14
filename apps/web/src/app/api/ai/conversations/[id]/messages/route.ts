import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { runEcoPetAI } from "@/lib/ai/ai-orchestrator";
import { normalizeLocale } from "@/lib/ai/ai-config";
import type { AiModule } from "@/lib/ai/ai-config";
import { aiFailureResponse } from "@/lib/ai/ai-route-helper";
import { isAiNotConfiguredCode } from "@/lib/ai/ai-errors";
import {
  AI_NOT_CONFIGURED_USER_MESSAGE,
  INTEGRATION_ERROR_CODES,
} from "@/lib/integrations/integration-errors";

const schema = z
  .object({
    message: z.string().min(1).max(8000).optional(),
    locale: z.string().optional(),
    regenerate: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.regenerate && !data.message?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mensagem obrigatória",
        path: ["message"],
      });
    }
  });

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;
  const { id } = await ctx.params;

  const conversation = await prisma.aIConversation.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });
  if (!conversation) return apiFailure("NOT_FOUND", "Conversa não encontrada.", 404);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
  }

  let input = parsed.data.message?.trim() ?? "";

  if (parsed.data.regenerate) {
    const lastUser = await prisma.aIMessage.findFirst({
      where: { conversationId: conversation.id, role: "user" },
      orderBy: { createdAt: "desc" },
    });
    if (!lastUser) {
      return apiFailure("VALIDATION", "Nenhuma mensagem do usuário para regenerar.", 400);
    }
    input = lastUser.content;

    // Remove trailing assistant reply(ies) and the last user turn so runEcoPetAI re-appends cleanly
    await prisma.aIMessage.deleteMany({
      where: {
        conversationId: conversation.id,
        createdAt: { gte: lastUser.createdAt },
      },
    });
  }

  const aiModule = (conversation.module as AiModule) || "eccopet-ai";
  const result = await runEcoPetAI({
    userId: user.id,
    role: user.role,
    module: aiModule,
    action: "chat",
    input,
    locale: normalizeLocale(parsed.data.locale ?? conversation.locale),
    conversationId: conversation.id,
  });

  if (!result.success) {
    const code = result.error?.code ?? "AI_ERROR";
    const message = result.error?.message ?? AI_NOT_CONFIGURED_USER_MESSAGE;
    if (isAiNotConfiguredCode(code)) {
      return Response.json(
        {
          success: false as const,
          error: { code: INTEGRATION_ERROR_CODES.AI_NOT_CONFIGURED, message },
          reply: null,
        },
        { status: 503 }
      );
    }
    return aiFailureResponse(result);
  }

  await prisma.aIConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  return apiSuccess({ ...result, reply: result.content });
}
