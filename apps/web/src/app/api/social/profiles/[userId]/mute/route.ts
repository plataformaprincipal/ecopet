import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ userId: string }> };

/** Silenciar autor no feed (persistente). */
export async function POST(_req: Request, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { userId } = await params;
  if (userId === user!.id) {
    return apiFailure("VALIDATION", "Você não pode silenciar a si mesmo.", 400);
  }
  await prisma.userSocialMute.upsert({
    where: { muterId_mutedId: { muterId: user!.id, mutedId: userId } },
    create: { muterId: user!.id, mutedId: userId },
    update: {},
  });
  return apiSuccess({ muted: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { userId } = await params;
  await prisma.userSocialMute.deleteMany({
    where: { muterId: user!.id, mutedId: userId },
  });
  return apiSuccess({ muted: false });
}
