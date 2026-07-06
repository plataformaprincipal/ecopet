import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const items = await prisma.notification.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, title: true, message: true, body: true, read: true, createdAt: true },
  });

  const unread = await prisma.notification.count({
    where: { userId: user!.id, read: false },
  });

  return apiSuccess({
    items: items.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body ?? n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    unread,
  });
}
