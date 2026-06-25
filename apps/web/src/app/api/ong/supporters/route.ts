import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireOngWithAccess } from "@/lib/ong/require-ong-access";

type Supporter = {
  userId: string;
  name: string;
  follows: boolean;
  adoptionRequests: number;
  lastInteraction: string;
};

/**
 * Apoiadores da ONG: pessoas que solicitaram adoção ou seguem a ONG.
 * Não expõe e-mail/telefone — apenas nome e tipo de interação.
 */
export async function GET() {
  const { user, error } = await requireOngWithAccess();
  if (error) return error;
  const ongId = user!.id;

  const [requests, follows] = await Promise.all([
    prisma.adoptionRequest.findMany({
      where: { ongId },
      select: { requesterId: true, createdAt: true, requester: { select: { name: true } } },
    }),
    prisma.userFollow.findMany({
      where: { followingId: ongId },
      select: { followerId: true, createdAt: true, follower: { select: { name: true } } },
    }),
  ]);

  const map = new Map<string, Supporter>();
  const touch = (userId: string, name: string | null, when: Date) => {
    const cur =
      map.get(userId) ??
      ({
        userId,
        name: name ?? "—",
        follows: false,
        adoptionRequests: 0,
        lastInteraction: when.toISOString(),
      } satisfies Supporter);
    if (when.toISOString() > cur.lastInteraction) cur.lastInteraction = when.toISOString();
    if (name && cur.name === "—") cur.name = name;
    map.set(userId, cur);
    return cur;
  };

  for (const r of requests) {
    const s = touch(r.requesterId, r.requester?.name ?? null, r.createdAt);
    s.adoptionRequests += 1;
  }
  for (const f of follows) {
    const s = touch(f.followerId, f.follower?.name ?? null, f.createdAt);
    s.follows = true;
  }

  const supporters = [...map.values()].sort((a, b) =>
    a.lastInteraction < b.lastInteraction ? 1 : -1
  );

  return apiSuccess({ supporters, total: supporters.length });
}
