import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { runEcoPetAI } from "@/lib/ai/ai-orchestrator";
import { normalizeLocale } from "@/lib/ai/ai-config";
import type { AiModule } from "@/lib/ai/ai-config";

const schema = z.object({
  message: z.string().min(1).max(8000),
  locale: z.string().optional(),
  regenerate: z.boolean().optional(),
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

  const aiModule = (conversation.module as AiModule) || "ecopet-ai";
  const result = await runEcoPetAI({
    userId: user.id,
    role: user.role,
    module: aiModule,
    action: parsed.data.regenerate ? "chat" : "chat",
    input: parsed.data.message,
    locale: normalizeLocale(parsed.data.locale ?? conversation.locale),
    conversationId: conversation.id,
  });

  if (!result.success) {
    return apiFailure(result.error?.code ?? "AI_ERROR", result.error?.message ?? "Erro na IA.", 503);
  }

  await prisma.aIConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  return apiSuccess({ ...result, reply: result.content });
}
