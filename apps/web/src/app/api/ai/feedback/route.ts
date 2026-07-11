import { z } from "zod";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  conversationId: z.string().optional(),
  messageId: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  positive: z.boolean().optional(),
  comment: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiFailure("VALIDATION", "Dados inválidos", 400);
  }

  const rating =
    parsed.data.rating ??
    (parsed.data.positive === true ? 5 : parsed.data.positive === false ? 1 : null);

  const feedback = await prisma.aIFeedback.create({
    data: {
      userId: user.id,
      conversationId: parsed.data.conversationId,
      messageId: parsed.data.messageId,
      rating: rating ?? undefined,
      comment: parsed.data.comment,
    },
  });

  return apiSuccess({ feedback });
}
