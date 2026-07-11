import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

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
