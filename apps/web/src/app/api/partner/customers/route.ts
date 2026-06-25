import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireApprovedPartner } from "@/lib/auth/require-auth";

type CustomerAgg = {
  userId: string;
  name: string;
  since: string;
  ordersCount: number;
  appointmentsCount: number;
  totalSpent: number;
  lastInteraction: string;
};

/**
 * Clientes do parceiro: usuários que compraram (orders) ou agendaram
 * (appointments) com este parceiro. Apenas dados próprios — agregado por usuário.
 */
export async function GET() {
  const { user, error } = await requireApprovedPartner();
  if (error) return error;
  const partnerId = user!.id;

  const [orders, appointments] = await Promise.all([
    prisma.order.findMany({
      where: { partnerId },
      select: { userId: true, total: true, createdAt: true },
    }),
    prisma.appointment.findMany({
      where: { partnerId },
      select: { userId: true, scheduledAt: true, createdAt: true },
    }),
  ]);

  const agg = new Map<string, Omit<CustomerAgg, "name" | "since">>();
  const bump = (userId: string | null, when: Date) => {
    if (!userId) return agg.get("") ?? null;
    const cur =
      agg.get(userId) ?? {
        userId,
        ordersCount: 0,
        appointmentsCount: 0,
        totalSpent: 0,
        lastInteraction: when.toISOString(),
      };
    if (when.toISOString() > cur.lastInteraction) cur.lastInteraction = when.toISOString();
    agg.set(userId, cur);
    return cur;
  };

  for (const o of orders) {
    const cur = bump(o.userId, o.createdAt);
    if (cur) {
      cur.ordersCount += 1;
      cur.totalSpent += o.total;
    }
  }
  for (const a of appointments) {
    const cur = bump(a.userId, a.createdAt ?? a.scheduledAt);
    if (cur) cur.appointmentsCount += 1;
  }

  const userIds = [...agg.keys()];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, createdAt: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const customers: CustomerAgg[] = userIds
    .map((id) => {
      const base = agg.get(id)!;
      const u = userMap.get(id);
      return {
        ...base,
        name: u?.name ?? "—",
        since: (u?.createdAt ?? new Date()).toISOString(),
      };
    })
    .sort((a, b) => (a.lastInteraction < b.lastInteraction ? 1 : -1));

  return apiSuccess({ customers, total: customers.length });
}
