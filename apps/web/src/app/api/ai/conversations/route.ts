import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { createConversation } from "@/lib/ai/memory/store";
import { normalizeLocale } from "@/lib/ai/ai-config";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const conversations = await prisma.aIConversation.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      module: true,
      locale: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return apiSuccess({ conversations });
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth();
  if (error || !user) return error!;

  const body = await request.json().catch(() => ({}));
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 120)
      : undefined;
  const locale = normalizeLocale(
    typeof body.locale === "string" ? body.locale : undefined
  );

  try {
    const conversation = await createConversation({
      userId: user.id,
      module: "eccopet-ai",
      role: String(user.role),
      locale,
      title,
      agentCode: "client",
    });
    return apiSuccess({ conversation }, 201);
  } catch {
    return apiFailure("INTERNAL", "Não foi possível criar a conversa.", 500);
  }
}
