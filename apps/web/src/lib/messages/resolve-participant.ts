import { prisma } from "@/lib/prisma";

/** Aceita userId, PartnerProfile.id ou OngProfile.id e devolve o User.id. */
export async function resolveMessagingUserId(rawId: string): Promise<string | null> {
  const id = rawId.trim();
  if (!id) return null;

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (user) return user.id;

  const [partner, ong] = await Promise.all([
    prisma.partnerProfile.findUnique({ where: { id }, select: { userId: true } }),
    prisma.ongProfile.findUnique({ where: { id }, select: { userId: true } }),
  ]);
  return partner?.userId ?? ong?.userId ?? null;
}
