import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { patchAssistantConversation } from "@/lib/ai/assistant";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;
  const { id } = await ctx.params;

  const conversation = await prisma.aIConversation.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
  if (!conversation) return apiFailure("NOT_FOUND", "Conversa não encontrada.", 404);
  return apiSuccess({ conversation });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;
  const { id } = await ctx.params;

  const body = await request.json().catch(() => ({}));
  const patch: {
    title?: string;
    pinned?: boolean;
    favorite?: boolean;
    archived?: boolean;
  } = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.pinned === "boolean") patch.pinned = body.pinned;
  if (typeof body.favorite === "boolean") patch.favorite = body.favorite;
  if (typeof body.archived === "boolean") patch.archived = body.archived;

  if (Object.keys(patch).length === 0) {
    return apiFailure("VALIDATION", "Nada para atualizar.", 400);
  }

  const updated = await patchAssistantConversation(user.id, id, patch);
  if (!updated) return apiFailure("NOT_FOUND", "Conversa não encontrada.", 404);
  return apiSuccess({ conversation: updated });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;
  const { id } = await ctx.params;

  const existing = await prisma.aIConversation.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return apiFailure("NOT_FOUND", "Conversa não encontrada.", 404);

  await prisma.aIConversation.update({
    where: { id },
    data: { deletedAt: new Date(), status: "INACTIVE" },
  });
  return apiSuccess({ deleted: true });
}
