import { UserRole } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { error } = await requireRole(UserRole.ADMIN);
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const topic = url.searchParams.get("topic") || undefined;
  const q = url.searchParams.get("q") || undefined;
  const take = Math.min(Number(url.searchParams.get("take") || 50), 100);

  const events = await prisma.mpWebhookEvent.findMany({
    where: {
      ...(status ? { processingStatus: status as never } : {}),
      ...(topic ? { panelTopic: topic } : {}),
      ...(q
        ? {
            OR: [
              { resourceId: { contains: q } },
              { providerEventId: { contains: q } },
              { orderId: { contains: q } },
              { eventType: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return apiSuccess({ events });
}
