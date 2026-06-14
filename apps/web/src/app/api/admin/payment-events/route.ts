import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const events = await prisma.paymentEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess({
    events: events.map((e) => ({
      id: e.id,
      paymentId: e.paymentId,
      orderId: e.orderId,
      provider: e.provider,
      eventType: e.eventType,
      status: e.status,
      errorCode: e.errorCode,
      message: e.message,
      createdAt: e.createdAt.toISOString(),
    })),
    total: events.length,
  });
}
